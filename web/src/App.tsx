import React, { useState, useCallback, useRef, useEffect } from 'react';
import './styles/terminal.css';
import { TerminalOutput } from './components/TerminalOutput';
import { TerminalInput } from './components/TerminalInput';
import { StatusBar } from './components/StatusBar';
import { CommandProcessor, OutputLine, makeLine } from './core/CommandProcessor';
import { VirtualFileSystem } from './core/FileSystem';
import { Environment } from './core/Environment';
import { PackageManager } from './core/PackageManager';
import { getAllCommands } from './commands';

function buildPrompt(user: string, host: string, path: string): string {
  const p = path === '/home/root' ? '~' :
    path.startsWith('/home/root/') ? '~' + path.slice(10) : path;
  const sym = user === 'root' ? '#' : '$';
  return `${user}@${host}:${p}${sym} `;
}

export default function App() {
  const [lines, setLines] = useState<OutputLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [promptInfo, setPromptInfo] = useState({ user: 'root', host: 'hackterm', path: '/home/root' });

  const fsRef = useRef(new VirtualFileSystem());
  const envRef = useRef(new Environment());
  const pmRef = useRef(new PackageManager());
  const processorRef = useRef(
    new CommandProcessor(fsRef.current, envRef.current, pmRef.current)
  );
  const allCmdsRef = useRef(Array.from(getAllCommands().keys()));

  const appendLines = (newLines: OutputLine[]) => {
    setLines(prev => [...prev, ...newLines]);
  };

  const updatePrompt = () => {
    setPromptInfo({
      user: envRef.current.get('USER') || 'root',
      host: envRef.current.get('HOSTNAME') || 'hackterm',
      path: fsRef.current.getCwd(),
    });
  };

  // Boot sequence
  useEffect(() => {
    const boot: OutputLine[] = [
      makeLine(''),
      makeLine('  ██╗  ██╗ █████╗  ██████╗██╗  ██╗████████╗███████╗██████╗ ███╗   ███╗', 'success'),
      makeLine('  ██║  ██║██╔══██╗██╔════╝██║ ██╔╝╚══██╔══╝██╔════╝██╔══██╗████╗ ████║', 'success'),
      makeLine('  ███████║███████║██║     █████╔╝    ██║   █████╗  ██████╔╝██╔████╔██║', 'success'),
      makeLine('  ██╔══██║██╔══██║██║     ██╔═██╗    ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║', 'success'),
      makeLine('  ██║  ██║██║  ██║╚██████╗██║  ██╗   ██║   ███████╗██║  ██║██║ ╚═╝ ██║', 'success'),
      makeLine('  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝', 'success'),
      makeLine(''),
      makeLine('  iOS Linux Terminal v1.0.0 · aarch64 · HackTerm OS', 'info'),
      makeLine('  ─────────────────────────────────────────────────', 'system'),
      makeLine(`  System boot: ${new Date().toLocaleString()}`, 'system'),
      makeLine('  Kernel: Linux 5.15.0-hackterm aarch64 GNU/Linux', 'system'),
      makeLine('  Shell:  /bin/bash (GNU bash 5.2.26)', 'system'),
      makeLine(''),
      makeLine('  Type "help" for available commands', 'warning'),
      makeLine('  Type "apt install <package>" to install tools', 'warning'),
      makeLine(''),
    ];
    setLines(boot);
  }, []);

  const handleSubmit = useCallback(async (cmd: string) => {
    if (cmd === '__INTERRUPT__') {
      if (isRunning) setIsRunning(false);
      setLines(prev => [...prev, makeLine('^C', 'error')]);
      return;
    }

    if (isRunning) return;

    const prompt = buildPrompt(promptInfo.user, promptInfo.host, promptInfo.path);

    if (!cmd.trim()) {
      setLines(prev => [...prev, makeLine(prompt, 'prompt')]);
      return;
    }

    setLines(prev => [...prev, makeLine(`${prompt}${cmd}`, 'prompt')]);
    setIsRunning(true);
    setSuggestions([]);

    await processorRef.current.execute(
      cmd,
      (batch) => {
        setLines(prev => [...prev, ...batch]);
      },
      () => {
        setIsRunning(false);
        updatePrompt();
      }
    );
  }, [isRunning, promptInfo]);

  const handleHistoryPrev = useCallback(() => envRef.current.historyPrev(), []);
  const handleHistoryNext = useCallback(() => envRef.current.historyNext(), []);

  const handleTab = useCallback((partial: string): string[] => {
    const fs = fsRef.current;
    const cwd = fs.getCwd();

    if (!partial.includes('/')) {
      const matches = allCmdsRef.current.filter(c => c.startsWith(partial));
      if (matches.length > 0) return matches.sort().slice(0, 12);
    }

    const lastSlash = partial.lastIndexOf('/');
    const dirPart = lastSlash !== -1 ? partial.slice(0, lastSlash) : '';
    const namePart = lastSlash !== -1 ? partial.slice(lastSlash + 1) : partial;
    const searchDir = dirPart ? fs.resolvePath(dirPart) : cwd;
    return fs.listDir(searchDir)
      .filter(e => e.name.startsWith(namePart))
      .map(e => {
        const base = dirPart ? `${dirPart}/${e.name}` : e.name;
        return e.type === 'directory' ? `${base}/` : base;
      })
      .sort()
      .slice(0, 12);
  }, []);

  const handleSuggestionSelect = useCallback((suggestion: string, current: string): string => {
    const parts = current.split(' ');
    const partial = parts[parts.length - 1];
    return current.slice(0, current.length - partial.length) + suggestion + ' ';
  }, []);

  const prompt = buildPrompt(promptInfo.user, promptInfo.host, promptInfo.path);

  return (
    <div className="terminal-app">
      <StatusBar
        user={promptInfo.user}
        host={promptInfo.host}
        path={promptInfo.path}
        isRunning={isRunning}
      />
      <TerminalOutput lines={lines} />
      <TerminalInput
        prompt={prompt}
        suggestions={suggestions}
        onSubmit={handleSubmit}
        onHistoryPrev={handleHistoryPrev}
        onHistoryNext={handleHistoryNext}
        onTab={handleTab}
        onSuggestionSelect={handleSuggestionSelect}
        onSuggestionsChange={setSuggestions}
        disabled={false}
      />
    </div>
  );
}
