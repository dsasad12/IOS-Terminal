export type FileType = 'file' | 'directory' | 'symlink' | 'device';

export interface FSNode {
  name: string;
  type: FileType;
  content?: string;
  children?: Map<string, FSNode>;
  permissions: string;
  owner: string;
  group: string;
  size: number;
  modified: Date;
  created: Date;
  linkTarget?: string;
}

export class VirtualFileSystem {
  private root: FSNode;
  private cwd: string;

  constructor() {
    this.root = this.buildRoot();
    this.cwd = '/home/root';
  }

  private makeDir(name: string, owner = 'root', perms = 'drwxr-xr-x'): FSNode {
    return {
      name,
      type: 'directory',
      children: new Map(),
      permissions: perms,
      owner,
      group: owner,
      size: 4096,
      modified: new Date(),
      created: new Date(),
    };
  }

  private makeFile(name: string, content = '', owner = 'root', perms = '-rw-r--r--'): FSNode {
    return {
      name,
      type: 'file',
      content,
      permissions: perms,
      owner,
      group: owner,
      size: content.length,
      modified: new Date(),
      created: new Date(),
    };
  }

  private makeLink(name: string, target: string): FSNode {
    return {
      name,
      type: 'symlink',
      linkTarget: target,
      permissions: 'lrwxrwxrwx',
      owner: 'root',
      group: 'root',
      size: target.length,
      modified: new Date(),
      created: new Date(),
    };
  }

