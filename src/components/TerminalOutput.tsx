import React, { useRef, useEffect, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { OutputLine, OutputType } from '../core/CommandProcessor';
import { Colors, FontFamily, FontSizes } from '../theme/colors';

interface Props {
  lines: OutputLine[];
  onScrollEnd?: () => void;
}

const getTextColor = (type: OutputType): string => {
  switch (type) {
    case 'error':   return Colors.error;
    case 'success': return Colors.success;
    case 'warning': return Colors.warning;
    case 'info':    return Colors.info;
    case 'system':  return Colors.textMuted;
    case 'prompt':  return Colors.textPrimary;
    default:        return Colors.textWhite;
  }
};

function processAnsiText(text: string): Array<{ text: string; color?: string; bold?: boolean }> {
  const parts: Array<{ text: string; color?: string; bold?: boolean }> = [];
  const ansiRegex = /\x1b\[([0-9;]*)m/g;
  let lastIndex = 0;
  let currentColor: string | undefined;
  let currentBold = false;

  const ansiColors: Record<string, string | undefined> = {
    '30': '#333333', '31': Colors.error, '32': Colors.textPrimary,
    '33': Colors.warning, '34': Colors.info, '35': Colors.hackPurple,
    '36': Colors.promptUser, '37': Colors.textWhite,
    '90': '#555555', '91': '#ff6666', '92': '#66ff66',
    '93': '#ffff66', '94': '#6666ff', '95': '#ff66ff',
    '96': '#66ffff', '97': '#ffffff',
    '1': undefined,
  };

  let match: RegExpExecArray | null;
  while ((match = ansiRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), color: currentColor, bold: currentBold });
    }
    const codes = match[1].split(';');
    for (const code of codes) {
      if (code === '0' || code === '') { currentColor = undefined; currentBold = false; }
      else if (code === '1') { currentBold = true; }
      else if (ansiColors[code] !== undefined) { currentColor = ansiColors[code]; }
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), color: currentColor, bold: currentBold });
  }

  if (parts.length === 0) {
    parts.push({ text });
  }

  return parts;
}

const TerminalLine = React.memo(({ line }: { line: OutputLine }) => {
  if (line.text === '\x1b[2J\x1b[H') return null;

  const baseColor = getTextColor(line.type);
  const parts = processAnsiText(line.text);

  return (
    <Text style={styles.lineText} selectable>
      {parts.map((part, i) => (
        <Text
          key={i}
          style={[
            styles.lineText,
            { color: part.color ?? baseColor },
            part.bold && styles.bold,
          ]}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
});

export const TerminalOutput: React.FC<Props> = ({ lines, onScrollEnd }) => {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 30);
    return () => clearTimeout(timer);
  }, [lines.length]);

  const clearIndex = (() => {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].text === '\x1b[2J\x1b[H') return i + 1;
    }
    return 0;
  })();

  const visibleLines = lines.slice(clearIndex);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      removeClippedSubviews={true}
      onMomentumScrollEnd={onScrollEnd}
    >
      {visibleLines.map(line => (
        <TerminalLine key={line.id} line={line} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    paddingHorizontal: 12,
  },
  content: {
    paddingBottom: 8,
    paddingTop: 4,
  },
  lineText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSizes.md,
    lineHeight: 20,
    color: Colors.textWhite,
  },
  bold: {
    fontWeight: 'bold',
  },
});
