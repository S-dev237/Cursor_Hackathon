import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, shadow, spacing } from '../lib/theme';
import {
  ACCES_LABELS,
  TYPE_ICONS,
  TYPE_LABELS,
  accesColor,
} from '../lib/format';
import { Badge } from './ui';
import type { Ressource } from '../lib/types';

export function DocumentCard({
  ressource,
  onPress,
  onLongPress,
  owned,
}: {
  ressource: Ressource;
  onPress?: () => void;
  onLongPress?: () => void;
  owned?: boolean;
}) {
  const icon = (TYPE_ICONS[ressource.type_document] ??
    'document') as keyof typeof Ionicons.glyphMap;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={styles.titre} numberOfLines={2}>
          {ressource.titre}
        </Text>
        <View style={styles.metaRow}>
          <Badge label={TYPE_LABELS[ressource.type_document] ?? ressource.type_document} />
          <Badge
            label={ACCES_LABELS[ressource.niveau_acces] ?? ressource.niveau_acces}
            color={accesColor(ressource.niveau_acces)}
            icon={
              ressource.niveau_acces === 'PRIVE' ? 'lock-closed' : 'globe-outline'
            }
          />
          {ressource.annee ? (
            <Text style={styles.annee}>{ressource.annee}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.trailing}>
        {owned ? (
          <View style={styles.ownerDot}>
            <Ionicons name="person" size={10} color={colors.primaryDark} />
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.card,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titre: {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.text,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  annee: {
    fontSize: font.size.xs,
    color: colors.textFaint,
    fontWeight: font.weight.medium,
  },
  trailing: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  ownerDot: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