  private buildRoot(): FSNode {
    const root = this.makeDir('/', 'root', 'drwxr-xr-x');

    const structure: Record<string, FSNode> = {
      bin: this.makeDir('bin'),
      boot: this.makeDir('boot'),
      dev: this.makeDir('dev', 'root', 'drwxr-xr-x'),
      etc: this.makeDir('etc'),
      home: this.makeDir('home', 'root', 'drwxr-xr-x'),
      lib: this.makeDir('lib'),
      'lib64': this.makeDir('lib64'),
      media: this.makeDir('media'),
      mnt: this.makeDir('mnt'),
      opt: this.makeDir('opt'),
      proc: this.makeDir('proc'),
      root: this.makeDir('root', 'root', 'drwx------'),
      run: this.makeDir('run'),
      sbin: this.makeDir('sbin'),
      srv: this.makeDir('srv'),
      sys: this.makeDir('sys'),
      tmp: this.makeDir('tmp', 'root', 'drwxrwxrwt'),
      usr: this.makeDir('usr'),
      var: this.makeDir('var'),
      data: this.makeDir('data'),
    };

    // /etc files
    const etc = structure['etc'] as FSNode;
    etc.children!.set('hostname', this.makeFile('hostname', 'hackterm\n'));
    etc.children!.set('hosts', this.makeFile('hosts',
      '127.0.0.1\tlocalhost\n127.0.1.1\thackterm\n::1\tlocalhost ip6-localhost ip6-loopback\n'));
    etc.children!.set('passwd', this.makeFile('passwd',
      'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\n'));
    etc.children!.set('shadow', this.makeFile('shadow', 'root:*:19000:0:99999:7:::\n', 'root', '-rw-------'));
    etc.children!.set('group', this.makeFile('group', 'root:x:0:\ndaemon:x:1:\n'));
    etc.children!.set('shells', this.makeFile('shells', '/bin/sh\n/bin/bash\n/bin/zsh\n'));
    etc.children!.set('motd', this.makeFile('motd',
      '\n  ██╗  ██╗ █████╗  ██████╗██╗  ██╗████████╗███████╗██████╗ ███╗   ███╗\n' +
      '  ██║  ██║██╔══██╗██╔════╝██║ ██╔╝╚══██╔══╝██╔════╝██╔══██╗████╗ ████║\n' +
      '  ███████║███████║██║     █████╔╝    ██║   █████╗  ██████╔╝██╔████╔██║\n' +
      '  ██╔══██║██╔══██║██║     ██╔═██╗    ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║\n' +
      '  ██║  ██║██║  ██║╚██████╗██║  ██╗   ██║   ███████╗██║  ██║██║ ╚═╝ ██║\n' +
      '  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝\n' +
      '\n  iOS Terminal v1.0.0 | Powered by HackTerm\n' +
      '  Type "help" for available commands\n\n'));
    etc.children!.set('os-release', this.makeFile('os-release',
      'PRETTY_NAME="HackTerm OS 1.0"\nNAME="HackTerm"\nVERSION_ID="1.0"\nVERSION="1.0 (hackterm)"\n' +
      'ID=hackterm\nID_LIKE=debian\nHOME_URL="https://github.com"\nSUPPORT_URL="https://github.com"\n'));
    etc.children!.set('resolv.conf', this.makeFile('resolv.conf',
      'nameserver 8.8.8.8\nnameserver 8.8.4.4\nnameserver 1.1.1.1\n'));
    etc.children!.set('apt', this.makeDir('apt'));
    const aptDir = etc.children!.get('apt') as FSNode;
    aptDir.children!.set('sources.list', this.makeFile('sources.list',
      'deb https://packages.hackterm.io/apt stable main\ndeb https://termux.net/apt/termux-main stable main\n'));

    // /home/root
    const home = structure['home'] as FSNode;
    const rootHome = this.makeDir('root', 'root', 'drwx------');
    rootHome.children!.set('.bashrc', this.makeFile('.bashrc',
      '# ~/.bashrc: executed by bash for non-login shells\n\nexport PS1="\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ "\n' +
      'export TERM=xterm-256color\nexport EDITOR=nano\n\nalias ll="ls -la"\nalias la="ls -la"\nalias l="ls -cf"\nalias cls="clear"\n'));
    rootHome.children!.set('.bash_history', this.makeFile('.bash_history', ''));
    rootHome.children!.set('.profile', this.makeFile('.profile',
      '# ~/.profile: executed by the command interpreter for login shells.\nif [ -n "$BASH_VERSION" ]; then\n  if [ -f "$HOME/.bashrc" ]; then\n    . "$HOME/.bashrc"\n  fi\nfi\n'));
    rootHome.children!.set('.ssh', this.makeDir('.ssh', 'root', 'drwx------'));
    const sshDir = rootHome.children!.get('.ssh') as FSNode;
    sshDir.children!.set('known_hosts', this.makeFile('known_hosts', ''));
    sshDir.children!.set('authorized_keys', this.makeFile('authorized_keys', '', 'root', '-rw-------'));
    rootHome.children!.set('tools', this.makeDir('tools'));
    rootHome.children!.set('scripts', this.makeDir('scripts'));
    rootHome.children!.set('Downloads', this.makeDir('Downloads'));
    home.children!.set('root', rootHome);

    // /proc virtual files
    const proc = structure['proc'] as FSNode;
    proc.children!.set('version', this.makeFile('version',
      'Linux version 5.15.0-hackterm (root@hackterm) (gcc 11.4.0) #1 SMP PREEMPT_DYNAMIC\n'));
    proc.children!.set('cpuinfo', this.makeFile('cpuinfo',
      'processor\t: 0\nvendor_id\t: ARM\ncpu family\t: 8\nmodel\t\t: Apple M-series\n' +
      'model name\t: Apple A16 Bionic\ncpu MHz\t\t: 3460.000\ncache size\t: 16384 KB\n' +
      'bogomips\t: 6920.00\nflags\t\t: fpu vme de pse tsc msr pae mce cx8 apic\n'));
    proc.children!.set('meminfo', this.makeFile('meminfo',
      'MemTotal:        6144000 kB\nMemFree:          892416 kB\nMemAvailable:    3145728 kB\n' +
      'Buffers:          131072 kB\nCached:          2097152 kB\nSwapTotal:             0 kB\nSwapFree:              0 kB\n'));
    proc.children!.set('uptime', this.makeFile('uptime', '3600.00 2800.00\n'));
    proc.children!.set('loadavg', this.makeFile('loadavg', '0.10 0.15 0.12 1/324 1234\n'));

    // /usr structure
    const usr = structure['usr'] as FSNode;
    usr.children!.set('bin', this.makeDir('bin'));
    usr.children!.set('sbin', this.makeDir('sbin'));
    usr.children!.set('lib', this.makeDir('lib'));
    usr.children!.set('local', this.makeDir('local'));
    usr.children!.set('share', this.makeDir('share'));
    usr.children!.set('include', this.makeDir('include'));
    const usrLocal = usr.children!.get('local') as FSNode;
    usrLocal.children!.set('bin', this.makeDir('bin'));
    usrLocal.children!.set('lib', this.makeDir('lib'));
    usrLocal.children!.set('share', this.makeDir('share'));

    // /var structure
    const varDir = structure['var'] as FSNode;
    varDir.children!.set('log', this.makeDir('log'));
    varDir.children!.set('tmp', this.makeDir('tmp', 'root', 'drwxrwxrwt'));
    varDir.children!.set('lib', this.makeDir('lib'));
    varDir.children!.set('cache', this.makeDir('cache'));
    const varLog = varDir.children!.get('log') as FSNode;
    varLog.children!.set('syslog', this.makeFile('syslog',
      `${new Date().toISOString()} hackterm kernel: [    0.000000] Booting Linux on physical CPU 0x0000000000\n` +
      `${new Date().toISOString()} hackterm systemd[1]: HackTerm OS v1.0 - iOS Terminal\n`));

    // /data for hackterm packages
    const data = structure['data'] as FSNode;
    const dataData = this.makeDir('data');
    const comHackterm = this.makeDir('com.hackterm');
    const files = this.makeDir('files');
    const filesUsr = this.makeDir('usr');
    const filesUsrBin = this.makeDir('bin');
    filesUsr.children!.set('bin', filesUsrBin);
    files.children!.set('usr', filesUsr);
    comHackterm.children!.set('files', files);
    dataData.children!.set('com.hackterm', comHackterm);
    data.children!.set('data', dataData);

    // Build root children
    for (const [key, node] of Object.entries(structure)) {
      root.children!.set(key, node);
    }

    // Symlinks
    root.children!.set('lib64', this.makeLink('lib64', '/usr/lib64'));

    return root;
  }

