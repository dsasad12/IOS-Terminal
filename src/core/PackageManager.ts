export interface Package {
  name: string;
  version: string;
  description: string;
  size: string;
  installed: boolean;
  dependencies?: string[];
  category: string;
}

const PACKAGE_DATABASE: Package[] = [
  // Security / Hacking
  { name: 'nmap', version: '7.94', description: 'Network exploration tool and security/port scanner', size: '4.2MB', installed: false, category: 'net', dependencies: [] },
  { name: 'metasploit-framework', version: '6.3.55', description: 'Penetration testing framework', size: '245MB', installed: false, category: 'security', dependencies: ['ruby'] },
  { name: 'hydra', version: '9.5', description: 'Fast and flexible online password cracking tool', size: '1.8MB', installed: false, category: 'security', dependencies: [] },
  { name: 'john', version: '1.9.0', description: 'John the Ripper password cracker', size: '12MB', installed: false, category: 'security', dependencies: [] },
  { name: 'sqlmap', version: '1.7.11', description: 'Automatic SQL injection and database takeover tool', size: '28MB', installed: false, category: 'security', dependencies: ['python'] },
  { name: 'aircrack-ng', version: '1.7', description: '802.11 WEP and WPA-PSK key cracking', size: '8.4MB', installed: false, category: 'security', dependencies: [] },
  { name: 'nikto', version: '2.1.6', description: 'Web server scanner', size: '3.2MB', installed: false, category: 'security', dependencies: ['perl'] },
  { name: 'wireshark', version: '4.2.2', description: 'Network traffic analyzer (tshark)', size: '18MB', installed: false, category: 'net', dependencies: [] },
  { name: 'burpsuite', version: '2024.1', description: 'Web application security testing platform', size: '156MB', installed: false, category: 'security', dependencies: ['java'] },
  { name: 'gobuster', version: '3.6.0', description: 'Directory/file/DNS/vhost busting tool', size: '6.2MB', installed: false, category: 'security', dependencies: [] },
  { name: 'hashcat', version: '6.2.6', description: 'World\'s fastest and most advanced password recovery', size: '45MB', installed: false, category: 'security', dependencies: [] },
  { name: 'maltego', version: '4.6.0', description: 'OSINT and forensics application', size: '89MB', installed: false, category: 'security', dependencies: ['java'] },
  { name: 'beef-xss', version: '0.5.4', description: 'Browser Exploitation Framework', size: '32MB', installed: false, category: 'security', dependencies: ['ruby', 'nodejs'] },
  { name: 'theharvester', version: '4.4.3', description: 'E-mail, subdomain and people names harvester', size: '5.1MB', installed: false, category: 'security', dependencies: ['python'] },
  { name: 'dirb', version: '2.22', description: 'Web content scanner', size: '1.2MB', installed: false, category: 'security', dependencies: [] },
  { name: 'netcat', version: '1.10', description: 'TCP/IP swiss army knife', size: '0.4MB', installed: false, category: 'net', dependencies: [] },
  { name: 'tcpdump', version: '4.99.4', description: 'Command-line network traffic analyzer', size: '2.1MB', installed: false, category: 'net', dependencies: [] },
  { name: 'masscan', version: '1.3.2', description: 'Fast port scanner, transmits 10M packets/sec', size: '3.8MB', installed: false, category: 'net', dependencies: [] },
  { name: 'wifite', version: '2.7.0', description: 'Automated wireless auditor', size: '4.5MB', installed: false, category: 'security', dependencies: ['python', 'aircrack-ng'] },
  { name: 'subfinder', version: '2.6.3', description: 'Subdomain discovery tool', size: '8.7MB', installed: false, category: 'security', dependencies: [] },

  // Network
  { name: 'curl', version: '8.5.0', description: 'Command line tool for transferring data with URL syntax', size: '1.2MB', installed: false, category: 'net', dependencies: [] },
  { name: 'wget', version: '1.21.4', description: 'Non-interactive network downloader', size: '0.8MB', installed: false, category: 'net', dependencies: [] },
  { name: 'openssh', version: '9.6p1', description: 'OpenBSD Secure Shell client and server', size: '4.8MB', installed: false, category: 'net', dependencies: [] },
  { name: 'tor', version: '0.4.8.10', description: 'Anonymizing overlay network for TCP', size: '8.2MB', installed: false, category: 'net', dependencies: [] },
  { name: 'proxychains-ng', version: '4.16', description: 'Proxy chains - redirect connections through proxy servers', size: '0.6MB', installed: false, category: 'net', dependencies: [] },
  { name: 'socat', version: '1.7.4.4', description: 'Multipurpose relay for bidirectional data transfer', size: '0.7MB', installed: false, category: 'net', dependencies: [] },
  { name: 'iproute2', version: '6.7.0', description: 'IP routing utilities', size: '2.4MB', installed: false, category: 'net', dependencies: [] },
  { name: 'dnsutils', version: '9.18.19', description: 'DNS utilities (dig, nslookup)', size: '1.1MB', installed: false, category: 'net', dependencies: [] },
  { name: 'whois', version: '5.5.21', description: 'Internet domain name and network number directory service', size: '0.3MB', installed: false, category: 'net', dependencies: [] },
  { name: 'traceroute', version: '2.1.5', description: 'Print the route packets trace to network host', size: '0.2MB', installed: false, category: 'net', dependencies: [] },

  // Development
  { name: 'python', version: '3.12.2', description: 'Python 3 programming language interpreter', size: '42MB', installed: false, category: 'devel', dependencies: [] },
  { name: 'python2', version: '2.7.18', description: 'Python 2.7 (legacy)', size: '28MB', installed: false, category: 'devel', dependencies: [] },
  { name: 'nodejs', version: '21.6.1', description: 'JavaScript runtime built on Chrome V8', size: '38MB', installed: false, category: 'devel', dependencies: [] },
  { name: 'ruby', version: '3.3.0', description: 'Object-oriented scripting language', size: '35MB', installed: false, category: 'devel', dependencies: [] },
  { name: 'perl', version: '5.38.2', description: 'Practical Extraction and Report Language', size: '24MB', installed: false, category: 'devel', dependencies: [] },
  { name: 'go', version: '1.22.0', description: 'Open source programming language by Google', size: '118MB', installed: false, category: 'devel', dependencies: [] },
  { name: 'rust', version: '1.76.0', description: 'Safe, concurrent, practical systems language', size: '89MB', installed: false, category: 'devel', dependencies: [] },
  { name: 'java', version: '17.0.10', description: 'Java Runtime Environment (OpenJDK 17)', size: '198MB', installed: false, category: 'devel', dependencies: [] },
  { name: 'php', version: '8.3.2', description: 'HTML-embedded scripting language (PHP)', size: '31MB', installed: false, category: 'devel', dependencies: [] },
  { name: 'gcc', version: '13.2.0', description: 'GNU C and C++ compiler', size: '66MB', installed: false, category: 'devel', dependencies: [] },
  { name: 'clang', version: '17.0.6', description: 'LLVM C language family frontend', size: '58MB', installed: false, category: 'devel', dependencies: [] },
  { name: 'make', version: '4.4.1', description: 'Utility for directing compilation', size: '0.8MB', installed: false, category: 'devel', dependencies: [] },
  { name: 'cmake', version: '3.28.1', description: 'Cross-platform, open-source make system', size: '12MB', installed: false, category: 'devel', dependencies: [] },
  { name: 'git', version: '2.44.0', description: 'Fast, scalable, distributed revision control system', size: '8.6MB', installed: false, category: 'devel', dependencies: [] },
  { name: 'vim', version: '9.1.0', description: 'Vi IMproved - enhanced vi editor', size: '4.2MB', installed: false, category: 'editors', dependencies: [] },
  { name: 'neovim', version: '0.9.5', description: 'Highly extensible Vim-based text editor', size: '6.8MB', installed: false, category: 'editors', dependencies: [] },
  { name: 'nano', version: '7.2', description: 'Small and friendly text editor', size: '0.9MB', installed: false, category: 'editors', dependencies: [] },
  { name: 'emacs', version: '29.2', description: 'GNU Emacs editor (nox - no X support)', size: '28MB', installed: false, category: 'editors', dependencies: [] },

  // Utilities
  { name: 'htop', version: '3.3.0', description: 'Interactive processes viewer', size: '0.4MB', installed: false, category: 'utils', dependencies: [] },
  { name: 'tmux', version: '3.4', description: 'Terminal multiplexer', size: '0.8MB', installed: false, category: 'utils', dependencies: [] },
  { name: 'screen', version: '4.9.1', description: 'Terminal multiplexer with VT100/ANSI terminal emulation', size: '0.6MB', installed: false, category: 'utils', dependencies: [] },
  { name: 'zsh', version: '5.9', description: 'Shell with lots of features', size: '3.2MB', installed: false, category: 'shells', dependencies: [] },
  { name: 'bash', version: '5.2.26', description: 'GNU Bourne Again SHell', size: '1.8MB', installed: false, category: 'shells', dependencies: [] },
  { name: 'fish', version: '3.7.0', description: 'Friendly interactive shell', size: '4.1MB', installed: false, category: 'shells', dependencies: [] },
  { name: 'jq', version: '1.7.1', description: 'Command-line JSON processor', size: '0.6MB', installed: false, category: 'utils', dependencies: [] },
  { name: 'tree', version: '2.1.1', description: 'Display directory tree structure', size: '0.2MB', installed: false, category: 'utils', dependencies: [] },
  { name: 'zip', version: '3.0', description: 'Archiver for .zip files', size: '0.3MB', installed: false, category: 'utils', dependencies: [] },
  { name: 'unzip', version: '6.0', description: 'De-archiver for .zip files', size: '0.2MB', installed: false, category: 'utils', dependencies: [] },
  { name: 'tar', version: '1.35', description: 'Utility to create tar archives', size: '0.5MB', installed: false, category: 'utils', dependencies: [] },
  { name: 'gzip', version: '1.13', description: 'GNU compression utility', size: '0.2MB', installed: false, category: 'utils', dependencies: [] },
  { name: 'ripgrep', version: '14.1.0', description: 'Recursively search directories for a regex pattern', size: '1.4MB', installed: false, category: 'utils', dependencies: [] },
  { name: 'fzf', version: '0.48.1', description: 'Command-line fuzzy finder', size: '1.2MB', installed: false, category: 'utils', dependencies: [] },
  { name: 'bat', version: '0.24.0', description: 'Cat clone with syntax highlighting', size: '2.1MB', installed: false, category: 'utils', dependencies: [] },
  { name: 'fd', version: '9.0.0', description: 'Simple, fast and user-friendly alternative to find', size: '0.9MB', installed: false, category: 'utils', dependencies: [] },
  { name: 'cron', version: '3.0pl1', description: 'Process scheduling daemon', size: '0.3MB', installed: false, category: 'utils', dependencies: [] },
  { name: 'openssh-client', version: '9.6p1', description: 'Secure Shell (SSH) client', size: '2.4MB', installed: false, category: 'net', dependencies: [] },

  // Crypto/Privacy
  { name: 'gpg', version: '2.4.4', description: 'GNU Privacy Guard - encryption and signing', size: '3.8MB', installed: false, category: 'security', dependencies: [] },
  { name: 'openssl', version: '3.2.1', description: 'Secure Sockets Layer toolkit', size: '5.2MB', installed: false, category: 'libs', dependencies: [] },

  // Database
  { name: 'sqlite', version: '3.45.1', description: 'C library that implements an SQL database engine', size: '2.8MB', installed: false, category: 'database', dependencies: [] },
  { name: 'mariadb', version: '11.3.2', description: 'Fast SQL database server', size: '52MB', installed: false, category: 'database', dependencies: [] },
  { name: 'postgresql', version: '16.2', description: 'Object-relational SQL database', size: '48MB', installed: false, category: 'database', dependencies: [] },
  { name: 'redis', version: '7.2.4', description: 'Persistent key-value database', size: '8.4MB', installed: false, category: 'database', dependencies: [] },

  // Web servers
  { name: 'nginx', version: '1.25.4', description: 'Small, powerful, scalable web/proxy server', size: '4.2MB', installed: false, category: 'web', dependencies: [] },
  { name: 'apache2', version: '2.4.58', description: 'Apache HTTP Server', size: '6.8MB', installed: false, category: 'web', dependencies: [] },
];

