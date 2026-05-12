import { CommandContext } from '../core/CommandProcessor';

export const systemCommands: Record<string, (cmd: string, args: string[], ctx: CommandContext) => Promise<void>> = {
  async clear(cmd, args, ctx) {
    ctx.output('\x1b[2J\x1b[H', 'system');
  },

  async uname(cmd, args, ctx) {
    const all = args.includes('-a') || args.includes('--all');
    const parts: string[] = [];
    if (all || args.includes('-s') || args.length === 0) parts.push('Linux');
    if (all || args.includes('-n')) parts.push('hackterm');
    if (all || args.includes('-r')) parts.push('5.15.0-hackterm');
    if (all || args.includes('-v')) parts.push('#1 SMP PREEMPT_DYNAMIC');
    if (all || args.includes('-m')) parts.push('aarch64');
    if (all || args.includes('-p')) parts.push('aarch64');
    if (all || args.includes('-o')) parts.push('GNU/Linux');
    ctx.output(parts.join(' '));
  },

  async whoami(cmd, args, ctx) {
    ctx.output(ctx.env.get('USER') || 'root');
  },

  async id(cmd, args, ctx) {
    const user = ctx.env.get('USER') || 'root';
    ctx.output(`uid=0(${user}) gid=0(${user}) groups=0(${user}),27(sudo),1000(users)`);
  },

  async hostname(cmd, args, ctx) {
    if (args.includes('-I') || args.includes('-i')) {
      ctx.output('192.168.1.100');
    } else {
      ctx.output(ctx.env.get('HOSTNAME') || 'hackterm');
    }
  },

  async date(cmd, args, ctx) {
    const now = new Date();
    if (args.includes('+%s')) {
      ctx.output(Math.floor(now.getTime() / 1000).toString());
    } else {
      ctx.output(now.toString());
    }
  },

  async uptime(cmd, args, ctx) {
    const hours = Math.floor(Math.random() * 24);
    const mins = Math.floor(Math.random() * 60);
    const now = new Date().toLocaleTimeString();
    ctx.output(` ${now} up ${hours}:${String(mins).padStart(2, '0')},  1 user,  load average: 0.08, 0.12, 0.10`);
  },

  async ps(cmd, args, ctx) {
    const aux = args.includes('aux') || args.includes('-aux') || args.includes('-ef');
    const processes = [
      { pid: 1,    user: 'root',   cpu: '0.0', mem: '0.0', stat: 'Ss', time: '0:01', cmd: '/sbin/init' },
      { pid: 2,    user: 'root',   cpu: '0.0', mem: '0.0', stat: 'S',  time: '0:00', cmd: '[kthreadd]' },
      { pid: 145,  user: 'root',   cpu: '0.0', mem: '0.1', stat: 'Ss', time: '0:00', cmd: '/usr/sbin/sshd -D' },
      { pid: 312,  user: 'root',   cpu: '0.0', mem: '0.2', stat: 'Ss', time: '0:00', cmd: '/usr/sbin/cron -f' },
      { pid: 1024, user: 'root',   cpu: '0.1', mem: '0.4', stat: 'Ss', time: '0:00', cmd: '-bash' },
      { pid: 1025, user: 'root',   cpu: '0.0', mem: '0.3', stat: 'S+', time: '0:00', cmd: 'hackterm' },
      { pid: 1337, user: 'root',   cpu: '0.0', mem: '0.5', stat: 'R+', time: '0:00', cmd: 'ps aux' },
    ];

    if (aux) {
      ctx.output('USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND');
      for (const p of processes) {
        ctx.output(
          `${p.user.padEnd(12)} ${String(p.pid).padStart(5)} ${p.cpu.padStart(4)} ${p.mem.padStart(4)} ${String(Math.floor(Math.random() * 50000)).padStart(6)} ${String(Math.floor(Math.random() * 10000)).padStart(5)} pts/0    ${p.stat.padEnd(4)} 00:00   ${p.time.padStart(5)} ${p.cmd}`
        );
      }
    } else {
      ctx.output('    PID TTY          TIME CMD');
      ctx.output('   1024 pts/0    00:00:00 bash');
      ctx.output('   1337 pts/0    00:00:00 ps');
    }
  },

  async kill(cmd, args, ctx) {
    const sig = args.find(a => a.startsWith('-')) ?? '-15';
    const pids = args.filter(a => !a.startsWith('-'));
    for (const pid of pids) {
      if (isNaN(parseInt(pid))) { ctx.output(`kill: ${pid}: arguments must be process or job IDs`, 'error'); }
    }
  },

  async top(cmd, args, ctx) {
    const now = new Date().toLocaleTimeString();
    ctx.output(`top - ${now} up 4:32,  1 user,  load average: 0.08, 0.12, 0.10`);
    ctx.output('Tasks:  87 total,   1 running,  86 sleeping,   0 stopped,   0 zombie');
    ctx.output('%Cpu(s):  2.3 us,  0.5 sy,  0.0 ni, 97.0 id,  0.0 wa,  0.2 hi,  0.0 si,  0.0 st');
    ctx.output('MiB Mem :   5992.2 total,    872.0 free,   2048.1 used,   3072.1 buff/cache');
    ctx.output('MiB Swap:      0.0 total,      0.0 free,      0.0 used.   3072.8 avail Mem');
    ctx.output('');
    ctx.output('    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND');
    ctx.output('   1025 root      20   0   45236   8192   4096 S   2.3   0.1   0:00.45 hackterm');
    ctx.output('      1 root      20   0  169140   9216   7168 S   0.0   0.2   0:01.23 systemd');
    ctx.output('    145 root      20   0   65536   4096   3072 S   0.0   0.1   0:00.12 sshd');
    ctx.output('    312 root      20   0   28672   2048   2048 S   0.0   0.0   0:00.04 cron');
    ctx.output('   1024 root      20   0   28672   4096   3072 S   0.0   0.1   0:00.08 bash');
    ctx.output('   1337 root      20   0   22528   2048   2048 R   0.3   0.0   0:00.01 top');
  },

  async htop(cmd, args, ctx) {
    const installed = ctx.pm.isInstalled('htop');
    if (!installed) { ctx.output(`htop: command not found. Install with: apt install htop`, 'error'); return; }
    await systemCommands.top(cmd, args, ctx);
  },

  async env(cmd, args, ctx) {
    const vars = ctx.env.getAll();
    for (const [key, val] of Object.entries(vars)) {
      ctx.output(`${key}=${val}`);
    }
  },

  async export(cmd, args, ctx) {
    if (args.length === 0) {
      const vars = ctx.env.getAll();
      for (const [key, val] of Object.entries(vars)) {
        ctx.output(`declare -x ${key}="${val}"`);
      }
      return;
    }
    for (const arg of args) {
      const idx = arg.indexOf('=');
      if (idx === -1) {
        // Just marking as exported - silently succeed
      } else {
        const key = arg.slice(0, idx);
        const val = ctx.env.expandVars(arg.slice(idx + 1).replace(/^["']|["']$/g, ''));
        ctx.env.set(key, val);
      }
    }
  },

  async unset(cmd, args, ctx) {
    for (const key of args) ctx.env.unset(key);
  },

  async set(cmd, args, ctx) {
    if (args.length === 0) {
      const vars = ctx.env.getAll();
      for (const [k, v] of Object.entries(vars)) ctx.output(`${k}='${v}'`);
    }
  },

  async history(cmd, args, ctx) {
    const hist = ctx.env.getHistory();
    const n = args[0] ? parseInt(args[0]) : hist.length;
    const slice = hist.slice(-n);
    slice.forEach((h, i) => {
      ctx.output(`  ${String(hist.length - slice.length + i + 1).padStart(4)}  ${h}`);
    });
  },

  async alias(cmd, args, ctx) {
    if (args.length === 0) {
      ctx.env.listAliases().forEach(a => ctx.output(a));
      return;
    }
    for (const arg of args) {
      const idx = arg.indexOf('=');
      if (idx === -1) {
        const alias = ctx.env.getAlias(arg);
        if (alias) ctx.output(`alias ${arg}='${alias}'`);
        else ctx.output(`bash: alias: ${arg}: not found`, 'error');
      } else {
        const name = arg.slice(0, idx);
        const val = arg.slice(idx + 1).replace(/^['"]|['"]$/g, '');
        ctx.env.setAlias(name, val);
      }
    }
  },

  async unalias(cmd, args, ctx) {
    for (const name of args) ctx.env.removeAlias(name);
  },

  async source(cmd, args, ctx) {
    if (!args[0]) { ctx.output('bash: source: filename argument required', 'error'); return; }
    const resolved = ctx.fs.resolvePath(args[0]);
    const content = ctx.fs.readFile(resolved);
    if (content === null) { ctx.output(`bash: source: ${args[0]}: No such file or directory`, 'error'); return; }
    // Simulate sourcing - just output that it's been loaded
    ctx.output(`Sourced ${args[0]}`, 'success');
  },

  async exit(cmd, args, ctx) {
    ctx.output('logout', 'system');
    ctx.output('Connection to hackterm closed.', 'system');
  },

  async logout(cmd, args, ctx) {
    await systemCommands.exit(cmd, args, ctx);
  },

  async sudo(cmd, args, ctx) {
    if (args.length === 0) { ctx.output('usage: sudo command', 'error'); return; }
    ctx.output('[sudo] password for root: ', 'warning');
    ctx.output('root has no password set. Proceeding...', 'success');
    // Execute sub-command
    const subCmd = args[0];
    const subArgs = args.slice(1);
    ctx.output(`Executing: ${subCmd} ${subArgs.join(' ')}`, 'info');
  },

  async man(cmd, args, ctx) {
    if (!args[0]) { ctx.output('What manual page do you want?', 'error'); return; }
    const manPages: Record<string, string> = {
      ls: 'LS(1)\n\nNAME\n       ls - list directory contents\n\nSYNOPSIS\n       ls [OPTION]... [FILE]...\n\nDESCRIPTION\n       List information about the FILEs (the current directory by default).\n\n       -a, --all        do not ignore entries starting with .\n       -l               use a long listing format\n       -h               human-readable sizes',
      cat: 'CAT(1)\n\nNAME\n       cat - concatenate files and print on the standard output\n\nSYNOPSIS\n       cat [OPTION]... [FILE]...',
      grep: 'GREP(1)\n\nNAME\n       grep - print lines that match patterns\n\nSYNOPSIS\n       grep [OPTION...] PATTERNS [FILE...]\n\n       -i  --ignore-case\n       -r  --recursive\n       -n  --line-number\n       -v  --invert-match\n       -c  --count',
      nmap: 'NMAP(1)\n\nNAME\n       nmap - Network exploration tool and security/port scanner\n\nSYNOPSIS\n       nmap [Scan Type...] [Options] {target specification}\n\n       -sS  TCP SYN scan\n       -sV  Version detection\n       -O   OS detection\n       -A   Enable OS detection, version detection, script scanning\n       -p   Port specification',
    };
    const page = manPages[args[0]];
    if (page) {
      for (const line of page.split('\n')) ctx.output(line);
    } else {
      ctx.output(`No manual entry for ${args[0]}`, 'error');
    }
  },

  async help(cmd, args, ctx) {
    ctx.output('');
    ctx.output('  HackTerm - iOS Linux Terminal v1.0.0', 'success');
    ctx.output('  ─────────────────────────────────────────────────────', 'info');
    ctx.output('');
    ctx.output('  FILESYSTEM COMMANDS:', 'warning');
    ctx.output('    ls, ll, la    List directory contents');
    ctx.output('    cd            Change directory');
    ctx.output('    pwd           Print working directory');
    ctx.output('    cat           Concatenate and print files');
    ctx.output('    mkdir         Create directories');
    ctx.output('    rm            Remove files or directories');
    ctx.output('    cp, mv        Copy/Move files');
    ctx.output('    find          Search for files');
    ctx.output('    tree          Display directory tree');
    ctx.output('    chmod         Change file permissions');
    ctx.output('    stat, du, df  File/disk information');
    ctx.output('');
    ctx.output('  TEXT PROCESSING:', 'warning');
    ctx.output('    echo          Print text');
    ctx.output('    grep          Search patterns in text');
    ctx.output('    head, tail    View beginning/end of files');
    ctx.output('    wc            Count words/lines/chars');
    ctx.output('    sort          Sort text');
    ctx.output('    awk, sed      Text processing');
    ctx.output('    cut, tr       Text manipulation');
    ctx.output('');
    ctx.output('  SYSTEM:', 'warning');
    ctx.output('    ps, top, htop Process management');
    ctx.output('    kill          Send signals to processes');
    ctx.output('    uname         System information');
    ctx.output('    whoami, id    User information');
    ctx.output('    date, uptime  Time/uptime');
    ctx.output('    env, export   Environment variables');
    ctx.output('    history       Command history');
    ctx.output('    alias         Command aliases');
    ctx.output('    clear         Clear screen');
    ctx.output('');
    ctx.output('  NETWORK:', 'warning');
    ctx.output('    ping          Test connectivity');
    ctx.output('    curl, wget    HTTP requests');
    ctx.output('    ssh           Secure shell');
    ctx.output('    nmap          Port scanner (requires: apt install nmap)');
    ctx.output('    netstat       Network statistics');
    ctx.output('    ifconfig, ip  Network interfaces');
    ctx.output('    whois, dig    Domain info / DNS');
    ctx.output('');
    ctx.output('  PACKAGE MANAGER:', 'warning');
    ctx.output('    apt update          Update package lists');
    ctx.output('    apt upgrade         Upgrade all packages');
    ctx.output('    apt install <pkg>   Install package');
    ctx.output('    apt remove <pkg>    Remove package');
    ctx.output('    apt search <query>  Search packages');
    ctx.output('    apt list            List packages');
    ctx.output('    pkg install <pkg>   Install package (alias)');
    ctx.output('');
    ctx.output('  HACKING TOOLS:', 'warning');
    ctx.output('    nmap, hydra, sqlmap, nikto, gobuster');
    ctx.output('    Install with: apt install <tool>');
    ctx.output('');
    ctx.output('  Type "man <command>" for detailed help', 'info');
    ctx.output('');
  },

  async bash(cmd, args, ctx) {
    if (args[0] === '-c' && args[1]) {
      ctx.output(`bash: executing: ${args[1]}`, 'info');
    }
  },

  async sh(cmd, args, ctx) {
    await systemCommands.bash(cmd, args, ctx);
  },

  async sleep(cmd, args, ctx) {
    const seconds = parseFloat(args[0] ?? '1');
    if (isNaN(seconds)) { ctx.output(`sleep: invalid time interval '${args[0]}'`, 'error'); return; }
    await new Promise(r => setTimeout(r, Math.min(seconds * 1000, 10000)));
  },

  async time(cmd, args, ctx) {
    const start = Date.now();
    ctx.output(`Timing: ${args.join(' ')}`);
    const elapsed = Date.now() - start;
    ctx.output(`real\t0m${(elapsed / 1000).toFixed(3)}s`);
    ctx.output(`user\t0m0.000s`);
    ctx.output(`sys\t0m0.000s`);
  },

  async printenv(cmd, args, ctx) {
    if (args.length === 0) {
      await systemCommands.env(cmd, args, ctx);
    } else {
      for (const key of args) {
        const val = ctx.env.get(key);
        if (val) ctx.output(val);
      }
    }
  },

  async true(cmd, args, ctx) { /* always succeeds */ },
  async false(cmd, args, ctx) {
    ctx.output('', 'error');
  },

  async type(cmd, args, ctx) {
    for (const name of args) {
      ctx.output(`${name} is a shell builtin`);
    }
  },

  async jobs(cmd, args, ctx) {
    ctx.output(''); // No background jobs
  },

  async bg(cmd, args, ctx) {
    ctx.output('bg: no current job', 'error');
  },

  async fg(cmd, args, ctx) {
    ctx.output('fg: no current job', 'error');
  },
};
