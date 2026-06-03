import { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { colors, font, radius, shadow, spacing } from '../../lib/theme';
import { DocumentCard } from '../../components/DocumentCard';
import type { Ressource } from '../../lib/types';

export default function Home() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [recent, setRecent] = useState<Ressource[]>([]);
  const [mineCount, setMineCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [all, mine] = await Promise.all([
        api.listerRessources(),
        api.listerRessources({ mine: true }),
      ]);
      setRecent(all.slice(0, 4));
      setMineCount(mine.length);
    } catch {
      // silencieux sur l'accueil
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const prenom = user?.prenom || user?.email?.split('@')[0] || '';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingBottom: spacing.xxl,
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Bonjour{prenom ? `,` : ''}</Text>
          <Text style={styles.name}>{prenom || 'bienvenue'} 👋</Text>
        </View>
      </View>

      {/* Bannière */}
      <View style={styles.banner}>
        <View style={styles.bannerGlow} />
        <Text style={styles.bannerTitle}>
          Explorez le savoir{'\n'}de votre campus
        </Text>
        <Text style={styles.bannerSub}>
          Cours, mémoires, articles — et un assistant IA qui répond à partir de
          vos documents.
        </Text>
        <Pressable
          style={styles.bannerBtn}
          onPress={() => router.push('/(tabs)/assistant')}
        >
          <Ionicons name="sparkles" size={16} color={colors.primaryDark} />
          <Text style={styles.bannerBtnText}>Poser une question</Text>
        </Pressable>
      </View>

      {/* Actions rapides */}
      <View style={styles.quickRow}>
        <QuickAction
          icon="cloud-upload"
          label="Importer"
          onPress={() => router.push('/upload')}
        />
        <QuickAction
          icon="folder-open"
          label="Documents"
          onPress={() => router.push('/(tabs)/documents')}
        />
        <QuickAction
          icon="person"
          label={`Mes docs · ${mineCount}`}
          onPress={() =>
            router.push({ pathname: '/(tabs)/documents', params: { mine: '1' } })
          }
        />
      </View>

      {/* Récents */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Ajouts récents</Text>
        <Pressable onPress={() => router.push('/(tabs)/documents')}>
          <Text style={styles.seeAll}>Tout voir</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {recent.length === 0 ? (
          <View style={styles.emptyMini}>
            <Ionicons name="documents-outline" size={22} color={colors.textFaint} />
            <Text style={styles.emptyMiniText}>
              Aucun document pour l’instant. Importez-en un !
            </Text>
          </View>
        ) : (
          recent.map((r) => (
            <DocumentCard
              key={r.id}
              ressource={r}
              owned={r.proprietaire_id === user?.id}
              onPress={() => router.push(`/document/${r.id}`)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quick, pressed && { opacity: 0.9 }]}
      onPress={onPress}
    >
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.quickLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  hello: {
    fontSize: font.size.sm,
    color: colors.textMuted,
  },
  name: {
    fontSize: font.size.xxl,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  banner: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    ...shadow.floating,
  },
  bannerGlow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: '#FFFFFF22',
  },
  bannerTitle: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: colors.white,
    lineHeight: 28,
  },
  bannerSub: {
    fontSize: font.size.sm,
    color: '#EAFBF3',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.lg,
  },
  bannerBtnText: {
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: colors.primaryDark,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  quick: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.card,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
    color: colors.text,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  seeAll: {
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: colors.primary,
  },
  emptyMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  emptyMiniText: {
    flex: 1,
    fontSize: font.size.sm,
    color: colors.textMuted,
  },
});
