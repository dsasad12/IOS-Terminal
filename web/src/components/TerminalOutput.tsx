import React, { useEffect, useRef } from 'react';
import { OutputLine } from '../core/CommandProcessor';

interface Props {
  lines: OutputLine[];
}

type AnsiPart = { text: string; classes: string[] };

function parseAnsi(text: string): AnsiPart[] {
  const parts: AnsiPart[] = [];
  const ansiRe = /\x1b\[([0-9;]*)m/g;
  let last = 0;
  let classes: string[] = [];

  let m: RegExpExecArray | null;
  while ((m = ansiRe.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), classes: [...classes] });
    const codes = m[1].split(';').filter(Boolean);
    if (codes.length === 0 || codes[0] === '0') { classes = []; }
    else {
      for (const c of codes) {
        if (c === '1') { if (!classes.includes('ansi-1')) classes = [...classes, 'ansi-1']; }
        else classes = [`ansi-${c}`];
      }
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), classes: [...classes] });
  if (parts.length === 0) parts.push({ text, classes: [] });
  return parts;
}

const lineClass: Record<string, string> = {
  normal: 'line-normal',
  error: 'line-error',
  success: 'line-success',
  warning: 'line-warning',
  info: 'line-info',
  system: 'line-system',
  prompt: 'line-prompt',
};

const OutputLineEl = React.memo(({ line }: { line: OutputLine }) => {
  if (line.text === '\x1b[2J\x1b[H') return null;
  const base = lineClass[line.type] ?? 'line-normal';
  const parts = parseAnsi(line.text);
  return (
    <div className={`output-line ${base}`}>
      {parts.map((p, i) =>
        p.classes.length > 0
          ? <span key={i} className={p.classes.join(' ')}>{p.text}</span>
          : <React.Fragment key={i}>{p.text}</React.Fragment>
      )}
    </div>
  );
});

export const TerminalOutput: React.FC<Props> = ({ lines }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [lines.length]);

  // Find last clear
  let startIdx = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].text === '\x1b[2J\x1b[H') { startIdx = i + 1; break; }
  }

  return (
    <div className="output-area" ref={ref}>
      {lines.slice(startIdx).map(line => (
        <OutputLineEl key={line.id} line={line} />
      ))}
    </div>
  );
};
