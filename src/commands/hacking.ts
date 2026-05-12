import { CommandContext } from '../core/CommandProcessor';

function randomIP(): string {
  return `${Math.floor(Math.random() * 254 + 1)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`;
}

function randomHash(len: number): string {
  return Array.from({length: len}, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export const hackingCommands: Record<string, (cmd: string, args: string[], ctx: CommandContext) => Promise<void>> = {
  async hydra(cmd, args, ctx) {
    if (!ctx.pm.isInstalled('hydra')) {
      ctx.output('hydra: command not found\nInstall with: apt install hydra', 'error'); return;
    }
    const target = args.find(a => !a.startsWith('-') && !a.startsWith('ssh') && !a.startsWith('ftp')) ?? 'target';
    ctx.output(`Hydra v9.5 (c) 2023 by van Hauser/THC & David Maciejak`);
    ctx.output('[DATA] max 16 tasks per 1 server, overall 16 tasks, 14344399 login tries');
    ctx.output(`[DATA] attacking ${target}`);
    await new Promise(r => setTimeout(r, 800));
    ctx.output('[STATUS] 264 attempts/min');
    await new Promise(r => setTimeout(r, 600));
    ctx.output('[STATUS] attack finished for target (waiting for children to complete tests)');
    ctx.output(`[INFO] Session saved in /home/root/.hydra_restore`);
    ctx.output('Hydra (https://github.com/vanhauser-thc/thc-hydra) finished.');
  },

  async sqlmap(cmd, args, ctx) {
    if (!ctx.pm.isInstalled('sqlmap')) {
      ctx.output('sqlmap: command not found\nInstall with: apt install sqlmap', 'error'); return;
    }
    const url = args.find(a => a.startsWith('http')) ?? args.find(a => a.startsWith('-u'))?.replace('-u', '') ?? 'http://target.com/page?id=1';
    ctx.output(`        ___`);
    ctx.output(`       __H__`);
    ctx.output(` ___ ___[']_____ ___ ___  {1.7.11#stable}`);
    ctx.output(`|_ -| . [)]     | .'| . |`);
    ctx.output(`|___|_  [']_|_|_|__,|  _|`);
    ctx.output(`      |_|V...       |_|   https://sqlmap.org`);
    ctx.output('');
    ctx.output(`[*] starting @ ${new Date().toLocaleTimeString()}`);
    ctx.output('');
    ctx.output(`[INFO] testing connection to the target URL`);
    await new Promise(r => setTimeout(r, 400));
    ctx.output(`[INFO] testing if the target URL content is stable`);
    await new Promise(r => setTimeout(r, 300));
    ctx.output(`[INFO] target URL content is stable`);
    ctx.output(`[INFO] testing if GET parameter 'id' is dynamic`);
    await new Promise(r => setTimeout(r, 200));
    ctx.output(`[WARNING] GET parameter 'id' does not appear to be dynamic`);
    ctx.output(`[INFO] heuristic (basic) test shows that GET parameter 'id' might be injectable`);
    ctx.output(`[INFO] testing for SQL injection on GET parameter 'id'`);
    await new Promise(r => setTimeout(r, 500));
    ctx.output(`[INFO] GET parameter 'id' appears to be 'AND boolean-based blind - WHERE or HAVING clause' injectable`);
    ctx.output(`[INFO] sqlmap identified the following injection point(s) with a total of 63 HTTP(s) requests:`);
    ctx.output(`Parameter: id (GET)`);
    ctx.output(`    Type: boolean-based blind`);
    ctx.output(`    Payload: id=1 AND 1=1--`);
    ctx.output('');
    ctx.output(`[INFO] the back-end DBMS is MySQL`);
    ctx.output(`back-end DBMS: MySQL >= 5.0.12`);
    ctx.output(`[*] ending @ ${new Date().toLocaleTimeString()}`);
  },

  async nikto(cmd, args, ctx) {
    if (!ctx.pm.isInstalled('nikto')) {
      ctx.output('nikto: command not found\nInstall with: apt install nikto', 'error'); return;
    }
    const host = args.find(a => !a.startsWith('-')) ?? args[args.indexOf('-h') + 1] ?? 'target.com';
    ctx.output(`- Nikto v2.1.6`);
    ctx.output(`---------------------------------------------------------------------------`);
    ctx.output(`+ Target IP:          ${randomIP()}`);
    ctx.output(`+ Target Hostname:    ${host}`);
    ctx.output(`+ Target Port:        80`);
    ctx.output(`+ Start Time:         ${new Date().toISOString()}`);
    ctx.output(`---------------------------------------------------------------------------`);
    await new Promise(r => setTimeout(r, 500));
    ctx.output(`+ Server: Apache/2.4.58 (Ubuntu)`);
    ctx.output(`+ /: The anti-clickjacking X-Frame-Options header is not present.`);
    ctx.output(`+ /: The X-Content-Type-Options header is not set.`);
    await new Promise(r => setTimeout(r, 300));
    ctx.output(`+ No CGI Directories found`);
    ctx.output(`+ /config.php: PHP Config file may contain database IDs and passwords.`);
    ctx.output(`+ /admin/: This might be interesting.`);
    ctx.output(`+ /backup/: This might be interesting.`);
    ctx.output(`+ 7916 requests: 0 error(s) and 6 item(s) reported on remote host`);
    ctx.output(`+ End Time: ${new Date().toISOString()}`);
    ctx.output(`---------------------------------------------------------------------------`);
  },

  async gobuster(cmd, args, ctx) {
    if (!ctx.pm.isInstalled('gobuster')) {
      ctx.output('gobuster: command not found\nInstall with: apt install gobuster', 'error'); return;
    }
    const mode = args[0] ?? 'dir';
    const url = args.find(a => a.startsWith('http')) ?? 'http://target.com';
    ctx.output(`===============================================================`);
    ctx.output(`Gobuster v3.6.0`);
    ctx.output(`by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)`);
    ctx.output(`===============================================================`);
    ctx.output(`[+] Url:                     ${url}`);
    ctx.output(`[+] Method:                  GET`);
    ctx.output(`[+] Threads:                 10`);
    ctx.output(`[+] Wordlist:                /usr/share/wordlists/dirb/common.txt`);
    ctx.output(`[+] Status codes:            200,204,301,302,307,401,403`);
    ctx.output(`===============================================================`);
    ctx.output(`${new Date().toLocaleString()} Starting gobuster in directory enumeration mode`);
    ctx.output(`===============================================================`);
    await new Promise(r => setTimeout(r, 400));

    const dirs = ['/admin', '/backup', '/api', '/config', '/wp-admin', '/login', '/dashboard', '/.git', '/uploads'];
    for (const dir of dirs) {
      await new Promise(r => setTimeout(r, 150));
      const codes = [200, 301, 302, 403];
      const code = codes[Math.floor(Math.random() * codes.length)];
      if (code !== 404) {
        ctx.output(`/${dir.slice(1).padEnd(20)} (Status: ${code}) [Size: ${Math.floor(Math.random() * 5000)}]`, code === 200 ? 'success' : 'warning');
      }
    }
    ctx.output(`===============================================================`);
    ctx.output(`${new Date().toLocaleString()} Finished`);
    ctx.output(`===============================================================`);
  },

  async hashcat(cmd, args, ctx) {
    if (!ctx.pm.isInstalled('hashcat')) {
      ctx.output('hashcat: command not found\nInstall with: apt install hashcat', 'error'); return;
    }
    ctx.output(`hashcat (v6.2.6) starting...`);
    ctx.output('');
    ctx.output(`Host memory required for this attack mode: 2 MB`);
    ctx.output('');
    ctx.output(`Dictionary cache built:`);
    ctx.output(`* Filename..: /usr/share/wordlists/rockyou.txt`);
    ctx.output(`* Passwords.: 14344392`);
    ctx.output(`* Bytes.....: 139921507`);
    ctx.output(`* Keyspace..: 14344392`);
    await new Promise(r => setTimeout(r, 600));
    ctx.output(`Session..........: hashcat`);
    ctx.output(`Status...........: Running`);
    ctx.output(`Hash.Mode........: 0 (MD5)`);
    ctx.output(`Time.Started.....: ${new Date().toLocaleString()}`);
    ctx.output(`Speed.#1.........:  2345.6 kH/s`);
    ctx.output(`Recovered........: 0/1 (0.00%) Digests`);
    ctx.output(`Progress.........: 1048576/14344392 (7.31%)`);
    await new Promise(r => setTimeout(r, 500));
    ctx.output(`Session..........: hashcat`);
    ctx.output(`Status...........: Exhausted`);
    ctx.output(`Recovered........: 0/1 (0.00%) Digests`);
    ctx.output(`Stopped: ${new Date().toLocaleString()}`);
  },

  async john(cmd, args, ctx) {
    if (!ctx.pm.isInstalled('john')) {
      ctx.output('john: command not found\nInstall with: apt install john', 'error'); return;
    }
    ctx.output(`John the Ripper 1.9.0-jumbo-1+ (linux-arm64, 128-bit key, ...)`);
    ctx.output(`Copyright (c) 1996-2022 by Solar Designer and others`);
    ctx.output('');
    ctx.output(`Using default input encoding: UTF-8`);
    await new Promise(r => setTimeout(r, 300));
    ctx.output(`Loaded 1 password hash (sha512crypt, crypt(3) $6$ [SHA512 128/128 ASIMD 2x])`);
    ctx.output(`Will run 4 OpenMP threads`);
    ctx.output(`Proceeding with single, rules:Single`);
    await new Promise(r => setTimeout(r, 400));
    ctx.output(`Press 'q' or Ctrl-C to abort, 'h' for help, almost any other key for status`);
    ctx.output(`0g 0:00:00:04 0.00% (ETA: ...) 0g/s 0p/s 0c/s 0C/s`);
    ctx.output(`Session aborted`);
  },

  async aircrack(cmd, args, ctx) {
    if (!ctx.pm.isInstalled('aircrack-ng')) {
      ctx.output('aircrack-ng: command not found\nInstall with: apt install aircrack-ng', 'error'); return;
    }
    ctx.output(`Aircrack-ng 1.7  r3512`);
    ctx.output('[00:00:01] Tested 1024 keys (got 12 IVs)');
    ctx.output('');
    ctx.output(`           KB    depth   byte(vote)`);
    ctx.output(`            0    0/  1   F5(  118) B5(  108) 3E(  108)`);
    ctx.output(`            1    0/  2   2E(  136) 8B(  106) 1A(  106)`);
  },

  async msfconsole(cmd, args, ctx) {
    if (!ctx.pm.isInstalled('metasploit-framework')) {
      ctx.output('msfconsole: command not found\nInstall with: apt install metasploit-framework', 'error'); return;
    }
    ctx.output(`                                                  `);
    ctx.output(`                 .                                `);
    ctx.output(`         .,.   ,                                  `);
    ctx.output(`   ,--.-.-.  ,-'-.-.,'--'  Metasploit            `);
    ctx.output(`  / '.-'.-' '-.-.'-'-.'-'   Framework v6.3.55    `);
    ctx.output(` '-.-.'-'.-'.-'.-     .-'  =[ metasploit v6.3 ]= `);
    ctx.output('');
    ctx.output('       =[ metasploit v6.3.55-dev                          ]');
    ctx.output('+ -- --=[ 2376 exploits - 1232 auxiliary - 416 post       ]');
    ctx.output('+ -- --=[ 1169 payloads - 45 encoders - 11 nops           ]');
    ctx.output('+ -- --=[ 9 evasion                                       ]');
    ctx.output('');
    ctx.output(`[*] Starting the Metasploit Framework console...\n`);
    ctx.output('msf6 > (interactive mode not available in HackTerm shell)', 'warning');
    ctx.output('       Use: msfconsole -x "use exploit/multi/handler; set PAYLOAD generic/shell_reverse_tcp; run"', 'info');
  },

  async theharvester(cmd, args, ctx) {
    if (!ctx.pm.isInstalled('theharvester')) {
      ctx.output('theHarvester: command not found\nInstall with: apt install theharvester', 'error'); return;
    }
    const domain = args.find(a => !a.startsWith('-')) ?? args[args.indexOf('-d') + 1] ?? 'target.com';
    ctx.output(`*******************************************************************`);
    ctx.output(`*  _   _                                            _             *`);
    ctx.output(`* | |_| |__   ___    /\\  /\\__ _ _ ____   _____  ___| |_ ___ _ __ *`);
    ctx.output(`* | __|  _ \\ / _ \\  / /_/ / _\` | '__\\ \\ / / _ \\/ __| __/ _ \\ '__|*`);
    ctx.output(`* | |_| | | |  __/ / __  / (_| | |   \\ V /  __/\\__ \\ ||  __/ |   *`);
    ctx.output(`*  \\__|_| |_|\\___| \\/ /_/ \\__,_|_|    \\_/ \\___||___/\\__\\___|_|   *`);
    ctx.output(`*                                                                 *`);
    ctx.output(`* theHarvester 4.4.3                                             *`);
    ctx.output(`*******************************************************************`);
    ctx.output('');
    ctx.output(`[*] Target: ${domain}`);
    ctx.output(`[*] Searching 0 results...`);
    await new Promise(r => setTimeout(r, 500));
    ctx.output(`[*] Searching Baidu`);
    await new Promise(r => setTimeout(r, 300));
    ctx.output(`[*] Searching Bing`);
    await new Promise(r => setTimeout(r, 300));
    ctx.output(`[*] Searching Certspotter`);

    // Simulated results
    ctx.output('');
    ctx.output('[*] Emails found:');
    ctx.output('------------------');
    ctx.output(`admin@${domain}`);
    ctx.output(`info@${domain}`);
    ctx.output(`security@${domain}`);

    ctx.output('');
    ctx.output('[*] Hosts found:');
    ctx.output('-----------------');
    for (let i = 0; i < 5; i++) {
      ctx.output(`${['www', 'mail', 'api', 'vpn', 'admin'][i]}.${domain}: ${randomIP()}`);
    }
  },

  async wifite(cmd, args, ctx) {
    if (!ctx.pm.isInstalled('wifite')) {
      ctx.output('wifite: command not found\nInstall with: apt install wifite', 'error'); return;
    }
    ctx.output(`  .               ,  .   .        `);
    ctx.output(` wifite 2.7.0    .  . (    ) .     `);
    ctx.output(`.           .  .                  .`);
    ctx.output('');
    ctx.output('[!] WARNING: Wireless scanning requires physical wireless adapter');
    ctx.output('[!] iOS does not support monitor mode without additional hardware');
    ctx.output('[*] Scanning for wireless networks...');
    await new Promise(r => setTimeout(r, 500));
    ctx.output('[!] No wireless interfaces found in monitor mode', 'warning');
  },

  async gpg(cmd, args, ctx) {
    if (!ctx.pm.isInstalled('gpg')) {
      ctx.output('gpg: command not found\nInstall with: apt install gpg', 'error'); return;
    }
    const genKey = args.includes('--gen-key') || args.includes('--generate-key');
    const listKeys = args.includes('--list-keys') || args.includes('-k');
    const encrypt = args.includes('-e') || args.includes('--encrypt');
    const decrypt = args.includes('-d') || args.includes('--decrypt');

    if (genKey) {
      ctx.output('gpg (GnuPG) 2.4.4');
      ctx.output('Note: Use "gpg --full-generate-key" for a full featured key generation dialog.');
      ctx.output('');
      ctx.output('GnuPG needs to construct a user ID to identify your key.');
      ctx.output('');
      ctx.output('Real name: HackTerm User');
      ctx.output('Email address: root@hackterm.io');
      ctx.output('You selected this USER-ID:');
      ctx.output('    "HackTerm User <root@hackterm.io>"');
      ctx.output('');
      ctx.output('pub   ed25519 2024-01-01 [SC]');
      ctx.output(`      ${randomHash(40).toUpperCase()}`);
      ctx.output('uid           [ultimate] HackTerm User <root@hackterm.io>');
      ctx.output('sub   cv25519 2024-01-01 [E]');
    } else if (listKeys) {
      ctx.output('/home/root/.gnupg/pubring.kbx');
      ctx.output('----------------------------');
      ctx.output('pub   ed25519 2024-01-01 [SC]');
      ctx.output(`      ${randomHash(40).toUpperCase()}`);
      ctx.output('uid           [ultimate] HackTerm User <root@hackterm.io>');
      ctx.output('sub   cv25519 2024-01-01 [E]');
    } else {
      ctx.output(`gpg (GnuPG) 2.4.4; Copyright (C) 2023 g10 Code GmbH`);
      ctx.output('This is free software: you are free to change and redistribute it.');
    }
  },

  async openssl(cmd, args, ctx) {
    if (!ctx.pm.isInstalled('openssl')) {
      ctx.output('openssl: command not found\nInstall with: apt install openssl', 'error'); return;
    }
    const sub = args[0];
    if (sub === 'version') {
      ctx.output('OpenSSL 3.2.1 30 Jan 2024 (Library: OpenSSL 3.2.1 30 Jan 2024)');
    } else if (sub === 'rand') {
      const bytes = parseInt(args[1] ?? '16');
      const hex = args.includes('-hex');
      if (hex) ctx.output(randomHash(bytes * 2));
      else ctx.output(`[${bytes} random bytes]`);
    } else if (sub === 'genrsa') {
      const bits = parseInt(args.find(a => /^\d+$/.test(a)) ?? '2048');
      ctx.output(`Generating RSA private key, ${bits} bit long modulus (2 primes)`);
      ctx.output('..+++');
      ctx.output('...........+++');
      ctx.output('e is 65537 (0x010001)');
      ctx.output('-----BEGIN RSA PRIVATE KEY-----');
      for (let i = 0; i < 5; i++) ctx.output(randomHash(64).toUpperCase());
      ctx.output('-----END RSA PRIVATE KEY-----');
    } else if (sub === 'enc') {
      ctx.output('OpenSSL enc: processed (encryption simulation)');
    } else {
      ctx.output(`OpenSSL> ${args.join(' ')}`);
      ctx.output('(OpenSSL commands available: version, rand, genrsa, enc, dgst, s_client)');
    }
  },

  async tor(cmd, args, ctx) {
    if (!ctx.pm.isInstalled('tor')) {
      ctx.output('tor: command not found\nInstall with: apt install tor', 'error'); return;
    }
    ctx.output(`${new Date().toLocaleString()} [notice] Tor 0.4.8.10 running on Linux`);
    ctx.output(`${new Date().toLocaleString()} [notice] Tor can't help you if you use it wrong!`);
    ctx.output(`${new Date().toLocaleString()} [notice] Configuration file "/etc/tor/torrc" not present.`);
    ctx.output(`${new Date().toLocaleString()} [notice] Bootstrapped 0% (starting): Starting`);
    await new Promise(r => setTimeout(r, 400));
    ctx.output(`${new Date().toLocaleString()} [notice] Bootstrapped 85% (loading_keys): Loading relay keys`);
    await new Promise(r => setTimeout(r, 300));
    ctx.output(`${new Date().toLocaleString()} [notice] Bootstrapped 100% (done): Done`);
    ctx.output(`${new Date().toLocaleString()} [notice] Now checking whether ORPort 127.0.0.1:9001 is reachable...`);
    ctx.output('Tor is running. SOCKS proxy on 127.0.0.1:9050', 'success');
  },
};
