import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { colors, font, spacing } from '../../lib/theme';
import { DocumentCard } from '../../components/DocumentCard';
import { EmptyState } from '../../components/ui';
import type { DossierDetail } from '../../lib/types';

export default function DossierScreen() {
  const insets = useSafeAreaInsets();
  const { id, nom } = useLocalSearchParams<{ id: string; nom?: string }>();
  const { user } = useAuth();
  const [dossier, setDossier] = useState<DossierDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setDossier(await api.lireDossier(id));
    } catch {
      setDossier(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const docs = dossier?.ressources ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {dossier?.nom ?? nom ?? 'Dossier'}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{
            padding: spacing.lg,
            gap: spacing.md,
            paddingBottom: 60,
          }}
          ListHeaderComponent={
            <View style={styles.banner}>
              <Ionicons name="folder-open" size={18} color={colors.primary} />
              <Text style={styles.bannerText}>
                {docs.length} document{docs.length > 1 ? 's' : ''} classé
                {docs.length > 1 ? 's' : ''} ici — sans duplication du fichier.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="documents-outline"
              title="Dossier vide"
              subtitle="Aucun document n'est rattaché à ce dossier virtuel."
            />
          }
          renderItem={({ item }) => (
            <DocumentCard
              ressource={item}
              owned={item.proprietaire_id === user?.id}
              onPress={() => router.push(`/document/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.text,
    marginHorizontal: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySurface,
    borderRadius: 12,
    padding: spacing.md,
  },
  bannerText: {
    flex: 1,
    fontSize: font.size.sm,
    color: colors.primaryDark,
    lineHeight: 19,
  },
});