export class PackageManager {
  private packages: Map<string, Package>;
  private lastUpdate: Date | null;
  private updateAvailable: Map<string, string>;

  constructor() {
    this.packages = new Map(PACKAGE_DATABASE.map(p => [p.name, { ...p }]));
    this.lastUpdate = null;
    this.updateAvailable = new Map();
  }

  search(query: string): Package[] {
    const q = query.toLowerCase();
    return Array.from(this.packages.values()).filter(
      p => p.name.includes(q) || p.description.toLowerCase().includes(q)
    );
  }

  getPackage(name: string): Package | undefined {
    return this.packages.get(name);
  }

  getInstalled(): Package[] {
    return Array.from(this.packages.values()).filter(p => p.installed);
  }

  isInstalled(name: string): boolean {
    return this.packages.get(name)?.installed ?? false;
  }

  async install(names: string[], onProgress: (line: string) => void): Promise<boolean> {
    const toInstall: Package[] = [];

    for (const name of names) {
      const pkg = this.packages.get(name);
      if (!pkg) {
        onProgress(`E: Unable to locate package ${name}`);
        return false;
      }
      if (pkg.installed) {
        onProgress(`${name} is already the newest version (${pkg.version}).`);
        continue;
      }
      toInstall.push(pkg);

      // Resolve dependencies
      for (const dep of pkg.dependencies ?? []) {
        const depPkg = this.packages.get(dep);
        if (depPkg && !depPkg.installed && !toInstall.includes(depPkg)) {
          toInstall.push(depPkg);
        }
      }
    }

    if (toInstall.length === 0) return true;

    const totalSize = toInstall.reduce((acc, p) => acc + parseFloat(p.size), 0);
    onProgress(`The following NEW packages will be installed:`);
    onProgress(`  ${toInstall.map(p => p.name).join(' ')}`);
    onProgress(`0 upgraded, ${toInstall.length} newly installed, 0 to remove and 0 not upgraded.`);
    onProgress(`Need to get ${totalSize.toFixed(1)} MB of archives.`);
    onProgress(`After this operation, ${(totalSize * 2.8).toFixed(0)} MB of additional disk space will be used.`);
    onProgress('');

    await this.delay(200);

    for (const pkg of toInstall) {
      onProgress(`Get:1 https://packages.hackterm.io/apt stable/main arm64 ${pkg.name} arm64 ${pkg.version} [${pkg.size}]`);
      await this.delay(150);
      onProgress(`Fetched ${pkg.size} in 0s (${(parseFloat(pkg.size) * 8).toFixed(0)} MB/s)`);
      await this.delay(100);
      onProgress(`Selecting previously unselected package ${pkg.name}.`);
      onProgress(`(Reading database ... 24381 files and directories currently installed.)`);
      onProgress(`Preparing to unpack .../archives/${pkg.name}_${pkg.version}_arm64.deb ...`);
      await this.delay(200);
      onProgress(`Unpacking ${pkg.name} (${pkg.version}) ...`);
      await this.delay(300);
      onProgress(`Setting up ${pkg.name} (${pkg.version}) ...`);
      await this.delay(200);

      pkg.installed = true;
    }

    onProgress(`Processing triggers for man-db (2.12.0-4) ...`);
    return true;
  }

