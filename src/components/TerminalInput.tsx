import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import { Colors, FontFamily, FontSizes } from '../theme/colors';

interface Props {
  prompt: string;
  onSubmit: (cmd: string) => void;
  onHistoryPrev: () => string | null;
  onHistoryNext: () => string | null;
  onTab: (partial: string) => string[];
  disabled?: boolean;
}

const QUICK_KEYS = ['Tab', 'Ctrl+C', 'Ctrl+L', '↑', '↓', '|', '>', '/', '-', '~'];

export const TerminalInput: React.FC<Props> = ({
  prompt,
  onSubmit,
  onHistoryPrev,
  onHistoryNext,
  onTab,
  disabled = false,
}) => {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!disabled) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [disabled]);

  const handleSubmit = () => {
    const cmd = value.trim();
    setValue('');
    setSuggestions([]);
    onSubmit(cmd);
  };

  const handleQuickKey = (key: string) => {
    switch (key) {
      case '↑': {
        const prev = onHistoryPrev();
        if (prev !== null) setValue(prev);
        break;
      }
      case '↓': {
        const next = onHistoryNext();
        if (next !== null) setValue(next);
        break;
      }
      case 'Ctrl+C':
        setValue('');
        setSuggestions([]);
        onSubmit(''); // Signal interrupt
        break;
      case 'Ctrl+L':
        onSubmit('clear');
        break;
      case 'Tab': {
        const parts = value.split(' ');
        const partial = parts[parts.length - 1];
        const matches = onTab(partial);
        if (matches.length === 1) {
          setValue(value.slice(0, value.lastIndexOf(partial)) + matches[0]);
          setSuggestions([]);
        } else if (matches.length > 1) {
          setSuggestions(matches);
        }
        break;
      }
      default:
        setValue(prev => prev + key);
        break;
    }
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      {suggestions.length > 0 && (
        <ScrollView
          horizontal
          style={styles.suggestions}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {suggestions.map(s => (
            <TouchableOpacity
              key={s}
              style={styles.suggestion}
              onPress={() => {
                const parts = value.split(' ');
                parts[parts.length - 1] = s;
                setValue(parts.join(' ') + ' ');
                setSuggestions([]);
                inputRef.current?.focus();
              }}
            >
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Quick key toolbar */}
      <ScrollView
        horizontal
        style={styles.quickKeys}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {QUICK_KEYS.map(key => (
          <TouchableOpacity
            key={key}
            style={styles.quickKey}
            onPress={() => handleQuickKey(key)}
            activeOpacity={0.6}
          >
            <Text style={styles.quickKeyText}>{key}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input row */}
      <View style={styles.inputRow}>
        <Text style={styles.prompt} numberOfLines={1}>
          {prompt}
        </Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={text => {
            setValue(text);
            if (suggestions.length > 0) setSuggestions([]);
          }}
          onSubmitEditing={handleSubmit}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          keyboardType="ascii-capable"
          keyboardAppearance="dark"
          returnKeyType="go"
          returnKeyLabel="Run"
          editable={!disabled}
          blurOnSubmit={false}
          caretHidden={false}
          multiline={false}
          placeholderTextColor={Colors.textDim}
          selectionColor={Colors.hackGreen}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  suggestions: {
    backgroundColor: Colors.surface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    maxHeight: 36,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  suggestion: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  quickKeys: {
    backgroundColor: Colors.backgroundTertiary,
    paddingVertical: 6,
    paddingHorizontal: 8,
    maxHeight: 40,
  },
  quickKey: {
    backgroundColor: Colors.surface,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 36,
    alignItems: 'center',
  },
  quickKeyText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSizes.xs,
    color: Colors.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  prompt: {
    fontFamily: FontFamily.mono,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: FontSizes.md,
    color: Colors.textWhite,
    padding: 0,
    margin: 0,
    marginLeft: 2,
    minHeight: 28,
  },
});
