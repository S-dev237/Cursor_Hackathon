import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChatPanel } from '../../components/ChatPanel';
import { colors, font, radius, spacing } from '../../lib/theme';

export default function Assistant() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.iconBox}>
          <Ionicons name="sparkles" size={20} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Assistant IA</Text>
          <Text style={styles.subtitle}>
            Interrogez l’ensemble des documents accessibles
          </Text>
        </View>
      </View>

      <ChatPanel
        suggestions={[
          'Explique-moi le routage OSPF selon les cours.',
          'Quels documents parlent de machine learning ?',
          'Résume les mémoires sur les réseaux.',
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: font.size.sm,
    color: colors.textMuted,
  },
});
