import { VirtualFileSystem } from './FileSystem';
import { Environment } from './Environment';
import { PackageManager } from './PackageManager';
import { getAllCommands, CommandRegistry } from '../commands';

export interface CommandContext {
  fs: VirtualFileSystem;
  env: Environment;
  pm: PackageManager;
  output: (text: string, type?: OutputType) => void;
  setInput?: (text: string) => void;
}

export type OutputType = 'normal' | 'error' | 'success' | 'warning' | 'info' | 'system' | 'prompt';

export interface OutputLine {
  id: string;
  text: string;
  type: OutputType;
  timestamp: number;
}

let lineCounter = 0;
export function makeLine(text: string, type: OutputType = 'normal'): OutputLine {
  return { id: `line-${++lineCounter}`, text, type, timestamp: Date.now() };
}

export class CommandProcessor {
  private registry: CommandRegistry;
  private context: CommandContext;
  private outputBuffer: OutputLine[];

  constructor(fs: VirtualFileSystem, env: Environment, pm: PackageManager) {
    this.registry = getAllCommands();
    this.outputBuffer = [];
    this.context = {
      fs,
      env,
      pm,
      output: (text: string, type: OutputType = 'normal') => {
        this.outputBuffer.push(makeLine(text, type));
      },
    };
  }

  async execute(
    rawInput: string,
    onOutput: (lines: OutputLine[]) => void,
    onDone: () => void
  ): Promise<void> {
    const input = rawInput.trim();
    if (!input) {
      onDone();
      return;
    }

    this.context.env.addHistory(input);

    // Handle multiple commands separated by ; && ||
    const pipelines = this.splitCommands(input);

    for (const pipeline of pipelines) {
      const { cmd, args, operator } = pipeline;

      // Expand aliases
      const expanded = this.expandAlias(cmd, args);
      const finalCmd = expanded.cmd;
      const finalArgs = expanded.args;

      // Expand env vars in args
      const expandedArgs = finalArgs.map(a => this.context.env.expandVars(a));

      // Handle built-in redirections
      let outputFile: string | null = null;
      let appendFile: string | null = null;
      const cleanArgs = this.extractRedirects(expandedArgs, (file, append) => {
        if (append) appendFile = file;
        else outputFile = file;
      });

      this.outputBuffer = [];

      const handler = this.registry.get(finalCmd);
      if (!handler) {
        this.outputBuffer.push(makeLine(
          `bash: ${finalCmd}: command not found`,
          'error'
        ));
      } else {
        try {
          const flush = () => {
            if (this.outputBuffer.length > 0) {
              onOutput([...this.outputBuffer]);
              this.outputBuffer = [];
            }
          };
          const ctx = {
            ...this.context,
            output: (text: string, type: OutputType = 'normal') => {
              this.outputBuffer.push(makeLine(text, type));
              if (this.outputBuffer.length >= 10) flush();
            },
          };
          await handler(finalCmd, cleanArgs, ctx);
          flush();
        } catch (e: any) {
          this.outputBuffer.push(makeLine(`bash: ${finalCmd}: ${e?.message ?? 'unknown error'}`, 'error'));
        }
      }

      // Handle file redirection
      if (outputFile || appendFile) {
        const content = this.outputBuffer.map(l => l.text).join('\n');
        const file = outputFile ?? appendFile!;
        const resolved = this.context.fs.resolvePath(file);
        this.context.fs.writeFile(resolved, content + '\n', !!appendFile);
        this.outputBuffer = [];
      }

      if (this.outputBuffer.length > 0) {
        onOutput([...this.outputBuffer]);
        this.outputBuffer = [];
      }

      if (operator === '&&' && this.outputBuffer.some(l => l.type === 'error')) break;
    }

    onDone();
  }

  private splitCommands(input: string): Array<{ cmd: string; args: string[]; operator: string }> {
    const results: Array<{ cmd: string; args: string[]; operator: string }> = [];
    const parts = input.split(/\s*(?:&&|\|\||;)\s*/);
    const operators = [...input.matchAll(/&&|\|\||;/g)].map(m => m[0]);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      const tokens = this.tokenize(part);
      if (tokens.length === 0) continue;
      results.push({
        cmd: tokens[0],
        args: tokens.slice(1),
        operator: operators[i] ?? ';',
      });
    }
    return results;
  }

  tokenize(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (ch === "'" && !inDouble) {
        inSingle = !inSingle;
      } else if (ch === '"' && !inSingle) {
        inDouble = !inDouble;
      } else if (ch === ' ' && !inSingle && !inDouble) {
        if (current) { tokens.push(current); current = ''; }
      } else {
        current += ch;
      }
    }
    if (current) tokens.push(current);
    return tokens;
  }

  private expandAlias(cmd: string, args: string[]): { cmd: string; args: string[] } {
    const alias = this.context.env.getAlias(cmd);
    if (!alias) return { cmd, args };
    const tokens = this.tokenize(alias);
    return { cmd: tokens[0], args: [...tokens.slice(1), ...args] };
  }

  private extractRedirects(
    args: string[],
    onRedirect: (file: string, append: boolean) => void
  ): string[] {
    const clean: string[] = [];
    let i = 0;
    while (i < args.length) {
      if (args[i] === '>' && i + 1 < args.length) {
        onRedirect(args[i + 1], false);
        i += 2;
      } else if (args[i] === '>>' && i + 1 < args.length) {
        onRedirect(args[i + 1], true);
        i += 2;
      } else if (args[i].startsWith('>') && args[i].length > 1) {
        onRedirect(args[i].slice(1), false);
        i++;
      } else {
        clean.push(args[i]);
        i++;
      }
    }
    return clean;
  }

  getContext(): CommandContext {
    return this.context;
  }
}