  async remove(names: string[], onProgress: (line: string) => void): Promise<boolean> {
    for (const name of names) {
      const pkg = this.packages.get(name);
      if (!pkg) {
        onProgress(`E: Unable to locate package ${name}`);
        return false;
      }
      if (!pkg.installed) {
        onProgress(`Package '${name}' is not installed, so not removed`);
        continue;
      }
      onProgress(`The following packages will be REMOVED:`);
      onProgress(`  ${name}`);
      await this.delay(300);
      onProgress(`(Reading database ... 24381 files and directories currently installed.)`);
      onProgress(`Removing ${name} (${pkg.version}) ...`);
      await this.delay(400);
      onProgress(`Processing triggers for man-db (2.12.0-4) ...`);
      pkg.installed = false;
    }
    return true;
  }

  async update(onProgress: (line: string) => void): Promise<void> {
    onProgress('Get:1 https://packages.hackterm.io/apt stable InRelease [4,096 B]');
    await this.delay(300);
    onProgress('Get:2 https://termux.net/apt/termux-main stable InRelease [4,096 B]');
    await this.delay(200);
    onProgress('Hit:3 https://packages.hackterm.io/apt stable/main arm64 Packages');
    await this.delay(150);
    onProgress('Reading package lists... Done');
    await this.delay(300);
    onProgress('Building dependency tree... Done');
    await this.delay(200);
    onProgress('Reading state information... Done');
    await this.delay(100);

    const upgradeable = Array.from(this.packages.values())
      .filter(p => p.installed)
      .slice(0, 3);
    if (upgradeable.length > 0) {
      onProgress(`${upgradeable.length} package${upgradeable.length > 1 ? 's' : ''} can be upgraded. Run 'apt list --upgradable' to see them.`);
    } else {
      onProgress('All packages are up to date.');
    }
    this.lastUpdate = new Date();
  }

