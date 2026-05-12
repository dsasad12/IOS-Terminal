import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
} from 'react-native';
import { TerminalOutput } from './TerminalOutput';
import { TerminalInput } from './TerminalInput';
import { HackStatusBar } from './StatusBar';
import { CommandProcessor, OutputLine, makeLine } from '../core/CommandProcessor';
import { VirtualFileSystem } from '../core/FileSystem';
import { Environment } from '../core/Environment';
import { PackageManager } from '../core/PackageManager';
import { getAllCommands } from '../commands';
import { Colors } from '../theme/colors';

interface PromptState {
  user: string;
  host: string;
  path: string;
  isRoot: boolean;
}

function buildPrompt(state: PromptState): string {
  const pathDisplay = state.path === '/home/root' ? '~' :
    state.path.startsWith('/home/root/') ? '~' + state.path.slice(10) : state.path;
  const symbol = state.isRoot ? '#' : '$';
  return `${state.user}@${state.host}:${pathDisplay}${symbol} `;
}

export const Terminal: React.FC = () => {
  const [lines, setLines] = useState<OutputLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [promptState, setPromptState] = useState<PromptState>({
    user: 'root',
    host: 'hackterm',
    path: '/home/root',
    isRoot: true,
  });

  const fsRef = useRef(new VirtualFileSystem());
  const envRef = useRef(new Environment());
  const pmRef = useRef(new PackageManager());
  const processorRef = useRef(
    new CommandProcessor(fsRef.current, envRef.current, pmRef.current)
  );

  const appendLines = useCallback((newLines: OutputLine[]) => {
    setLines(prev => [...prev, ...newLines]);
  }, []);

  const updatePromptState = useCallback(() => {
    const fs = fsRef.current;
    const env = envRef.current;
    setPromptState({
      user: env.get('USER') || 'root',
      host: env.get('HOSTNAME') || 'hackterm',
      path: fs.getCwd(),
      isRoot: env.get('USER') === 'root' || env.get('USER') === '',
    });
  }, []);

  // Boot sequence
  useEffect(() => {
    const bootLines: OutputLine[] = [];

    bootLines.push(makeLine(''));
    bootLines.push(makeLine('  ██╗  ██╗ █████╗  ██████╗██╗  ██╗████████╗███████╗██████╗ ███╗   ███╗', 'success'));
    bootLines.push(makeLine('  ██║  ██║██╔══██╗██╔════╝██║ ██╔╝╚══██╔══╝██╔════╝██╔══██╗████╗ ████║', 'success'));
    bootLines.push(makeLine('  ███████║███████║██║     █████╔╝    ██║   █████╗  ██████╔╝██╔████╔██║', 'success'));
    bootLines.push(makeLine('  ██╔══██║██╔══██║██║     ██╔═██╗    ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║', 'success'));
    bootLines.push(makeLine('  ██║  ██║██║  ██║╚██████╗██║  ██╗   ██║   ███████╗██║  ██║██║ ╚═╝ ██║', 'success'));
    bootLines.push(makeLine('  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝', 'success'));
    bootLines.push(makeLine(''));
    bootLines.push(makeLine('  iOS Linux Terminal  v1.0.0 | aarch64 | HackTerm OS', 'info'));
    bootLines.push(makeLine('  ─────────────────────────────────────────────────', 'system'));
    bootLines.push(makeLine(''));
    bootLines.push(makeLine(`  System boot: ${new Date().toLocaleString()}`, 'system'));
    bootLines.push(makeLine('  Kernel: Linux 5.15.0-hackterm aarch64 GNU/Linux', 'system'));
    bootLines.push(makeLine('  Shell: /bin/bash (GNU bash 5.2.26)', 'system'));
    bootLines.push(makeLine('  Uptime: 0:00:00', 'system'));
    bootLines.push(makeLine(''));
    bootLines.push(makeLine('  Type "help" to see available commands', 'warning'));
    bootLines.push(makeLine('  Type "apt install <package>" to install tools', 'warning'));
    bootLines.push(makeLine(''));

    setLines(bootLines);
  }, []);

  const handleSubmit = useCallback(async (cmd: string) => {
    if (isRunning && !cmd) {
      // Ctrl+C
      setIsRunning(false);
      setLines(prev => [...prev, makeLine('^C', 'error')]);
      return;
    }

    if (isRunning) return;

    const prompt = buildPrompt(promptState);

    if (!cmd.trim()) {
      setLines(prev => [...prev, makeLine(prompt, 'prompt')]);
      return;
    }

    setLines(prev => [...prev, makeLine(`${prompt}${cmd}`, 'prompt')]);
    setIsRunning(true);

    const newLines: OutputLine[] = [];

    await processorRef.current.execute(
      cmd,
      (batch) => {
        newLines.push(...batch);
        setLines(prev => [...prev, ...batch]);
      },
      () => {
        setIsRunning(false);
        updatePromptState();
      }
    );
  }, [isRunning, promptState, updatePromptState]);

  const handleHistoryPrev = useCallback(() => {
    return envRef.current.historyPrev();
  }, []);

  const handleHistoryNext = useCallback(() => {
    return envRef.current.historyNext();
  }, []);

  const handleTab = useCallback((partial: string): string[] => {
    const context = processorRef.current.getContext();
    const fs = context.fs;
    const cwd = fs.getCwd();

    // Complete commands
    if (!partial.includes('/')) {
      const allCommandNames = Array.from(getAllCommands().keys());
      const matches = allCommandNames.filter(c => c.startsWith(partial));
      if (matches.length > 0) return matches.sort();
    }

    // Complete file paths
    const lastSlash = partial.lastIndexOf('/');
    const dirPart = lastSlash !== -1 ? partial.slice(0, lastSlash) : '';
    const namePart = lastSlash !== -1 ? partial.slice(lastSlash + 1) : partial;
    const searchDir = dirPart ? fs.resolvePath(dirPart) : cwd;
    const entries = fs.listDir(searchDir);
    const matches = entries
      .filter(e => e.name.startsWith(namePart))
      .map(e => {
        const base = dirPart ? `${dirPart}/${e.name}` : e.name;
        return e.type === 'directory' ? `${base}/` : base;
      });
    return matches.sort();
  }, []);

  const prompt = buildPrompt(promptState);

  return (
    <SafeAreaView style={styles.safe}>
      <RNStatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={styles.container}>
        <HackStatusBar
          cwd={promptState.path}
          user={promptState.user}
          hostname={promptState.host}
          isRunning={isRunning}
        />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.outputContainer}>
            <TerminalOutput lines={lines} />
          </View>
          <TerminalInput
            prompt={prompt}
            onSubmit={handleSubmit}
            onHistoryPrev={handleHistoryPrev}
            onHistoryNext={handleHistoryNext}
            onTab={handleTab}
            disabled={false}
          />
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  outputContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
