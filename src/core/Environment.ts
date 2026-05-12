export interface EnvVars {
  [key: string]: string;
}

export class Environment {
  private vars: EnvVars;
  private aliases: Map<string, string>;
  private history: string[];
  private historyIndex: number;

  constructor() {
    this.vars = {
      HOME: '/home/root',
      USER: 'root',
      HOSTNAME: 'hackterm',
      SHELL: '/bin/bash',
      TERM: 'xterm-256color',
      LANG: 'en_US.UTF-8',
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/data/data/com.hackterm/files/usr/bin',
      PS1: '\\u@\\h:\\w\\$ ',
      EDITOR: 'nano',
      PAGER: 'less',
      TMPDIR: '/tmp',
      PREFIX: '/data/data/com.hackterm/files/usr',
      COLORTERM: 'truecolor',
      TERM_PROGRAM: 'HackTerm',
      TERM_PROGRAM_VERSION: '1.0.0',
    };

    this.aliases = new Map([
      ['ll', 'ls -la'],
      ['la', 'ls -la'],
      ['l', 'ls -la'],
      ['cls', 'clear'],
      ['please', 'sudo'],
      ['apt-get', 'apt'],
      ['..', 'cd ..'],
      ['...', 'cd ../..'],
      ['grep', 'grep --color=auto'],
      ['egrep', 'egrep --color=auto'],
      ['fgrep', 'fgrep --color=auto'],
    ]);

    this.history = [];
    this.historyIndex = -1;
  }

  get(key: string): string {
    return this.vars[key] ?? '';
  }

  set(key: string, value: string): void {
    this.vars[key] = value;
  }

  unset(key: string): void {
    delete this.vars[key];
  }

  getAll(): EnvVars {
    return { ...this.vars };
  }

  expandVars(input: string): string {
    return input.replace(/\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, braced, bare) => {
      const key = braced ?? bare;
      return this.vars[key] ?? '';
    });
  }

  getAlias(name: string): string | undefined {
    return this.aliases.get(name);
  }

  setAlias(name: string, value: string): void {
    this.aliases.set(name, value);
  }

  removeAlias(name: string): void {
    this.aliases.delete(name);
  }

  listAliases(): string[] {
    return Array.from(this.aliases.entries()).map(([k, v]) => `alias ${k}='${v}'`);
  }

  addHistory(cmd: string): void {
    if (cmd.trim() && cmd !== this.history[this.history.length - 1]) {
      this.history.push(cmd);
    }
    this.historyIndex = this.history.length;
  }

  getHistory(): string[] {
    return [...this.history];
  }

  historyPrev(): string | null {
    if (this.history.length === 0) return null;
    this.historyIndex = Math.max(0, this.historyIndex - 1);
    return this.history[this.historyIndex] ?? null;
  }

  historyNext(): string | null {
    if (this.historyIndex >= this.history.length - 1) {
      this.historyIndex = this.history.length;
      return '';
    }
    this.historyIndex++;
    return this.history[this.historyIndex] ?? '';
  }

  resetHistoryIndex(): void {
    this.historyIndex = this.history.length;
  }
}