  resolvePath(path: string): string {
    if (!path) return this.cwd;

    let resolved: string;
    if (path.startsWith('/')) {
      resolved = path;
    } else if (path.startsWith('~')) {
      resolved = path.replace('~', '/home/root');
    } else {
      resolved = `${this.cwd}/${path}`;
    }

    // Normalize path segments
    const parts = resolved.split('/').filter(Boolean);
    const stack: string[] = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        stack.pop();
      } else {
        stack.push(part);
      }
    }
    return '/' + stack.join('/');
  }

  getNode(path: string): FSNode | null {
    const resolved = this.resolvePath(path);
    if (resolved === '/') return this.root;

    const parts = resolved.split('/').filter(Boolean);
    let current = this.root;

    for (const part of parts) {
      if (current.type !== 'directory' || !current.children) return null;
      const child = current.children.get(part);
      if (!child) return null;
      current = child;
    }
    return current;
  }

  getParentNode(path: string): { parent: FSNode; name: string } | null {
    const resolved = this.resolvePath(path);
    const parts = resolved.split('/').filter(Boolean);
    if (parts.length === 0) return null;

    const name = parts[parts.length - 1];
    const parentPath = '/' + parts.slice(0, -1).join('/');
    const parent = this.getNode(parentPath);
    if (!parent || parent.type !== 'directory') return null;

    return { parent, name };
  }

  getCwd(): string {
    return this.cwd;
  }

  setCwd(path: string): boolean {
    const node = this.getNode(path);
    if (node && node.type === 'directory') {
      this.cwd = this.resolvePath(path);
      return true;
    }
    return false;
  }

  listDir(path: string): FSNode[] {
    const node = this.getNode(path);
    if (!node || node.type !== 'directory' || !node.children) return [];
    return Array.from(node.children.values());
  }

  readFile(path: string): string | null {
    const node = this.getNode(path);
    if (!node || node.type !== 'file') return null;
    return node.content ?? '';
  }

  writeFile(path: string, content: string, append = false): boolean {
    const result = this.getParentNode(path);
    if (!result) return false;
    const { parent, name } = result;

    const existing = parent.children!.get(name);
    if (existing && existing.type !== 'file') return false;

    const newContent = append && existing ? (existing.content ?? '') + content : content;
    const node = this.makeFile(name, newContent);
    parent.children!.set(name, node);
    return true;
  }

  mkdir(path: string, recursive = false): boolean {
    const resolved = this.resolvePath(path);
    const parts = resolved.split('/').filter(Boolean);

    if (recursive) {
      let current = this.root;
      for (const part of parts) {
        if (!current.children!.has(part)) {
          const newDir = this.makeDir(part);
          current.children!.set(part, newDir);
        }
        const next = current.children!.get(part)!;
        if (next.type !== 'directory') return false;
        current = next;
      }
      return true;
    } else {
      const result = this.getParentNode(path);
      if (!result) return false;
      const { parent, name } = result;
      if (parent.children!.has(name)) return false;
      parent.children!.set(name, this.makeDir(name));
      return true;
    }
  }

  rm(path: string, recursive = false): boolean {
    const result = this.getParentNode(path);
    if (!result) return false;
    const { parent, name } = result;
    const node = parent.children!.get(name);
    if (!node) return false;
    if (node.type === 'directory' && !recursive) return false;
    parent.children!.delete(name);
    return true;
  }

  cp(src: string, dest: string): boolean {
    const srcNode = this.getNode(src);
    if (!srcNode || srcNode.type !== 'file') return false;

    const destResult = this.getParentNode(dest);
    if (!destResult) return false;
    const { parent, name } = destResult;

    const copy: FSNode = { ...srcNode, name };
    parent.children!.set(name, copy);
    return true;
  }

  mv(src: string, dest: string): boolean {
    if (!this.cp(src, dest)) return false;
    return this.rm(src);
  }

  exists(path: string): boolean {
    return this.getNode(path) !== null;
  }

  touch(path: string): boolean {
    const node = this.getNode(path);
    if (node) {
      node.modified = new Date();
      return true;
    }
    return this.writeFile(path, '');
  }

  chmod(path: string, mode: string): boolean {
    const node = this.getNode(path);
    if (!node) return false;
    node.permissions = this.modeToPermString(mode, node.type === 'directory');
    return true;
  }

  private modeToPermString(mode: string, isDir: boolean): string {
    const prefix = isDir ? 'd' : '-';
    if (/^[0-7]{3,4}$/.test(mode)) {
      const octal = mode.length === 4 ? mode.slice(1) : mode;
      const chars = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
      return prefix + chars[parseInt(octal[0])] + chars[parseInt(octal[1])] + chars[parseInt(octal[2])];
    }
    return prefix + 'rwxr-xr-x';
  }

  formatSize(size: number): string {
    if (size < 1024) return `${size}`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}K`;
    return `${(size / (1024 * 1024)).toFixed(1)}M`;
  }

  getCwdDisplay(home = '/home/root'): string {
    if (this.cwd === home) return '~';
    if (this.cwd.startsWith(home + '/')) return '~' + this.cwd.slice(home.length);
    return this.cwd;
  }
}
