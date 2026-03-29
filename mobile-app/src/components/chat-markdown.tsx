import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ChatMarkdownProps = {
  content: string;
};

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string };

const INLINE_PATTERN = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;

function parseInline(content: string): InlineToken[] {
  const parts = content.split(INLINE_PATTERN).filter(Boolean);

  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return { type: 'bold', value: part.slice(2, -2) };
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return { type: 'italic', value: part.slice(1, -1) };
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return { type: 'code', value: part.slice(1, -1) };
    }

    return { type: 'text', value: part };
  });
}

function renderInline(content: string) {
  return parseInline(content).map((token, index) => {
    if (token.type === 'bold') {
      return (
        <ThemedText key={`inline-${index}`} style={styles.bold}>
          {token.value}
        </ThemedText>
      );
    }

    if (token.type === 'italic') {
      return (
        <ThemedText key={`inline-${index}`} style={styles.italic}>
          {token.value}
        </ThemedText>
      );
    }

    if (token.type === 'code') {
      return (
        <ThemedText key={`inline-${index}`} type="code" style={styles.code}>
          {token.value}
        </ThemedText>
      );
    }

    return <ThemedText key={`inline-${index}`}>{token.value}</ThemedText>;
  });
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  const blocks = content.split('\n');

  return (
    <View style={styles.container}>
      {blocks.map((rawLine, index) => {
        const line = rawLine.trimEnd();

        if (!line.trim()) {
          return <View key={`spacer-${index}`} style={styles.spacer} />;
        }

        const bulletMatch = line.match(/^[-*]\s+(.*)$/);

        if (bulletMatch) {
          return (
            <View key={`bullet-${index}`} style={styles.bulletRow}>
              <ThemedText style={styles.bulletMark}>{'\u2022'}</ThemedText>
              <View style={styles.bulletContent}>
                <ThemedText>{renderInline(bulletMatch[1])}</ThemedText>
              </View>
            </View>
          );
        }

        return (
          <ThemedText key={`paragraph-${index}`} style={styles.paragraph}>
            {renderInline(line)}
          </ThemedText>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  paragraph: {
    lineHeight: 22,
  },
  spacer: {
    height: Spacing.one,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  bulletMark: {
    lineHeight: 22,
  },
  bulletContent: {
    flex: 1,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  code: {
    fontSize: 13,
  },
});
