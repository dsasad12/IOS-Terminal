import { CommandContext } from '../core/CommandProcessor';

function randomIP(): string {
  return `${Math.floor(Math.random() * 254 + 1)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`;
}

function randomMac(): string {
  return Array.from({length: 6}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':');
}

function randomPort(): number {
  return Math.floor(Math.random() * 65535) + 1;
}

const COMMON_PORTS: Record<number, string> = {
  21: 'ftp', 22: 'ssh', 23: 'telnet', 25: 'smtp', 53: 'dns',
  80: 'http', 110: 'pop3', 143: 'imap', 443: 'https', 445: 'smb',
  3306: 'mysql', 3389: 'rdp', 5432: 'postgresql', 6379: 'redis',
  8080: 'http-alt', 8443: 'https-alt', 27017: 'mongodb',
};

export const networkCommands: Record<string, (cmd: string, args: string[], ctx: CommandContext) => Promise<void>> = {
  async ping(cmd, args, ctx) {
    const target = args.find(a => !a.startsWith('-')) ?? 'localhost';
    const count = (() => {
      const cIdx = args.indexOf('-c');
      return cIdx !== -1 ? parseInt(args[cIdx + 1]) : 4;
    })();
    const n = Math.min(count, 10);

    ctx.output(`PING ${target} (${randomIP()}): 56 data bytes`);

    for (let i = 0; i < n; i++) {
      await new Promise(r => setTimeout(r, 400));
      const ttl = Math.floor(Math.random() * 10) + 54;
      const time = (Math.random() * 30 + 1).toFixed(3);
      ctx.output(`64 bytes from ${target} (${randomIP()}): icmp_seq=${i} ttl=${ttl} time=${time} ms`);
    }

    await new Promise(r => setTimeout(r, 100));
    ctx.output('');
    ctx.output(`--- ${target} ping statistics ---`);
    ctx.output(`${n} packets transmitted, ${n} received, 0% packet loss, time ${n * 400}ms`);
    const times = Array.from({length: n}, () => Math.random() * 30 + 1);
    ctx.output(`rtt min/avg/max/mdev = ${Math.min(...times).toFixed(3)}/${(times.reduce((a,b)=>a+b)/n).toFixed(3)}/${Math.max(...times).toFixed(3)}/0.123 ms`);
  },

  async curl(cmd, args, ctx) {
    const verbose = args.includes('-v') || args.includes('--verbose');
    const method = (() => {
      const mIdx = args.findIndex(a => a === '-X' || a === '--request');
      return mIdx !== -1 ? args[mIdx + 1] : 'GET';
    })();
    const headerIdx = args.findIndex(a => a === '-H' || a === '--header');
    const dataIdx = args.findIndex(a => a === '-d' || a === '--data');
    const url = args.find(a => a.startsWith('http') || a.startsWith('https'));
    const silent = args.includes('-s') || args.includes('--silent');
    const output = args.findIndex(a => a === '-o' || a === '--output');

    if (!url) { ctx.output('curl: no URL specified!', 'error'); return; }

    if (verbose) {
      ctx.output(`*   Trying ${randomIP()}:443...`);
      ctx.output('* Connected to ' + url.replace(/https?:\/\//, '').split('/')[0] + ' port 443');
      ctx.output('* using HTTP/2');
      ctx.output(`> ${method} ${url.split('/').slice(3).join('/') || '/'} HTTP/2`);
      ctx.output('> Accept: */*');
    }

    try {
      if (!silent) ctx.output(`  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current`);
      if (!silent) ctx.output(`                                 Dload  Upload   Total   Spent    Left  Speed`);
      ctx.output('Fetching ' + url + '...', 'info');

      const resp = await fetch(url, {
        method,
        headers: { 'User-Agent': 'curl/8.5.0', 'Accept': '*/*' },
      });

      const text = await resp.text();

      if (verbose) {
        ctx.output(`< HTTP/${resp.status === 200 ? '2 200' : resp.status}`);
        resp.headers.forEach((v: string, k: string) => ctx.output(`< ${k}: ${v}`));
        ctx.output('<');
      }

      if (!silent) ctx.output(`  100  ${text.length}  100  ${text.length}    0     0   1337      0 --:--:-- --:--:-- --:--:--  1337`);

      for (const line of text.split('\n').slice(0, 100)) ctx.output(line);

    } catch (e: any) {
      ctx.output(`curl: (6) Could not resolve host: ${url.split('/')[2]}`, 'error');
    }
  },

  async wget(cmd, args, ctx) {
    const url = args.find(a => a.startsWith('http'));
    const output = (() => {
      const oIdx = args.findIndex(a => a === '-O' || a === '--output-document');
      return oIdx !== -1 ? args[oIdx + 1] : null;
    })();
    const quiet = args.includes('-q') || args.includes('--quiet');

    if (!url) { ctx.output('wget: missing URL', 'error'); return; }

    const filename = output ?? url.split('/').pop() ?? 'index.html';

    if (!quiet) {
      ctx.output(`--${new Date().toISOString()}--  ${url}`);
      ctx.output(`Resolving ${url.split('/')[2]}... ${randomIP()}`);
      ctx.output(`Connecting to ${url.split('/')[2]}|${randomIP()}|:443... connected.`);
      ctx.output('HTTP request sent, awaiting response...');
    }

    try {
      const resp = await fetch(url);
      const text = await resp.text();

      if (!quiet) {
        ctx.output(`${resp.status} ${resp.status === 200 ? 'OK' : 'Error'}`);
        ctx.output(`Length: ${text.length} (${(text.length/1024).toFixed(1)}K) [${resp.headers.get('content-type') ?? 'text/html'}]`);
        ctx.output(`Saving to: '${filename}'`);
        ctx.output('');
        ctx.output(`${filename}           100%[===================>] ${(text.length/1024).toFixed(1)}K  --.-KB/s    in 0.1s`);
        ctx.output('');
        ctx.output(`${new Date().toISOString()} (${(text.length/1024 / 0.1).toFixed(0)} KB/s) - '${filename}' saved [${text.length}/${text.length}]`);
      }

      ctx.fs.writeFile(ctx.fs.resolvePath(filename), text);

    } catch {
      ctx.output(`wget: unable to resolve '${url.split('/')[2]}'`, 'error');
    }
  },

  async ssh(cmd, args, ctx) {
    const installed = ctx.pm.isInstalled('openssh');
    const target = args.find(a => !a.startsWith('-'));
    if (!target) { ctx.output('usage: ssh [-l login] hostname [command]', 'error'); return; }
    ctx.output(`ssh: connect to host ${target} port 22: Connection timed out`, 'warning');
    ctx.output('(SSH connections to external hosts require network access)', 'info');
  },

  async nmap(cmd, args, ctx) {
    const installed = ctx.pm.isInstalled('nmap');
    if (!installed) { ctx.output(`nmap: command not found\nInstall with: apt install nmap`, 'error'); return; }

    const target = args.find(a => !a.startsWith('-')) ?? 'localhost';
    const flags = args.filter(a => a.startsWith('-'));
    const portScan = flags.some(f => f.includes('p') || f === '-sS' || f === '-sV' || f === '-A');
    const osScan = flags.includes('-O') || flags.includes('-A');
    const versionScan = flags.includes('-sV') || flags.includes('-A');
    const aggressive = flags.includes('-A');

    ctx.output('');
    ctx.output(`Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toLocaleString()}`);

    await new Promise(r => setTimeout(r, 500));

    const targetIP = randomIP();
    ctx.output(`Nmap scan report for ${target} (${targetIP})`);
    ctx.output(`Host is up (${(Math.random() * 0.01).toFixed(4)}s latency).`);
    ctx.output('');

    // Generate random open ports
    const openPorts = Object.keys(COMMON_PORTS)
      .map(Number)
      .filter(() => Math.random() > 0.65)
      .slice(0, 8);

    if (openPorts.length === 0) openPorts.push(22, 80);

    ctx.output('PORT      STATE SERVICE' + (versionScan ? '         VERSION' : ''));

    for (const port of openPorts.sort((a, b) => a - b)) {
      await new Promise(r => setTimeout(r, 50));
      const service = COMMON_PORTS[port] ?? 'unknown';
      const version = versionScan ? `\t${getServiceVersion(service)}` : '';
      ctx.output(`${String(port).padEnd(9)} open  ${service.padEnd(15)}${version}`);
    }

    ctx.output('');

    if (osScan) {
      ctx.output('Device type: general purpose');
      ctx.output('Running: Linux 5.X');
      ctx.output('OS CPE: cpe:/o:linux:linux_kernel:5');
      ctx.output('OS details: Linux 5.15 - 5.19');
      ctx.output('');
    }

    if (aggressive) {
      ctx.output('TRACEROUTE');
      ctx.output('HOP RTT     ADDRESS');
      for (let i = 1; i <= 3; i++) {
        ctx.output(`${i}   ${(Math.random() * 20).toFixed(2)} ms ${randomIP()}`);
      }
      ctx.output('');
    }

    ctx.output(`Nmap done: 1 IP address (1 host up) scanned in ${(Math.random() * 5 + 1).toFixed(2)} seconds`);
  },

  async netstat(cmd, args, ctx) {
    const listening = args.includes('-l') || args.includes('--listening');
    const numeric = args.includes('-n') || args.includes('--numeric');
    const all = args.includes('-a') || args.includes('--all');
    const tcp = args.includes('-t') || args.includes('--tcp');
    const udp = args.includes('-u') || args.includes('--udp');

    ctx.output('Active Internet connections' + (listening ? ' (only servers)' : ' (w/o servers)'));
    ctx.output('Proto Recv-Q Send-Q Local Address           Foreign Address         State');

    const connections = [
      { proto: 'tcp', local: '0.0.0.0:22',    foreign: '0.0.0.0:*',           state: 'LISTEN' },
      { proto: 'tcp', local: '0.0.0.0:80',    foreign: '0.0.0.0:*',           state: 'LISTEN' },
      { proto: 'tcp', local: '127.0.0.1:6379',foreign: '0.0.0.0:*',           state: 'LISTEN' },
      { proto: 'tcp', local: '192.168.1.100:22', foreign: '192.168.1.50:43211', state: 'ESTABLISHED' },
      { proto: 'tcp', local: '192.168.1.100:47890', foreign: '1.1.1.1:443',  state: 'TIME_WAIT' },
      { proto: 'udp', local: '0.0.0.0:53',    foreign: '0.0.0.0:*',           state: '' },
    ];

    for (const conn of connections) {
      if (listening && conn.state !== 'LISTEN') continue;
      if (tcp && conn.proto !== 'tcp') continue;
      if (udp && conn.proto !== 'udp') continue;
      ctx.output(`${conn.proto.padEnd(6)} ${String(0).padStart(6)} ${String(0).padStart(6)} ${conn.local.padEnd(24)} ${conn.foreign.padEnd(24)} ${conn.state}`);
    }
  },

  async ifconfig(cmd, args, ctx) {
    ctx.output('eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500');
    ctx.output('        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255');
    ctx.output('        inet6 fe80::1  prefixlen 64  scopeid 0x20<link>');
    ctx.output(`        ether ${randomMac()}  txqueuelen 1000  (Ethernet)`);
    ctx.output('        RX packets 24891  bytes 18432105 (17.5 MiB)');
    ctx.output('        TX packets 12033  bytes 3291840 (3.1 MiB)');
    ctx.output('');
    ctx.output('lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536');
    ctx.output('        inet 127.0.0.1  netmask 255.0.0.0');
    ctx.output('        inet6 ::1  prefixlen 128  scopeid 0x10<host>');
    ctx.output('        loop  txqueuelen 1000  (Local Loopback)');
  },

  async ip(cmd, args, ctx) {
    const sub = args[0];
    if (sub === 'addr' || sub === 'a') {
      ctx.output('1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000');
      ctx.output('    inet 127.0.0.1/8 scope host lo');
      ctx.output('    inet6 ::1/128 scope host');
      ctx.output('2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000');
      ctx.output(`    link/ether ${randomMac()} brd ff:ff:ff:ff:ff:ff`);
      ctx.output('    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0');
      ctx.output('    inet6 fe80::1/64 scope link');
    } else if (sub === 'route' || sub === 'r') {
      ctx.output('default via 192.168.1.1 dev eth0 proto static metric 100');
      ctx.output('192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100');
    } else if (sub === 'link' || sub === 'l') {
      ctx.output('1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN');
      ctx.output('2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP');
    } else {
      ctx.output('Usage: ip [ OPTIONS ] OBJECT { COMMAND | help }');
      ctx.output('OBJECT: { link | addr | route | neigh | tunnel | maddr | mroute | monitor }');
    }
  },

  async whois(cmd, args, ctx) {
    const installed = ctx.pm.isInstalled('whois');
    if (!installed) { ctx.output(`whois: command not found\nInstall with: apt install whois`, 'error'); return; }

    const domain = args.find(a => !a.startsWith('-'));
    if (!domain) { ctx.output('Usage: whois domain', 'error'); return; }

    ctx.output(`Fetching whois data for ${domain}...`, 'info');

    try {
      // Use RDAP API which doesn't have CORS issues
      const resp = await fetch(`https://rdap.org/domain/${domain}`);
      if (!resp.ok) throw new Error('Not found');
      const data = await resp.json() as any;

      ctx.output(`Domain: ${data.ldhName ?? domain.toUpperCase()}`);
      ctx.output(`Status: ${Array.isArray(data.status) ? data.status.join(', ') : 'active'}`);
      if (data.registrant) ctx.output(`Registrant: ${data.registrant.fn ?? 'Redacted'}`);
      if (data.events) {
        const created = data.events.find((e: any) => e.eventAction === 'registration');
        const updated = data.events.find((e: any) => e.eventAction === 'last changed');
        if (created) ctx.output(`Created: ${created.eventDate}`);
        if (updated) ctx.output(`Updated: ${updated.eventDate}`);
      }
    } catch {
      // Fallback to simulated data
      ctx.output(`Domain Name: ${domain.toUpperCase()}`);
      ctx.output(`Registry Domain ID: ${Math.floor(Math.random() * 999999999)}_DOMAIN_COM-VRSN`);
      ctx.output(`Registrar WHOIS Server: whois.example.com`);
      ctx.output(`Registrar: Example Registrar, Inc.`);
      ctx.output(`Updated Date: ${new Date(Date.now() - Math.random() * 31536000000).toISOString()}`);
      ctx.output(`Creation Date: ${new Date(Date.now() - Math.random() * 315360000000).toISOString()}`);
      ctx.output(`Registry Expiry Date: ${new Date(Date.now() + Math.random() * 31536000000).toISOString()}`);
      ctx.output(`Name Server: NS1.${domain.toUpperCase()}`);
      ctx.output(`Name Server: NS2.${domain.toUpperCase()}`);
      ctx.output(`DNSSEC: unsigned`);
    }
  },

  async dig(cmd, args, ctx) {
    const installed = ctx.pm.isInstalled('dnsutils');
    if (!installed) { ctx.output(`dig: command not found\nInstall with: apt install dnsutils`, 'error'); return; }

    const domain = args.find(a => !a.startsWith('-') && !a.startsWith('@'));
    const type = args.find(a => ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA'].includes(a.toUpperCase())) ?? 'A';
    const server = args.find(a => a.startsWith('@'))?.slice(1) ?? '8.8.8.8';

    if (!domain) { ctx.output('Usage: dig [@server] name [type]', 'error'); return; }

    ctx.output('');
    ctx.output(`; <<>> DiG 9.18.19 <<>> ${domain} ${type}`);
    ctx.output(`;; global options: +cmd`);
    ctx.output(`;; Got answer:`);
    ctx.output(`;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: ${Math.floor(Math.random() * 65535)}`);
    ctx.output(`;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1`);
    ctx.output('');
    ctx.output(';; QUESTION SECTION:');
    ctx.output(`;${domain}.\t\t\tIN\t${type}`);
    ctx.output('');
    ctx.output(';; ANSWER SECTION:');

    try {
      const resp = await fetch(`https://dns.google/resolve?name=${domain}&type=${type}`);
      const data = await resp.json() as any;
      if (data.Answer) {
        for (const a of data.Answer) {
          ctx.output(`${domain}.\t\t${a.TTL}\tIN\t${type}\t${a.data}`);
        }
      } else {
        ctx.output(`${domain}.\t\t300\tIN\t${type}\t${randomIP()}`);
      }
    } catch {
      ctx.output(`${domain}.\t\t300\tIN\t${type}\t${randomIP()}`);
    }

    ctx.output('');
    ctx.output(`;; Query time: ${Math.floor(Math.random() * 100)} msec`);
    ctx.output(`;; SERVER: ${server}#53(${server}) (UDP)`);
    ctx.output(`;; WHEN: ${new Date().toString()}`);
    ctx.output(`;; MSG SIZE  rcvd: 64`);
  },

  async nslookup(cmd, args, ctx) {
    const domain = args.find(a => !a.startsWith('-'));
    if (!domain) { ctx.output('Usage: nslookup domain', 'error'); return; }

    ctx.output(`Server:\t\t8.8.8.8`);
    ctx.output(`Address:\t8.8.8.8#53`);
    ctx.output('');
    ctx.output(`Non-authoritative answer:`);
    ctx.output(`Name:\t${domain}`);
    ctx.output(`Address: ${randomIP()}`);
  },

  async traceroute(cmd, args, ctx) {
    const installed = ctx.pm.isInstalled('traceroute');
    if (!installed) { ctx.output(`traceroute: command not found\nInstall with: apt install traceroute`, 'error'); return; }

    const target = args.find(a => !a.startsWith('-')) ?? 'localhost';
    ctx.output(`traceroute to ${target} (${randomIP()}), 30 hops max, 60 byte packets`);

    for (let i = 1; i <= 8; i++) {
      await new Promise(r => setTimeout(r, 200));
      const ip = randomIP();
      const t1 = (Math.random() * 20 + i * 5).toFixed(3);
      const t2 = (Math.random() * 20 + i * 5).toFixed(3);
      const t3 = (Math.random() * 20 + i * 5).toFixed(3);
      ctx.output(` ${String(i).padStart(2)}  ${ip} (${ip})  ${t1} ms  ${t2} ms  ${t3} ms`);
    }
    ctx.output(` 9  * * *`);
    ctx.output(`10  ${target} (${randomIP()})  ${(Math.random() * 50 + 30).toFixed(3)} ms  !`);
  },

  async nc(cmd, args, ctx) {
    const installed = ctx.pm.isInstalled('netcat');
    if (!installed) { ctx.output(`nc: command not found\nInstall with: apt install netcat`, 'error'); return; }
    ctx.output('Ncat: Connection refused. (network access restricted on iOS)', 'warning');
  },

  async tcpdump(cmd, args, ctx) {
    const installed = ctx.pm.isInstalled('tcpdump');
    if (!installed) { ctx.output(`tcpdump: command not found\nInstall with: apt install tcpdump`, 'error'); return; }
    ctx.output(`tcpdump: verbose output suppressed, use -v[v]... for full protocol decode`);
    ctx.output(`listening on eth0, link-type EN10MB (Ethernet), snapshot length 262144 bytes`);
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 300));
      ctx.output(`${new Date().toISOString()} IP ${randomIP()} > ${randomIP()}: Flags [S], seq ${Math.floor(Math.random() * 9999999)}, win 65535`);
    }
    ctx.output('^C');
    ctx.output(`5 packets captured\n5 packets received by filter\n0 packets dropped by kernel`);
  },
};

function getServiceVersion(service: string): string {
  const versions: Record<string, string> = {
    ssh: 'OpenSSH 9.6p1',
    http: 'Apache httpd 2.4.58',
    https: 'nginx 1.25.4',
    ftp: 'vsftpd 3.0.5',
    mysql: 'MySQL 8.0.36',
    postgresql: 'PostgreSQL 16.2',
    redis: 'Redis 7.2.4',
    smtp: 'Postfix smtpd',
    dns: 'ISC BIND 9.18.19',
  };
  return versions[service] ?? 'unknown';
}
