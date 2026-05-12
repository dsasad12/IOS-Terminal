import { CommandContext } from '../core/CommandProcessor';

export const textCommands: Record<string, (cmd: string, args: string[], ctx: CommandContext) => Promise<void>> = {
  async grep(cmd, args, ctx) {
    const flags = args.filter(a => a.startsWith('-') && a.length > 1);
    const rest = args.filter(a => !a.startsWith('-') || a === '-');
    const ignoreCase = flags.some(f => f.includes('i'));
    const invertMatch = flags.some(f => f.includes('v'));
    const showLineNum = flags.some(f => f.includes('n'));
    const countOnly = flags.some(f => f.includes('c'));
    const recursive = flags.some(f => f.includes('r') || f.includes('R'));

    if (rest.length === 0) { ctx.output('Usage: grep [OPTIONS] PATTERN [FILE...]', 'error'); return; }

    const pattern = rest[0];
    const files = rest.slice(1);

    if (files.length === 0 && !recursive) {
      ctx.output('grep: reading from stdin is not supported in this shell', 'warning');
      return;
    }

    const regexFlags = ignoreCase ? 'gi' : 'g';
    let regex: RegExp;
    try {
      regex = new RegExp(pattern, regexFlags);
    } catch {
      ctx.output(`grep: invalid regular expression: ${pattern}`, 'error');
      return;
    }

    for (const file of files) {
      const resolved = ctx.fs.resolvePath(file);
      const content = ctx.fs.readFile(resolved);
      if (content === null) { ctx.output(`grep: ${file}: No such file or directory`, 'error'); continue; }

      const lines = content.split('\n');
      let count = 0;
      lines.forEach((line, idx) => {
        const matches = regex.test(line);
        const show = invertMatch ? !matches : matches;
        if (show) {
          count++;
          if (!countOnly) {
            const prefix = showLineNum ? `${idx + 1}:` : '';
            const highlighted = matches ? line.replace(regex, m => `\x1b[31m${m}\x1b[0m`) : line;
            ctx.output(`${files.length > 1 ? file + ':' : ''}${prefix}${highlighted}`);
          }
        }
      });
      if (countOnly) ctx.output(`${files.length > 1 ? file + ':' : ''}${count}`);
    }
  },

  async head(cmd, args, ctx) {
    const nIdx = args.indexOf('-n');
    let n = 10;
    const filteredArgs: string[] = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n' && args[i+1]) { n = parseInt(args[i+1]); i++; }
      else if (/^-\d+$/.test(args[i])) { n = parseInt(args[i].slice(1)); }
      else { filteredArgs.push(args[i]); }
    }
    for (const file of filteredArgs) {
      const resolved = ctx.fs.resolvePath(file);
      const content = ctx.fs.readFile(resolved);
      if (content === null) { ctx.output(`head: cannot open '${file}' for reading: No such file or directory`, 'error'); continue; }
      if (filteredArgs.length > 1) ctx.output(`==> ${file} <==`);
      content.split('\n').slice(0, n).forEach(l => ctx.output(l));
    }
  },

  async tail(cmd, args, ctx) {
    let n = 10;
    const filteredArgs: string[] = [];
    let follow = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n' && args[i+1]) { n = parseInt(args[i+1]); i++; }
      else if (/^-\d+$/.test(args[i])) { n = parseInt(args[i].slice(1)); }
      else if (args[i] === '-f' || args[i] === '--follow') { follow = true; }
      else if (!args[i].startsWith('-')) { filteredArgs.push(args[i]); }
    }
    for (const file of filteredArgs) {
      const resolved = ctx.fs.resolvePath(file);
      const content = ctx.fs.readFile(resolved);
      if (content === null) { ctx.output(`tail: cannot open '${file}' for reading: No such file or directory`, 'error'); continue; }
      if (filteredArgs.length > 1) ctx.output(`==> ${file} <==`);
      const lines = content.split('\n');
      lines.slice(-n).forEach(l => ctx.output(l));
      if (follow) ctx.output(`tail: following '${file}'... (press Ctrl+C to stop)`, 'info');
    }
  },

  async wc(cmd, args, ctx) {
    const files = args.filter(a => !a.startsWith('-'));
    const showLines = args.includes('-l') || args.length === files.length + (files.length > 0 ? 0 : 0);
    const showWords = args.includes('-w');
    const showChars = args.includes('-c') || args.includes('-m');
    const showAll = !args.some(a => a.startsWith('-')) || args.includes('-lwc');

    for (const file of (files.length > 0 ? files : [''])) {
      const resolved = file ? ctx.fs.resolvePath(file) : null;
      const content = resolved ? ctx.fs.readFile(resolved) : null;
      if (file && content === null) { ctx.output(`wc: ${file}: No such file or directory`, 'error'); continue; }
      if (!content && !file) { ctx.output('wc: reading from stdin not supported', 'error'); return; }
      const text = content ?? '';
      const lines = text.split('\n').length - 1;
      const words = text.split(/\s+/).filter(Boolean).length;
      const chars = text.length;
      const parts: string[] = [];
      if (showAll || showLines || args.includes('-l')) parts.push(String(lines).padStart(8));
      if (showAll || showWords || args.includes('-w')) parts.push(String(words).padStart(8));
      if (showAll || showChars || args.includes('-c')) parts.push(String(chars).padStart(8));
      ctx.output(`${parts.join('')} ${file}`);
    }
  },

  async sort(cmd, args, ctx) {
    const reverse = args.includes('-r') || args.includes('--reverse');
    const numeric = args.includes('-n') || args.includes('--numeric-sort');
    const unique = args.includes('-u') || args.includes('--unique');
    const files = args.filter(a => !a.startsWith('-'));

    for (const file of files) {
      const resolved = ctx.fs.resolvePath(file);
      const content = ctx.fs.readFile(resolved);
      if (content === null) { ctx.output(`sort: cannot read: ${file}`, 'error'); continue; }
      let lines = content.split('\n').filter(Boolean);
      if (numeric) lines.sort((a, b) => parseFloat(a) - parseFloat(b));
      else lines.sort();
      if (reverse) lines.reverse();
      if (unique) lines = [...new Set(lines)];
      lines.forEach(l => ctx.output(l));
    }
  },

  async uniq(cmd, args, ctx) {
    const count = args.includes('-c');
    const duplicate = args.includes('-d');
    const files = args.filter(a => !a.startsWith('-'));
    for (const file of files) {
      const resolved = ctx.fs.resolvePath(file);
      const content = ctx.fs.readFile(resolved);
      if (content === null) { ctx.output(`uniq: ${file}: No such file or directory`, 'error'); continue; }
      const lines = content.split('\n');
      let prev = '';
      let prevCount = 0;
      for (const line of lines) {
        if (line === prev) { prevCount++; }
        else {
          if (prev !== '') {
            if (!duplicate || prevCount > 1) {
              ctx.output(count ? `${String(prevCount).padStart(7)} ${prev}` : prev);
            }
          }
          prev = line; prevCount = 1;
        }
      }
    }
  },

  async cut(cmd, args, ctx) {
    const fieldIdx = args.indexOf('-f');
    const delimIdx = args.indexOf('-d');
    const byteIdx = args.indexOf('-c');
    const field = fieldIdx !== -1 ? args[fieldIdx + 1] : null;
    const delim = delimIdx !== -1 ? args[delimIdx + 1] : '\t';
    const byteRange = byteIdx !== -1 ? args[byteIdx + 1] : null;
    const files = args.filter((_, i) => !args[i-1]?.startsWith('-') && !args[i].startsWith('-'));

    for (const file of files) {
      const resolved = ctx.fs.resolvePath(file);
      const content = ctx.fs.readFile(resolved);
      if (content === null) { ctx.output(`cut: ${file}: No such file or directory`, 'error'); continue; }
      for (const line of content.split('\n')) {
        if (byteRange) {
          const [start, end] = byteRange.split('-').map(n => parseInt(n) - 1);
          ctx.output(line.slice(start, end !== undefined ? end + 1 : start + 1));
        } else if (field) {
          const cols = line.split(delim);
          const fields = field.split(',').map(f => {
            if (f.includes('-')) {
              const [s, e] = f.split('-').map(n => parseInt(n) - 1);
              return cols.slice(s, e !== undefined ? e + 1 : undefined).join(delim);
            }
            return cols[parseInt(f) - 1] ?? '';
          });
          ctx.output(fields.join(delim));
        }
      }
    }
  },

  async tr(cmd, args, ctx) {
    ctx.output('tr: reading from stdin not supported in non-interactive mode', 'warning');
  },

  async sed(cmd, args, ctx) {
    const expr = args.find(a => a.startsWith('s/') || args.indexOf('-e') !== -1);
    const files = args.filter(a => !a.startsWith('-') && !a.startsWith('s/') && a !== '-e');
    if (!expr && files.length > 0) { ctx.output('sed: expression not found', 'error'); return; }

    for (const file of files) {
      const resolved = ctx.fs.resolvePath(file);
      const content = ctx.fs.readFile(resolved);
      if (content === null) { ctx.output(`sed: ${file}: No such file or directory`, 'error'); continue; }
      // Simple s/pattern/replace/flags parsing
      const match = (expr ?? '').match(/^s\/(.+?)\/(.*)\/([gim]*)$/);
      if (match) {
        const [, pat, rep, flags] = match;
        try {
          const regex = new RegExp(pat, flags || 'g');
          const result = content.replace(regex, rep);
          for (const line of result.split('\n')) ctx.output(line);
        } catch {
          ctx.output(`sed: invalid regex: ${pat}`, 'error');
        }
      } else {
        for (const line of content.split('\n')) ctx.output(line);
      }
    }
  },

  async awk(cmd, args, ctx) {
    const progIdx = args.indexOf('-F') !== -1 ? args.indexOf('-F') + 2 : 0;
    const program = args.find(a => a.includes('{')) ?? args[progIdx];
    const files = args.filter(a => !a.startsWith('-') && !a.includes('{'));

    if (!program) { ctx.output('awk: no program specified', 'error'); return; }

    for (const file of files) {
      const resolved = ctx.fs.resolvePath(file);
      const content = ctx.fs.readFile(resolved);
      if (content === null) { ctx.output(`awk: ${file}: No such file or directory`, 'error'); continue; }

      const printMatch = program.match(/\{print\s+(.+)\}/);
      if (printMatch) {
        const printExpr = printMatch[1];
        const fieldSep = args.includes('-F') ? args[args.indexOf('-F') + 1] : /\s+/;
        for (const line of content.split('\n')) {
          if (!line) continue;
          const fields = line.split(fieldSep);
          const result = printExpr
            .replace(/\$(\d+)/g, (_, n) => fields[parseInt(n) - 1] ?? '')
            .replace(/\$0/g, line)
            .replace(/NF/g, String(fields.length))
            .replace(/NR/g, '1');
          ctx.output(result.replace(/"/g, ''));
        }
      }
    }
  },

  async less(cmd, args, ctx) {
    const files = args.filter(a => !a.startsWith('-'));
    for (const file of files) {
      await textCommands.cat(cmd, [file], ctx);
    }
  },

  async more(cmd, args, ctx) {
    await textCommands.less(cmd, args, ctx);
  },

  async diff(cmd, args, ctx) {
    const files = args.filter(a => !a.startsWith('-'));
    if (files.length < 2) { ctx.output('diff: missing operand', 'error'); return; }
    const a = ctx.fs.readFile(ctx.fs.resolvePath(files[0]));
    const b = ctx.fs.readFile(ctx.fs.resolvePath(files[1]));
    if (a === null) { ctx.output(`diff: ${files[0]}: No such file`, 'error'); return; }
    if (b === null) { ctx.output(`diff: ${files[1]}: No such file`, 'error'); return; }
    if (a === b) { ctx.output('Files are identical'); return; }
    ctx.output(`--- ${files[0]}`);
    ctx.output(`+++ ${files[1]}`);
    ctx.output('@@ -1 +1 @@');
    a.split('\n').forEach(l => ctx.output(`-${l}`, 'error'));
    b.split('\n').forEach(l => ctx.output(`+${l}`, 'success'));
  },

  async base64(cmd, args, ctx) {
    const decode = args.includes('-d') || args.includes('--decode');
    const text = args.filter(a => !a.startsWith('-'))[0];
    if (!text) { ctx.output('base64: no input provided', 'error'); return; }
    if (decode) {
      try { ctx.output(atob(text)); } catch { ctx.output('base64: invalid input', 'error'); }
    } else {
      ctx.output(btoa(text));
    }
  },

  async md5sum(cmd, args, ctx) {
    // Simulated md5 (not cryptographically real)
    for (const file of args.filter(a => !a.startsWith('-'))) {
      const content = ctx.fs.readFile(ctx.fs.resolvePath(file));
      if (!content) { ctx.output(`md5sum: ${file}: No such file or directory`, 'error'); continue; }
      // Generate deterministic-looking hash
      let hash = 0;
      for (let i = 0; i < content.length; i++) hash = (hash * 31 + content.charCodeAt(i)) >>> 0;
      ctx.output(`${hash.toString(16).padStart(32, '0')}  ${file}`);
    }
  },

  async sha256sum(cmd, args, ctx) {
    for (const file of args.filter(a => !a.startsWith('-'))) {
      const content = ctx.fs.readFile(ctx.fs.resolvePath(file));
      if (!content) { ctx.output(`sha256sum: ${file}: No such file or directory`, 'error'); continue; }
      let hash = 0;
      for (let i = 0; i < content.length; i++) hash = (hash * 31 + content.charCodeAt(i)) >>> 0;
      const fakeHash = hash.toString(16).padStart(64, 'a');
      ctx.output(`${fakeHash}  ${file}`);
    }
  },

  async xxd(cmd, args, ctx) {
    const file = args.find(a => !a.startsWith('-'));
    if (!file) { ctx.output('xxd: no file specified', 'error'); return; }
    const content = ctx.fs.readFile(ctx.fs.resolvePath(file));
    if (content === null) { ctx.output(`xxd: ${file}: No such file`, 'error'); return; }
    const bytes = content.slice(0, 256);
    for (let i = 0; i < bytes.length; i += 16) {
      const chunk = bytes.slice(i, i + 16);
      const hex = [...chunk].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
      const ascii = [...chunk].map(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127 ? c : '.').join('');
      ctx.output(`${i.toString(16).padStart(8, '0')}: ${hex.padEnd(48)}  ${ascii}`);
    }
  },

  async strings(cmd, args, ctx) {
    const file = args.find(a => !a.startsWith('-'));
    if (!file) { ctx.output('strings: no file specified', 'error'); return; }
    const content = ctx.fs.readFile(ctx.fs.resolvePath(file));
    if (content === null) { ctx.output(`strings: ${file}: No such file`, 'error'); return; }
    const strs = content.match(/[\x20-\x7E]{4,}/g) ?? [];
    strs.forEach(s => ctx.output(s));
  },

  async nano(cmd, args, ctx) {
    ctx.output('nano: interactive editor not available in HackTerm web shell.', 'warning');
    ctx.output('Use: echo "content" > file.txt  to write files', 'info');
    ctx.output('     cat file.txt                to read files', 'info');
  },

  async vi(cmd, args, ctx) {
    ctx.output('vi: interactive editor not available in HackTerm web shell.', 'warning');
    ctx.output('Use: echo "content" > file.txt  to write files', 'info');
  },

  async vim(cmd, args, ctx) {
    const installed = ctx.pm.isInstalled('vim');
    if (!installed) { ctx.output(`vim: command not found. Install with: apt install vim`, 'error'); return; }
    await textCommands.vi(cmd, args, ctx);
  },
};
