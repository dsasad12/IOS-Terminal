import React, { useRef, useState, useCallback, useEffect } from 'react';

const QUICK_KEYS = [
  { label: '↑', value: '__UP__' },
  { label: '↓', value: '__DOWN__' },
  { label: 'Tab', value: '__TAB__' },
  { label: 'Ctrl+C', value: '__CTRLC__' },
  { label: 'Ctrl+L', value: '__CTRLL__' },
  { label: '|', value: '|' },
  { label: '>', value: '>' },
  { label: '>>', value: '>>' },
  { label: '/', value: '/' },
  { label: '-', value: '-' },
  { label: '--', value: '--' },
  { label: '~', value: '~' },
  { label: './', value: './' },
  { label: '../', value: '../' },
  { label: '*', value: '*' },
  { label: '"', value: '"' },
  { label: "'", value: "'" },
  { label: '&&', value: ' && ' },
  { label: ';', value: '; ' },
];

interface Props {
  prompt: string;
  suggestions: string[];
  onSubmit: (cmd: string) => void;
  onHistoryPrev: () => string | null;
  onHistoryNext: () => string | null;
  onTab: (partial: string) => string[];
  onSuggestionSelect: (s: string, current: string) => string;
  onSuggestionsChange: (s: string[]) => void;
  disabled?: boolean;
}

export const TerminalInput: React.FC<Props> = ({
  prompt,
  suggestions,
  onSubmit,
  onHistoryPrev,
  onHistoryNext,
  onTab,
  onSuggestionSelect,
  onSuggestionsChange,
  disabled = false,
}) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount and after execution
  useEffect(() => {
    if (!disabled) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [disabled]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const cmd = value.trim();
    setValue('');
    onSuggestionsChange([]);
    onSubmit(cmd);
    // Refocus after submit on iOS
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [value, onSubmit, onSuggestionsChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = value.split(' ');
      const partial = parts[parts.length - 1];
      const matches = onTab(partial);
      if (matches.length === 1) {
        setValue(value.slice(0, value.lastIndexOf(partial === '' ? '' : partial)) + matches[0] + ' ');
        onSuggestionsChange([]);
      } else if (matches.length > 1) {
        onSuggestionsChange(matches.slice(0, 10));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = onHistoryPrev();
      if (prev !== null) setValue(prev);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = onHistoryNext();
      if (next !== null) setValue(next);
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      setValue('');
      onSuggestionsChange([]);
      onSubmit('__INTERRUPT__');
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setValue('');
      onSubmit('clear');
    }
  }, [value, handleSubmit, onHistoryPrev, onHistoryNext, onTab, onSuggestionsChange, onSubmit]);

  const handleQuickKey = useCallback((key: string) => {
    if (key === '__UP__') {
      const prev = onHistoryPrev();
      if (prev !== null) setValue(prev);
    } else if (key === '__DOWN__') {
      const next = onHistoryNext();
      if (next !== null) setValue(next);
    } else if (key === '__TAB__') {
      const parts = value.split(' ');
      const partial = parts[parts.length - 1];
      const matches = onTab(partial);
      if (matches.length === 1) {
        setValue(value.slice(0, value.length - partial.length) + matches[0] + ' ');
        onSuggestionsChange([]);
      } else if (matches.length > 1) {
        onSuggestionsChange(matches.slice(0, 10));
      }
    } else if (key === '__CTRLC__') {
      setValue('');
      onSuggestionsChange([]);
      onSubmit('__INTERRUPT__');
    } else if (key === '__CTRLL__') {
      setValue('');
      onSubmit('clear');
    } else {
      setValue(prev => prev + key);
    }
    setTimeout(() => {
      inputRef.current?.focus();
      const len = inputRef.current?.value.length ?? 0;
      inputRef.current?.setSelectionRange(len, len);
    }, 50);
  }, [value, onHistoryPrev, onHistoryNext, onTab, onSuggestionsChange, onSubmit]);

  const focusInput = () => inputRef.current?.focus();

  return (
    <div className="input-section">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="suggestions-bar">
          {suggestions.map(s => (
            <button
              key={s}
              className="suggestion-item"
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                const next = onSuggestionSelect(s, value);
                setValue(next);
                onSuggestionsChange([]);
                setTimeout(() => {
                  inputRef.current?.focus();
                  const len = next.length;
                  inputRef.current?.setSelectionRange(len, len);
                }, 50);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Quick keys */}
      <div className="quickkeys-bar">
        {QUICK_KEYS.map(k => (
          <button
            key={k.label}
            className="qk-btn"
            onMouseDown={e => e.preventDefault()}
            onClick={() => handleQuickKey(k.value)}
          >
            {k.label}
          </button>
        ))}
      </div>

      {/* Prompt + input */}
      <form className="prompt-row" onSubmit={handleSubmit} onClick={focusInput}>
        <span className="prompt-text">{prompt}</span>
        <input
          ref={inputRef}
          className="cmd-input"
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          enterKeyHint="go"
          inputMode="text"
        />
      </form>
    </div>
  );
};
