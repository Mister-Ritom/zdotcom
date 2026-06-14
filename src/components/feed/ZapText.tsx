import React, { useMemo } from 'react';
import { Text } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  text: string;
  onMentionPress?: (username: string) => void;
  onHashtagPress?: (tag: string) => void;
  style?: object;
}

const LINK_RE = /(@[\w_]+|#[\w_]+)/g;

export function ZapText({ text, onMentionPress, onHashtagPress, style }: Props) {
  const isDark = useColorScheme() === 'dark';
  const baseColor = isDark ? '#D4D4D8' : '#3F3F46';
  const mentionColor = isDark ? '#60A5FA' : '#2563EB';
  const hashtagColor = isDark ? '#9CA3AF' : '#6B7280';

  const parts = useMemo(() => {
    const result: Array<{ text: string; type: 'plain' | 'mention' | 'hashtag' }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    LINK_RE.lastIndex = 0;
    while ((match = LINK_RE.exec(text)) !== null) {
      if (match.index > lastIndex) result.push({ text: text.slice(lastIndex, match.index), type: 'plain' });
      result.push({ text: match[0], type: match[0].startsWith('@') ? 'mention' : 'hashtag' });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) result.push({ text: text.slice(lastIndex), type: 'plain' });
    return result;
  }, [text]);

  return (
    <Text style={[{ fontSize: 15, lineHeight: 22, color: baseColor }, style]}>
      {parts.map((p, i) => {
        if (p.type === 'plain') return <Text key={i}>{p.text}</Text>;
        const color = p.type === 'mention' ? mentionColor : hashtagColor;
        const weight = p.type === 'mention' ? '700' : '600';
        return (
          <Text
            key={i}
            style={{ color, fontWeight: weight }}
            onPress={() => {
              if (p.type === 'mention') onMentionPress?.(p.text.slice(1));
              else onHashtagPress?.(p.text.slice(1));
            }}
          >
            {p.text}
          </Text>
        );
      })}
    </Text>
  );
}