  async upgrade(onProgress: (line: string) => void): Promise<void> {
    const installed = this.getInstalled();
    if (installed.length === 0) {
      onProgress('0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.');
      return;
    }

    onProgress('Reading package lists... Done');
    await this.delay(200);
    onProgress('Building dependency tree... Done');
    await this.delay(100);
    onProgress('Calculating upgrade... Done');
    await this.delay(200);
    onProgress(`${installed.length} upgraded, 0 newly installed, 0 to remove and 0 not upgraded.`);
    onProgress(`Need to get 12.4 MB of archives.`);
    await this.delay(300);

    for (const pkg of installed.slice(0, 3)) {
      onProgress(`Get:1 https://packages.hackterm.io/apt stable/main ${pkg.name} arm64 ${pkg.version}+1`);
      await this.delay(200);
    }
    onProgress('Fetched 12.4 MB in 2s (6,200 kB/s)');
    await this.delay(400);
    onProgress('Reading changelogs... Done');
    await this.delay(200);
    onProgress('Preconfiguring packages ...');
    await this.delay(300);
    onProgress('...upgrade complete.');
  }

  listAll(): Package[] {
    return Array.from(this.packages.values());
  }

  showInfo(name: string): string | null {
    const pkg = this.packages.get(name);
    if (!pkg) return null;
    return [
      `Package: ${pkg.name}`,
      `Version: ${pkg.version}`,
      `Architecture: arm64`,
      `Maintainer: HackTerm Team <team@hackterm.io>`,
      `Installed-Size: ${pkg.size}`,
      `Description: ${pkg.description}`,
      `Category: ${pkg.category}`,
      `Status: ${pkg.installed ? 'install ok installed' : 'deinstall ok config-files'}`,
    ].join('\n');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
