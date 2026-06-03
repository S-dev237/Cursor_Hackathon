import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { Button, Card } from '../../components/ui';
import { colors, font, radius, spacing } from '../../lib/theme';
import { initiales } from '../../lib/format';
import { API_URL } from '../../lib/config';

const ROLE_LABELS: Record<string, string> = {
  ETUDIANT: 'Étudiant',
  ENSEIGNANT: 'Enseignant',
  ADMIN: 'Administrateur',
};

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [mineCount, setMineCount] = useState<number | null>(null);

  useEffect(() => {
    api
      .listerRessources({ mine: true })
      .then((d) => setMineCount(d.length))
      .catch(() => setMineCount(null));
  }, []);

  const logout = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!user) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        padding: spacing.lg,
        gap: spacing.lg,
      }}
    >
      <Text style={styles.title}>Profil</Text>

      <Card style={{ alignItems: 'center', gap: spacing.sm }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initiales(user)}</Text>
        </View>
        <Text style={styles.name}>
          {user.prenom || user.nom
            ? `${user.prenom ?? ''} ${user.nom ?? ''}`.trim()
            : user.email}
        </Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="ribbon" size={13} color={colors.primaryDark} />
          <Text style={styles.roleText}>
            {ROLE_LABELS[user.type] ?? user.type}
          </Text>
        </View>
      </Card>

      <View style={styles.statsRow}>
        <StatCard
          icon="folder"
          value={mineCount === null ? '—' : String(mineCount)}
          label="Mes documents"
        />
        <StatCard
          icon="shield-checkmark"
          value={user.actif ? 'Actif' : 'Inactif'}
          label="Statut du compte"
        />
      </View>

      <Card style={{ gap: spacing.md }}>
        <Row icon="cloud-upload-outline" label="Importer un document" onPress={() => router.push('/upload')} />
        <Divider />
        <Row icon="folder-open-outline" label="Mes documents" onPress={() => router.push({ pathname: '/(tabs)/documents', params: { mine: '1' } })} />
        <Divider />
        <Row icon="sparkles-outline" label="Assistant IA" onPress={() => router.push('/(tabs)/assistant')} />
      </Card>

      <View style={styles.serverInfo}>
        <Ionicons name="server-outline" size={14} color={colors.textFaint} />
        <Text style={styles.serverText}>{API_URL}</Text>
      </View>

      <Button label="Se déconnecter" variant="danger" icon="log-out-outline" onPress={logout} />
    </ScrollView>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <Card style={{ flex: 1, gap: spacing.xs }}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function Row({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.rowWrap}>
      <View style={styles.row}>
        <Ionicons name={icon} size={20} color={colors.text} />
        <Text style={styles.rowLabel}>{label}</Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textFaint}
          style={{ marginLeft: 'auto' }}
        />
      </View>
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  title: {
    fontSize: font.size.xxl,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: font.size.xxl,
    fontWeight: font.weight.bold,
    color: colors.white,
  },
  name: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  email: {
    fontSize: font.size.sm,
    color: colors.textMuted,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySurface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginTop: spacing.xs,
  },
  roleText: {
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    color: colors.primaryDark,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statValue: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: font.size.xs,
    color: colors.textMuted,
  },
  rowWrap: {
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowLabel: {
    fontSize: font.size.md,
    color: colors.text,
    fontWeight: font.weight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  serverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  serverText: {
    fontSize: font.size.xs,
    color: colors.textFaint,
  },
});
