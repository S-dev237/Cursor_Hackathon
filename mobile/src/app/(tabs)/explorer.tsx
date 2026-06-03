import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { api } from '../../lib/api';
import { colors, font, radius, shadow, spacing } from '../../lib/theme';
import { EmptyState } from '../../components/ui';
import type { Axe, DossierVirtuel } from '../../lib/types';

const AXE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  DISCIPLINE: 'git-network',
  DOMAINE: 'globe',
  ANNEE: 'calendar',
  AUTEUR: 'person',
  LABORATOIRE: 'business',
};

export default function Explorer() {
  const insets = useSafeAreaInsets();
  const [axes, setAxes] = useState<Axe[]>([]);
  const [axeActif, setAxeActif] = useState<string | null>(null);
  const [dossiers, setDossiers] = useState<DossierVirtuel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDossiers, setLoadingDossiers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAxes = useCallback(async () => {
    try {
      const list = await api.listerAxes();
      setAxes(list);
      setAxeActif((cur) => cur ?? list[0]?.axe ?? null);
    } catch {
      setAxes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDossiers = useCallback(async (axe: string) => {
    setLoadingDossiers(true);
    try {
      setDossiers(await api.listerDossiers(axe));
    } catch {
      setDossiers([]);
    } finally {
      setLoadingDossiers(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAxes();
    }, [loadAxes]),
  );

  useEffect(() => {
    if (axeActif) loadDossiers(axeActif);
  }, [axeActif, loadDossiers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAxes();
    if (axeActif) await loadDossiers(axeActif);
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Explorer</Text>
        <Text style={styles.subtitle}>
          Organisation automatique par inférence Prolog — un document, plusieurs
          vues.
        </Text>

        <FlatList
          horizontal
          data={axes}
          keyExtractor={(a) => a.axe}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm }}
          renderItem={({ item }) => {
            const active = axeActif === item.axe;
            return (
              <Pressable
                onPress={() => setAxeActif(item.axe)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Ionicons
                  name={AXE_ICONS[item.axe] ?? 'folder'}
                  size={15}
                  color={active ? colors.white : colors.primary}
                />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {item.libelle}
                </Text>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            loading ? null : (
              <Text style={styles.noAxe}>Aucun axe pour le moment.</Text>
            )
          }
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : loadingDossiers ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={dossiers}
          keyExtractor={(d) => d.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.md }}
          contentContainerStyle={{
            padding: spacing.lg,
            gap: spacing.md,
            paddingBottom: 120,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="folder-open-outline"
              title="Aucun dossier"
              subtitle="Importez un document : le système le classera automatiquement dans plusieurs dossiers virtuels."
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.folder, pressed && { opacity: 0.9 }]}
              onPress={() =>
                router.push({
                  pathname: '/dossier/[id]',
                  params: { id: item.id, nom: item.nom, axe: axeActif ?? '' },
                })
              }
            >
              <View style={styles.folderIcon}>
                <Ionicons
                  name={AXE_ICONS[item.axe] ?? 'folder'}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.folderName} numberOfLines={2}>
                {item.nom}
              </Text>
              <Text style={styles.folderCount}>
                {item.nb_documents} document{item.nb_documents > 1 ? 's' : ''}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  title: {
    fontSize: font.size.xxl,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    lineHeight: 19,
  },
  noAxe: {
    fontSize: font.size.sm,
    color: colors.textFaint,
    paddingVertical: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: font.weight.semibold,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folder: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.card,
  },
  folderIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderName: {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.text,
    lineHeight: 21,
  },
  folderCount: {
    fontSize: font.size.xs,
    color: colors.textFaint,
    fontWeight: font.weight.medium,
  },
});
