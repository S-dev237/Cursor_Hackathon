import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextInput } from 'react-native';
import { api, ApiError } from '../lib/api';
import { colors, font, radius, spacing } from '../lib/theme';
import type { SourceRAG } from '../lib/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: SourceRAG[];
  error?: boolean;
}

export function ChatPanel({
  contextHint,
  suggestions = [],
  placeholder = 'Posez votre question…',
}: {
  /** Préfixe ajouté à la question (ex. titre du document courant). */
  contextHint?: string;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const send = async (raw?: string) => {
    const question = (raw ?? input).trim();
    if (!question || loading) return;
    setInput('');
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: question,
    };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const prompt = contextHint
        ? `À propos du document « ${contextHint} » : ${question}`
        : question;
      const res = await api.poserQuestion(prompt);
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: res.reponse,
          sources: res.sources,
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          error: true,
          text:
            e instanceof ApiError
              ? e.message
              : "Impossible d'obtenir une réponse pour le moment.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.intro}>
            <View style={styles.introIcon}>
              <Ionicons name="sparkles" size={28} color={colors.primary} />
            </View>
            <Text style={styles.introTitle}>Assistant documentaire</Text>
            <Text style={styles.introSub}>
              Les réponses s’appuient sur le contenu des documents indexés.
            </Text>
            {suggestions.length > 0 ? (
              <View style={styles.suggestions}>
                {suggestions.map((s) => (
                  <Pressable
                    key={s}
                    style={styles.suggestion}
                    onPress={() => send(s)}
                  >
                    <Ionicons
                      name="arrow-forward-circle"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.suggestionText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => <Bubble msg={item} />}
      />

      {loading ? (
        <View style={styles.typing}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.typingText}>L’assistant rédige…</Text>
        </View>
      ) : null}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={() => send()}
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
          onPress={() => send()}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={18} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <View
      style={[
        styles.bubbleRow,
        { justifyContent: isUser ? 'flex-end' : 'flex-start' },
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
          msg.error && styles.errorBubble,
        ]}
      >
        <Text style={[styles.bubbleText, isUser && { color: colors.white }]}>
          {msg.text}
        </Text>
        {msg.sources && msg.sources.length > 0 ? (
          <View style={styles.sources}>
            <Text style={styles.sourcesTitle}>
              {msg.sources.length} source
              {msg.sources.length > 1 ? 's' : ''}
            </Text>
            {msg.sources.slice(0, 3).map((s) => (
              <View key={s.chunk_id} style={styles.sourceItem}>
                <Ionicons name="document-text-outline" size={12} color={colors.primary} />
                <Text style={styles.sourceText} numberOfLines={2}>
                  {s.contenu}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  introIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  introTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  introSub: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    width: '100%',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  suggestionText: {
    flex: 1,
    fontSize: font.size.sm,
    color: colors.text,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
    backgroundColor: colors.dangerSurface,
    borderColor: '#F5C2C2',
  },
  bubbleText: {
    fontSize: font.size.md,
    color: colors.text,
    lineHeight: 22,
  },
  sources: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  sourcesTitle: {
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  sourceItem: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  sourceText: {
    flex: 1,
    fontSize: font.size.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  typingText: {
    fontSize: font.size.sm,
    color: colors.textMuted,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 46,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    fontSize: font.size.md,
    color: colors.text,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
