import { CommandContext } from '../core/CommandProcessor';
import { FSNode } from '../core/FileSystem';

function pad(str: string, len: number): string {
  return str.padEnd(len, ' ');
}

function formatDate(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function colorName(node: FSNode): string {
  if (node.type === 'directory') return `\x1b[34m${node.name}/\x1b[0m`;
  if (node.type === 'symlink') return `\x1b[36m${node.name}\x1b[0m`;
  if (node.permissions.includes('x')) return `\x1b[32m${node.name}\x1b[0m`;
  return node.name;
}

export const filesystemCommands: Record<string, (cmd: string, args: string[], ctx: CommandContext) => Promise<void>> = {
  async ls(cmd, args, ctx) {
    const flags = args.filter(a => a.startsWith('-'));
    const paths = args.filter(a => !a.startsWith('-'));
    const showAll = flags.some(f => f.includes('a') || f.includes('A'));
    const longFormat = flags.some(f => f.includes('l'));
    const target = paths[0] ? ctx.fs.resolvePath(paths[0]) : ctx.fs.getCwd();

    const node = ctx.fs.getNode(target);
    if (!node) { ctx.output(`ls: cannot access '${paths[0] ?? target}': No such file or directory`, 'error'); return; }

    let entries: FSNode[];
    if (node.type === 'directory') {
      entries = ctx.fs.listDir(target);
    } else {
      entries = [node];
    }

    if (!showAll) {
      entries = entries.filter(e => !e.name.startsWith('.'));
    }

    entries.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });

    if (longFormat) {
      ctx.output(`total ${entries.length * 8}`);
      for (const entry of entries) {
        const sizeStr = String(entry.size).padStart(8);
        const line = `${entry.permissions} 1 ${pad(entry.owner, 8)} ${pad(entry.group, 8)} ${sizeStr} ${formatDate(entry.modified)} ${colorName(entry)}`;
        ctx.output(line);
      }
    } else {
      const names = entries.map(e => colorName(e));
      const cols = 4;
      for (let i = 0; i < names.length; i += cols) {
        ctx.output(names.slice(i, i + cols).map(n => pad(n, 20)).join('  '));
      }
    }
  },

  async cd(cmd, args, ctx) {
    const target = args[0] ?? ctx.env.get('HOME');
    const resolved = ctx.fs.resolvePath(target);
    const node = ctx.fs.getNode(resolved);
    if (!node) { ctx.output(`bash: cd: ${target}: No such file or directory`, 'error'); return; }
    if (node.type !== 'directory') { ctx.output(`bash: cd: ${target}: Not a directory`, 'error'); return; }
    ctx.fs.setCwd(resolved);
    ctx.env.set('PWD', resolved);
    ctx.env.set('OLDPWD', ctx.fs.getCwd());
  },

  async pwd(cmd, args, ctx) {
    ctx.output(ctx.fs.getCwd());
  },

  async mkdir(cmd, args, ctx) {
    const recursive = args.includes('-p') || args.includes('--parents');
    const dirs = args.filter(a => !a.startsWith('-'));
    for (const dir of dirs) {
      const resolved = ctx.fs.resolvePath(dir);
      if (!ctx.fs.mkdir(resolved, recursive)) {
        ctx.output(`mkdir: cannot create directory '${dir}': File exists`, 'error');
      }
    }
  },

  async rmdir(cmd, args, ctx) {
    for (const dir of args.filter(a => !a.startsWith('-'))) {
      const resolved = ctx.fs.resolvePath(dir);
      const node = ctx.fs.getNode(resolved);
      if (!node) { ctx.output(`rmdir: failed to remove '${dir}': No such file or directory`, 'error'); continue; }
      if (node.type !== 'directory') { ctx.output(`rmdir: failed to remove '${dir}': Not a directory`, 'error'); continue; }
      const children = ctx.fs.listDir(resolved);
      if (children.length > 0) { ctx.output(`rmdir: failed to remove '${dir}': Directory not empty`, 'error'); continue; }
      ctx.fs.rm(resolved, false);
    }
  },

  async rm(cmd, args, ctx) {
    const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-R') || args.includes('--recursive');
    const force = args.includes('-f') || args.includes('-rf') || args.includes('--force');
    const targets = args.filter(a => !a.startsWith('-'));

    for (const target of targets) {
      if (target === '/' || target === '/*') {
        ctx.output('rm: refusing to remove root directory', 'error');
        continue;
      }
      const resolved = ctx.fs.resolvePath(target);
      const node = ctx.fs.getNode(resolved);
      if (!node) {
        if (!force) ctx.output(`rm: cannot remove '${target}': No such file or directory`, 'error');
        continue;
      }
      if (node.type === 'directory' && !recursive) {
        ctx.output(`rm: cannot remove '${target}': Is a directory`, 'error');
        continue;
      }
      ctx.fs.rm(resolved, recursive);
    }
  },

  async cp(cmd, args, ctx) {
    const flags = args.filter(a => a.startsWith('-'));
    const paths = args.filter(a => !a.startsWith('-'));
    if (paths.length < 2) { ctx.output('cp: missing destination file operand', 'error'); return; }
    const src = ctx.fs.resolvePath(paths[0]);
    const dest = ctx.fs.resolvePath(paths[1]);
    if (!ctx.fs.cp(src, dest)) {
      ctx.output(`cp: cannot copy '${paths[0]}': No such file or directory`, 'error');
    }
  },

  async mv(cmd, args, ctx) {
    const paths = args.filter(a => !a.startsWith('-'));
    if (paths.length < 2) { ctx.output('mv: missing destination file operand', 'error'); return; }
    const src = ctx.fs.resolvePath(paths[0]);
    const dest = ctx.fs.resolvePath(paths[1]);
    if (!ctx.fs.mv(src, dest)) {
      ctx.output(`mv: cannot move '${paths[0]}': No such file or directory`, 'error');
    }
  },

  async cat(cmd, args, ctx) {
    const targets = args.filter(a => !a.startsWith('-'));
    if (targets.length === 0) { ctx.output('cat: reading from stdin not supported in this shell', 'warning'); return; }
    for (const target of targets) {
      const resolved = ctx.fs.resolvePath(target);
      const content = ctx.fs.readFile(resolved);
      if (content === null) {
        ctx.output(`cat: ${target}: No such file or directory`, 'error');
        continue;
      }
      const lines = content.split('\n');
      for (const line of lines) ctx.output(line);
    }
  },

  async touch(cmd, args, ctx) {
    for (const target of args.filter(a => !a.startsWith('-'))) {
      ctx.fs.touch(ctx.fs.resolvePath(target));
    }
  },

  async echo(cmd, args, ctx) {
    const noNewline = args[0] === '-n';
    const text = (noNewline ? args.slice(1) : args).join(' ');
    ctx.output(ctx.env.expandVars(text));
  },

  async find(cmd, args, ctx) {
    const startPath = args[0]?.startsWith('-') ? '.' : (args[0] ?? '.');
    const nameIdx = args.indexOf('-name');
    const typeIdx = args.indexOf('-type');
    const namePattern = nameIdx !== -1 ? args[nameIdx + 1] : null;
    const typeFilter = typeIdx !== -1 ? args[typeIdx + 1] : null;

    const resolved = ctx.fs.resolvePath(startPath);

    function walk(path: string, depth = 0): void {
      if (depth > 10) return;
      const node = ctx.fs.getNode(path);
      if (!node) return;

      const matchesName = !namePattern || matchGlob(node.name, namePattern);
      const matchesType = !typeFilter ||
        (typeFilter === 'd' && node.type === 'directory') ||
        (typeFilter === 'f' && node.type === 'file') ||
        (typeFilter === 'l' && node.type === 'symlink');

      if (matchesName && matchesType) ctx.output(path);

      if (node.type === 'directory') {
        for (const child of ctx.fs.listDir(path)) {
          walk(`${path}/${child.name}`.replace('//', '/'), depth + 1);
        }
      }
    }

    walk(resolved);
  },

  async which(cmd, args, ctx) {
    for (const name of args) {
      if (name === 'which') { ctx.output('/usr/bin/which'); continue; }
      const installed = ctx.pm.isInstalled(name);
      if (installed) { ctx.output(`/usr/bin/${name}`); }
      else if (['ls', 'cd', 'pwd', 'cat', 'echo', 'rm', 'cp', 'mv', 'mkdir', 'find', 'grep', 'chmod', 'chown'].includes(name)) {
        ctx.output(`/bin/${name}`);
      } else {
        ctx.output(`${name} not found`, 'error');
      }
    }
  },

  async chmod(cmd, args, ctx) {
    const paths = args.filter(a => !a.startsWith('-') && !/^[0-7]{3,4}$/.test(a) && !/^[ugoa][+-=][rwx]+$/.test(a));
    const mode = args.find(a => /^[0-7]{3,4}$/.test(a) || /^[ugoa][+-=][rwx]+$/.test(a));
    if (!mode) { ctx.output('chmod: missing operand', 'error'); return; }
    for (const p of paths) {
      if (!ctx.fs.chmod(ctx.fs.resolvePath(p), mode)) {
        ctx.output(`chmod: cannot access '${p}': No such file or directory`, 'error');
      }
    }
  },

  async chown(cmd, args, ctx) {
    const flags = args.filter(a => a.startsWith('-'));
    const rest = args.filter(a => !a.startsWith('-'));
    if (rest.length < 2) { ctx.output('chown: missing operand', 'error'); return; }
    ctx.output(''); // Silently succeed for simulation
  },

  async tree(cmd, args, ctx) {
    const installed = ctx.pm.isInstalled('tree');
    if (!installed) { ctx.output(`bash: tree: command not found. Install with: apt install tree`, 'error'); return; }
    const startPath = args.find(a => !a.startsWith('-')) ?? '.';
    const resolved = ctx.fs.resolvePath(startPath);
    let dirs = 0, files = 0;

    function walk(path: string, prefix = '', depth = 0): void {
      if (depth > 6) return;
      const entries = ctx.fs.listDir(path).filter(e => !e.name.startsWith('.') || args.includes('-a'));
      entries.sort((a, b) => a.name.localeCompare(b.name));

      entries.forEach((entry, idx) => {
        const isLast = idx === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const child = isLast ? '    ' : '│   ';
        if (entry.type === 'directory') {
          ctx.output(`${prefix}${connector}\x1b[34m${entry.name}\x1b[0m`);
          dirs++;
          walk(`${path}/${entry.name}`.replace('//', '/'), prefix + child, depth + 1);
        } else {
          ctx.output(`${prefix}${connector}${entry.name}`);
          files++;
        }
      });
    }

    ctx.output(resolved);
    walk(resolved);
    ctx.output(`\n${dirs} director${dirs !== 1 ? 'ies' : 'y'}, ${files} file${files !== 1 ? 's' : ''}`);
  },

  async ln(cmd, args, ctx) {
    ctx.output(''); // Simulate success
  },

  async stat(cmd, args, ctx) {
    for (const target of args.filter(a => !a.startsWith('-'))) {
      const resolved = ctx.fs.resolvePath(target);
      const node = ctx.fs.getNode(resolved);
      if (!node) { ctx.output(`stat: cannot stat '${target}': No such file or directory`, 'error'); continue; }
      ctx.output(`  File: ${resolved}`);
      ctx.output(`  Size: ${node.size}\t\tBlocks: ${Math.ceil(node.size / 512)}\t\tIO Block: 4096  ${node.type}`);
      ctx.output(`Device: 0h/0d\t\tInode: ${Math.floor(Math.random() * 999999)}\t\tLinks: 1`);
      ctx.output(`Access: (${node.permissions}/${node.permissions})\tUid: (0/root)\tGid: (0/root)`);
      ctx.output(`Access: ${node.modified.toISOString()}`);
      ctx.output(`Modify: ${node.modified.toISOString()}`);
      ctx.output(`Change: ${node.created.toISOString()}`);
    }
  },

  async du(cmd, args, ctx) {
    const flags = args.filter(a => a.startsWith('-'));
    const paths = args.filter(a => !a.startsWith('-'));
    const human = flags.some(f => f.includes('h'));
    const target = paths[0] ?? '.';
    const resolved = ctx.fs.resolvePath(target);
    const node = ctx.fs.getNode(resolved);
    if (!node) { ctx.output(`du: cannot access '${target}': No such file or directory`, 'error'); return; }
    const size = human ? `${Math.floor(Math.random() * 100) + 1}M` : String(Math.floor(Math.random() * 100000));
    ctx.output(`${size}\t${resolved}`);
  },

  async df(cmd, args, ctx) {
    const human = args.includes('-h') || args.includes('-H');
    ctx.output('Filesystem      Size  Used Avail Use% Mounted on');
    ctx.output(`/dev/root       ${human ? '256G' : '268435456'}  ${human ? '12G' : '12582912'}   ${human ? '244G' : '255852544'}   5% /`);
    ctx.output(`tmpfs           ${human ? '3.0G' : '3145728'}     ${human ? '0' : '0'}    ${human ? '3.0G' : '3145728'}   0% /dev/shm`);
    ctx.output(`tmpfs           ${human ? '3.0G' : '3145728'}   ${human ? '1.2M' : '1229'}    ${human ? '3.0G' : '3144499'}   1% /run`);
  },
};

function matchGlob(name: string, pattern: string): boolean {
  const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
  return regex.test(name);
}
