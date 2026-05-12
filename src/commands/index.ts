import { CommandContext } from '../core/CommandProcessor';
import { filesystemCommands } from './filesystem';
import { systemCommands } from './system';
import { textCommands } from './text';
import { networkCommands } from './network';
import { packageCommands } from './package';
import { hackingCommands } from './hacking';

export type CommandHandler = (cmd: string, args: string[], ctx: CommandContext) => Promise<void>;
export type CommandRegistry = Map<string, CommandHandler>;

export function getAllCommands(): CommandRegistry {
  const registry = new Map<string, CommandHandler>();

  const addAll = (cmds: Record<string, CommandHandler>) => {
    for (const [name, handler] of Object.entries(cmds)) {
      registry.set(name, handler);
    }
  };

  addAll(filesystemCommands);
  addAll(systemCommands);
  addAll(textCommands);
  addAll(networkCommands);
  // Package commands (apt-get mapped manually due to hyphen)
  addAll(packageCommands);
  registry.set('apt-get', packageCommands.aptget);
  addAll(hackingCommands);

  // Additional aliases
  registry.set('ll', async (cmd, args, ctx) => filesystemCommands.ls(cmd, ['-la', ...args], ctx));
  registry.set('la', async (cmd, args, ctx) => filesystemCommands.ls(cmd, ['-la', ...args], ctx));
  registry.set('l', async (cmd, args, ctx) => filesystemCommands.ls(cmd, ['-la', ...args], ctx));
  registry.set('cls', systemCommands.clear);
  registry.set('nc', networkCommands.nc);
  registry.set('netcat', networkCommands.nc);
  registry.set('python3', async (cmd, args, ctx) => {
    if (!ctx.pm.isInstalled('python')) {
      ctx.output('python3: command not found\nInstall with: apt install python', 'error'); return;
    }
    if (args[0] === '-c' && args[1]) {
      ctx.output(`[python3] Executing: ${args[1]}`, 'info');
      ctx.output('(Python REPL not available - use files instead)', 'warning');
    } else if (args[0]) {
      const content = ctx.fs.readFile(ctx.fs.resolvePath(args[0]));
      if (!content) { ctx.output(`python3: can't open file '${args[0]}': No such file or directory`, 'error'); return; }
      ctx.output(`[python3] Running: ${args[0]}`, 'info');
      ctx.output('(Python execution simulated)', 'warning');
    } else {
      ctx.output('Python 3.12.2 (default, Feb  6 2024, 00:00:00) [GCC 13.2.0] on linux');
      ctx.output('Type "help", "copyright", "credits" or "license" for more information.');
      ctx.output('>>> (Interactive REPL not available in HackTerm shell)', 'warning');
    }
  });
  registry.set('python', registry.get('python3')!);
  registry.set('node', async (cmd, args, ctx) => {
    if (!ctx.pm.isInstalled('nodejs')) {
      ctx.output('node: command not found\nInstall with: apt install nodejs', 'error'); return;
    }
    ctx.output('Welcome to Node.js v21.6.1.');
    ctx.output('Type ".help" for more information.');
    ctx.output('> (Interactive REPL not available in HackTerm shell)', 'warning');
  });
  registry.set('ruby', async (cmd, args, ctx) => {
    if (!ctx.pm.isInstalled('ruby')) {
      ctx.output('ruby: command not found\nInstall with: apt install ruby', 'error'); return;
    }
    ctx.output('ruby 3.3.0 (2023-12-25 revision 5124f9ac75) [aarch64-linux]');
    ctx.output('(Interactive REPL not available)', 'warning');
  });
  registry.set('irb', registry.get('ruby')!);

  // Git simulation
  registry.set('git', async (cmd, args, ctx) => {
    if (!ctx.pm.isInstalled('git')) {
      ctx.output('git: command not found\nInstall with: apt install git', 'error'); return;
    }
    const sub = args[0];
    if (sub === 'init') {
      ctx.output(`Initialized empty Git repository in ${ctx.fs.getCwd()}/.git/`);
      ctx.fs.mkdir(ctx.fs.resolvePath('.git'), true);
    } else if (sub === 'clone') {
      const url = args[1];
      if (!url) { ctx.output('git clone: url required', 'error'); return; }
      const name = url.split('/').pop()?.replace('.git', '') ?? 'repo';
      ctx.output(`Cloning into '${name}'...`);
      ctx.output('remote: Enumerating objects: 100, done.');
      ctx.output('remote: Counting objects: 100% (100/100), done.');
      ctx.output('Receiving objects: 100% (100/100), done.');
      ctx.fs.mkdir(ctx.fs.resolvePath(name), true);
    } else if (sub === 'status') {
      ctx.output('On branch main');
      ctx.output("nothing to commit, working tree clean");
    } else if (sub === 'log') {
      ctx.output('commit abc123def456 (HEAD -> main, origin/main)');
      ctx.output('Author: root <root@hackterm.io>');
      ctx.output(`Date:   ${new Date().toUTCString()}`);
      ctx.output('');
      ctx.output('    Initial commit');
    } else if (sub === 'add') {
      ctx.output(''); // Silent success
    } else if (sub === 'commit') {
      const msgIdx = args.indexOf('-m');
      const msg = msgIdx !== -1 ? args[msgIdx + 1] : 'update';
      ctx.output(`[main abc123d] ${msg}`);
      ctx.output(' 1 file changed, 1 insertion(+)');
    } else {
      ctx.output(`git: ${sub}: simulated`);
    }
  });

  // Tmux simulation
  registry.set('tmux', async (cmd, args, ctx) => {
    if (!ctx.pm.isInstalled('tmux')) {
      ctx.output('tmux: command not found\nInstall with: apt install tmux', 'error'); return;
    }
    ctx.output('[detached (from session 0)]');
    ctx.output('(Tmux sessions not supported in HackTerm shell)', 'warning');
  });

  // Compression tools
  registry.set('tar', async (cmd, args, ctx) => {
    const create = args.includes('-c') || args.includes('--create');
    const extract = args.includes('-x') || args.includes('--extract');
    const verbose = args.includes('-v') || args.includes('--verbose');
    const file = args.find(a => !a.startsWith('-'));
    if (create) ctx.output(`tar: creating archive ${file ?? 'archive.tar'}`);
    else if (extract) ctx.output(`tar: extracting ${file ?? 'archive.tar'}`);
    else ctx.output('tar: option required');
  });

  registry.set('gzip', async (cmd, args, ctx) => {
    const file = args.find(a => !a.startsWith('-'));
    if (file) ctx.output(`gzip: compressing ${file}`);
  });

  registry.set('gunzip', async (cmd, args, ctx) => {
    const file = args.find(a => !a.startsWith('-'));
    if (file) ctx.output(`gunzip: decompressing ${file}`);
  });

  registry.set('zip', async (cmd, args, ctx) => {
    const files = args.filter(a => !a.startsWith('-'));
    if (files.length > 0) ctx.output(`adding: ${files.slice(1).join(', ')} -> ${files[0]}`);
  });

  registry.set('unzip', async (cmd, args, ctx) => {
    const file = args.find(a => !a.startsWith('-'));
    if (file) ctx.output(`Archive: ${file}\n  inflating: ...`);
  });

  // Misc utilities
  registry.set('xargs', async (cmd, args, ctx) => {
    ctx.output(`(xargs: pipe processing not fully supported)`, 'warning');
  });

  registry.set('tee', async (cmd, args, ctx) => {
    ctx.output(`(tee: pipe tee not fully supported)`, 'warning');
  });

  registry.set('yes', async (cmd, args, ctx) => {
    const text = args[0] ?? 'y';
    for (let i = 0; i < 10; i++) ctx.output(text);
  });

  registry.set('seq', async (cmd, args, ctx) => {
    let start = 1, end = 1, step = 1;
    if (args.length === 1) { end = parseInt(args[0]); }
    else if (args.length === 2) { start = parseInt(args[0]); end = parseInt(args[1]); }
    else if (args.length === 3) { start = parseInt(args[0]); step = parseInt(args[1]); end = parseInt(args[2]); }
    for (let i = start; i <= end; i += step) ctx.output(String(i));
  });

  registry.set('printf', async (cmd, args, ctx) => {
    if (args.length === 0) return;
    const fmt = args[0].replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    ctx.output(fmt);
  });

  registry.set('read', async (cmd, args, ctx) => {
    ctx.output('(read: interactive input not supported)', 'warning');
  });

  registry.set('test', async (cmd, args, ctx) => {
    // Basic test command
  });

  registry.set('[', registry.get('test')!);

  registry.set('expr', async (cmd, args, ctx) => {
    try {
      const expr = args.join(' ');
      const sanitized = expr.replace(/[^0-9+\-*/() ]/g, '');
      const result = Function(`"use strict"; return (${sanitized})`)();
      ctx.output(String(result));
    } catch {
      ctx.output('expr: syntax error', 'error');
    }
  });

  registry.set('bc', async (cmd, args, ctx) => {
    ctx.output('bc: interactive calculator not available\nUse: expr 1 + 1', 'warning');
  });

  registry.set('python3 -c', registry.get('python3')!);

  registry.set('lsof', async (cmd, args, ctx) => {
    ctx.output('COMMAND  PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME');
    ctx.output('sshd     145 root    3u  IPv4  12345  0t0  TCP *:22 (LISTEN)');
    ctx.output('nginx    201 root    6u  IPv4  23456  0t0  TCP *:80 (LISTEN)');
    ctx.output('bash    1024 root  cwd    DIR    8,1   4096   2 /home/root');
  });

  registry.set('strace', async (cmd, args, ctx) => {
    ctx.output('strace: (simulation) Process system calls cannot be traced in HackTerm', 'warning');
  });

  registry.set('ltrace', registry.get('strace')!);

  registry.set('ss', networkCommands.netstat);

  registry.set('route', async (cmd, args, ctx) => {
    ctx.output('Kernel IP routing table');
    ctx.output('Destination     Gateway         Genmask         Flags Metric Ref    Use Iface');
    ctx.output('0.0.0.0         192.168.1.1     0.0.0.0         UG    100    0        0 eth0');
    ctx.output('192.168.1.0     0.0.0.0         255.255.255.0   U     100    0        0 eth0');
  });

  return registry;
}
