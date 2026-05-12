# HackTerm — iOS Linux Terminal

A Termux-like Linux terminal for iOS built with React Native + Expo.  
Dark hacking aesthetic with full command emulation, virtual filesystem, and package manager.

## Features

### Terminal Core
- Virtual Linux filesystem (`/home/root`, `/etc`, `/var`, `/proc`, `/usr`, `/tmp`, etc.)
- Bash-like shell with history (↑/↓), tab completion, aliases, environment variables
- Command chaining: `&&`, `||`, `;`
- Output redirection: `>`, `>>`
- ANSI color output
- Quick-key toolbar for mobile: Tab, Ctrl+C, Ctrl+L, pipes, arrows

### Filesystem Commands
`ls`, `ll`, `la`, `cd`, `pwd`, `mkdir`, `rmdir`, `rm`, `cp`, `mv`, `cat`, `touch`,  
`echo`, `find`, `which`, `chmod`, `chown`, `tree`, `ln`, `stat`, `du`, `df`

### System Commands
`ps`, `top`, `htop`, `kill`, `uname`, `whoami`, `id`, `hostname`, `date`, `uptime`,  
`env`, `export`, `unset`, `history`, `alias`, `clear`, `man`, `help`, `sudo`,  
`sleep`, `time`, `seq`, `expr`, `jobs`, `bg`, `fg`, `bash`, `sh`, `exit`

### Text Processing
`grep`, `head`, `tail`, `wc`, `sort`, `uniq`, `cut`, `tr`, `sed`, `awk`,  
`less`, `more`, `diff`, `base64`, `md5sum`, `sha256sum`, `xxd`, `strings`,  
`nano` (info), `vim` (info)

### Network Commands
`ping`, `curl`, `wget`, `ssh`, `nmap`, `netstat`, `ifconfig`, `ip`,  
`whois`, `dig`, `nslookup`, `traceroute`, `nc`, `tcpdump`, `ss`, `route`

> `curl` and `wget` make real HTTP requests. `whois` and `dig` use real DNS APIs.

### Package Manager (apt / pkg)
```bash
apt update
apt upgrade
apt install nmap
apt remove nmap
apt search hacking
apt list --installed
apt show sqlmap

pkg install python
pkg list-all
```

80+ packages available including:
- **Security**: nmap, hydra, sqlmap, nikto, gobuster, hashcat, john, aircrack-ng, metasploit-framework, theharvester, wifite, burpsuite, beef-xss
- **Network**: curl, wget, openssh, tor, proxychains-ng, socat, wireshark, tcpdump, masscan
- **Development**: python, nodejs, ruby, go, rust, java, php, gcc, git, vim, neovim
- **Utilities**: htop, tmux, jq, tree, fzf, bat, ripgrep, zip, tar

### Hacking Tools (install required)
```bash
apt install nmap && nmap -A 192.168.1.1
apt install sqlmap && sqlmap -u "http://target.com?id=1"
apt install nikto && nikto -h target.com
apt install gobuster && gobuster dir -u http://target.com -w wordlist.txt
apt install hydra && hydra -l admin -P pass.txt ssh://target
apt install theharvester && theharvester -d target.com -b all
apt install metasploit-framework && msfconsole
apt install tor && tor
apt install gpg && gpg --gen-key
apt install openssl && openssl genrsa 2048
```

## Getting Started

```bash
# Install dependencies
npm install

# Run on iOS simulator
npm run ios

# Run on Android
npm run android

# Run in browser (web)
npm run web

# Build for iOS (requires EAS account)
npm run build:ios
```

## Project Structure

```
src/
├── core/
│   ├── CommandProcessor.ts   # Shell engine (parsing, piping, execution)
│   ├── FileSystem.ts         # Virtual Linux filesystem
│   ├── Environment.ts        # Env vars, aliases, history
│   └── PackageManager.ts     # apt/pkg simulation (80+ packages)
├── commands/
│   ├── filesystem.ts         # ls, cd, cat, rm, cp, mv, find...
│   ├── system.ts             # ps, top, uname, env, history...
│   ├── text.ts               # grep, sed, awk, head, tail...
│   ├── network.ts            # ping, curl, nmap, whois, dig...
│   ├── package.ts            # apt, pkg, dpkg, pip, npm...
│   ├── hacking.ts            # nmap, hydra, sqlmap, nikto...
│   └── index.ts              # Command registry
├── components/
│   ├── Terminal.tsx          # Main terminal component
│   ├── TerminalOutput.tsx    # ANSI-aware output renderer
│   ├── TerminalInput.tsx     # Input + quick-key toolbar
│   └── StatusBar.tsx         # Status bar with time/user/path
└── theme/
    └── colors.ts             # Hacking theme colors
```

## Theme

| Color | Hex | Use |
|-------|-----|-----|
| Background | `#0a0a0a` | Terminal background |
| Primary | `#00ff41` | Green matrix text, prompts |
| Prompt user | `#00ffff` | user@host |
| Prompt path | `#ff8800` | current directory |
| Error | `#ff3333` | Error messages |
| Warning | `#ffcc00` | Warnings |
| Info | `#00ccff` | Informational |

## iOS Notes

iOS restricts background process execution and raw socket access. The following are simulated:
- Package installation (tracks state in memory, simulates download/install output)
- Network scanning (nmap, masscan — simulated results)
- Monitor mode tools (wifite, aircrack-ng — hardware unavailable on iOS)
- Interactive TUI apps (htop, vim, tmux — show output only)

Real network operations supported via iOS networking stack:
- `curl` / `wget` — full HTTP/HTTPS requests
- `whois` — RDAP API lookup
- `dig` — Google DNS API
- `ping` — simulated with timing
