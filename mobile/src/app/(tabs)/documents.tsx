import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { api, ApiError } from '../../lib/api';
import { colors, font, radius, shadow, spacing } from '../../lib/theme';
import { DocumentCard } from '../../components/DocumentCard';
import { EmptyState, Input } from '../../components/ui';
import { TYPE_LABELS } from '../../lib/format';
import type { Ressource, TypeDocument } from '../../lib/types';

const FILTERS: { key: string; label: string; type?: TypeDocument }[] = [
  { key: 'ALL', label: 'Tous' },
  { key: 'COURS', label: 'Cours', type: 'COURS' },
  { key: 'TD', label: 'TD', type: 'TD' },
  { key: 'TP', label: 'TP', type: 'TP' },
  { key: 'EXAMEN', label: 'Examens', type: 'EXAMEN' },
  { key: 'MEMOIRE', label: 'Mémoires', type: 'MEMOIRE' },
  { key: 'THESE', label: 'Thèses', type: 'THESE' },
  { key: 'ARTICLE', label: 'Articles', type: 'ARTICLE' },
];

export default function Documents() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ mine?: string }>();
  const [docs, setDocs] = useState<Ressource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [mine, setMine] = useState(params.mine === '1');
  const [search, setSearch] = useState('');
  const [menuDoc, setMenuDoc] = useState<Ressource | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const type = FILTERS.find((f) => f.key === filter)?.type;
        const list = await api.listerRessources({
          mine,
          type_doc: type,
          q: search.trim() || undefined,
        });
        setDocs(list);
      } catch {
        setDocs([]);
      } finally {
        setLoading(false);
      }
    },
    [filter, mine, search],
  );

  useFocusEffect(
    useCallback(() => {
      load({ silent: true });
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load({ silent: true });
    setRefreshing(false);
  };

  const confirmDelete = async () => {
    if (!menuDoc) return;
    setDeleting(true);
    try {
      await api.supprimerRessource(menuDoc.id);
      setDocs((d) => d.filter((x) => x.id !== menuDoc.id));
      setMenuDoc(null);
    } catch (e) {
      // garde le menu ouvert ; on pourrait afficher un toast
    } finally {
      setDeleting(false);
    }
  };

  const isOwner = (r: Ressource) => r.proprietaire_id === user?.id;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Documents</Text>
        <Input
          icon="search"
          placeholder="Rechercher un titre…"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load()}
          returnKeyType="search"
        />

        {/* Toggle Mes documents */}
        <Pressable
          style={styles.mineToggle}
          onPress={() => {
            setMine((m) => !m);
            setTimeout(() => load(), 0);
          }}
        >
          <Ionicons
            name={mine ? 'checkbox' : 'square-outline'}
            size={18}
            color={mine ? colors.primary : colors.textFaint}
          />
          <Text style={[styles.mineText, mine && { color: colors.primaryDark }]}>
            Mes documents uniquement
          </Text>
        </Pressable>

        {/* Filtres par catégorie */}
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm }}
          renderItem={({ item }) => {
            const active = filter === item.key;
            return (
              <Pressable
                onPress={() => {
                  setFilter(item.key);
                  setTimeout(() => load(), 0);
                }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
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
              icon="documents-outline"
              title="Aucun document"
              subtitle={
                mine
                  ? "Vous n'avez encore rien importé. Touchez le bouton + pour ajouter un document."
                  : 'Aucun document ne correspond à ces critères.'
              }
            />
          }
          renderItem={({ item }) => (
            <DocumentCard
              ressource={item}
              owned={isOwner(item)}
              onPress={() => router.push(`/document/${item.id}`)}
              onLongPress={() => setMenuDoc(item)}
            />
          )}
        />
      )}

      {/* FAB upload */}
      <Pressable
        style={[styles.fab, { bottom: spacing.xl }]}
        onPress={() => router.push('/upload')}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      {/* Menu contextuel (long-press) */}
      <Modal
        visible={!!menuDoc}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuDoc(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMenuDoc(null)}>
          <Pressable style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle} numberOfLines={2}>
              {menuDoc?.titre}
            </Text>
            <Text style={styles.sheetSub}>
              {menuDoc ? TYPE_LABELS[menuDoc.type_document] : ''}
            </Text>

            <SheetAction
              icon="open-outline"
              label="Ouvrir le document"
              onPress={() => {
                const id = menuDoc?.id;
                setMenuDoc(null);
                if (id) router.push(`/document/${id}`);
              }}
            />
            <SheetAction
              icon="chatbubbles-outline"
              label="Discuter avec l’IA"
              onPress={() => {
                const id = menuDoc?.id;
                setMenuDoc(null);
                if (id) router.push(`/document/${id}?tab=chat`);
              }}
            />

            {menuDoc && isOwner(menuDoc) ? (
              <SheetAction
                icon="trash-outline"
                label="Supprimer ce document"
                danger
                loading={deleting}
                onPress={confirmDelete}
              />
            ) : null}

            <Pressable style={styles.cancel} onPress={() => setMenuDoc(null)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SheetAction({
  icon,
  label,
  onPress,
  danger,
  loading,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  loading?: boolean;
}) {
  const tint = danger ? colors.danger : colors.text;
  return (
    <Pressable
      style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.surface }]}
      onPress={onPress}
      disabled={loading}
    >
      <Ionicons name={icon} size={20} color={tint} />
      <Text style={[styles.actionText, { color: tint }]}>{label}</Text>
      {loading ? (
        <ActivityIndicator color={tint} style={{ marginLeft: 'auto' }} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  title: {
    fontSize: font.size.xxl,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  mineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  mineText: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.textMuted,
  },
  chip: {
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
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#0008',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  sheetSub: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  actionText: {
    fontSize: font.size.md,
    fontWeight: font.weight.medium,
  },
  cancel: {
    marginTop: spacing.sm,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.textMuted,
  },
});
