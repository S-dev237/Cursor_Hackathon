import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Badge, Button } from '../../components/ui';
import { ChatPanel } from '../../components/ChatPanel';
import { colors, font, radius, spacing } from '../../lib/theme';
import {
  ACCES_LABELS,
  CATEGORIE_LABELS,
  TYPE_LABELS,
  accesColor,
  formatTaille,
} from '../../lib/format';
import type { Fichier, Ressource } from '../../lib/types';

type Tab = 'read' | 'chat';

export default function DocumentDetail() {
  const insets = useSafeAreaInsets();
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const { user } = useAuth();
  const [ressource, setRessource] = useState<Ressource | null>(null);
  const [fichiers, setFichiers] = useState<Fichier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(tab === 'chat' ? 'chat' : 'read');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [r, f] = await Promise.all([
        api.lireRessource(id),
        api.listerFichiers(id).catch(() => []),
      ]);
      setRessource(r);
      setFichiers(f);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const fichier = fichiers[0];
  const pdfUrl = fichier?.url ?? null;

  // Sur Android, WebView ne rend pas les PDF nativement → visionneuse Google
  const viewerUrl =
    pdfUrl && Platform.OS === 'android'
      ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(pdfUrl)}`
      : pdfUrl;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* En-tête */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {ressource?.titre ?? 'Document'}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : !ressource ? (
        <View style={styles.center}>
          <Text style={{ color: colors.textMuted }}>Document introuvable.</Text>
        </View>
      ) : (
        <>
          {/* Méta */}
          <View style={styles.metaCard}>
            <View style={styles.metaBadges}>
              <Badge label={TYPE_LABELS[ressource.type_document] ?? ressource.type_document} />
              <Badge
                label={ACCES_LABELS[ressource.niveau_acces] ?? ressource.niveau_acces}
                color={accesColor(ressource.niveau_acces)}
              />
              {ressource.annee ? <Badge label={`${ressource.annee}`} color={colors.textMuted} /> : null}
            </View>
            <Text style={styles.catLabel}>
              {CATEGORIE_LABELS[ressource.categorie] ?? ressource.categorie}
            </Text>
            {ressource.description ? (
              <Text style={styles.desc}>{ressource.description}</Text>
            ) : null}
          </View>

          {/* Onglets */}
          <View style={styles.tabs}>
            <TabBtn
              label="Lecture"
              icon="document-text"
              active={activeTab === 'read'}
              onPress={() => setActiveTab('read')}
            />
            <TabBtn
              label="Discuter"
              icon="chatbubbles"
              active={activeTab === 'chat'}
              onPress={() => setActiveTab('chat')}
            />
          </View>

          {activeTab === 'read' ? (
            <View style={{ flex: 1 }}>
              {viewerUrl ? (
                <WebView
                  source={{ uri: viewerUrl }}
                  style={{ flex: 1 }}
                  startInLoadingState
                  renderLoading={() => (
                    <View style={styles.center}>
                      <ActivityIndicator color={colors.primary} size="large" />
                    </View>
                  )}
                />
              ) : (
                <ScrollView contentContainerStyle={styles.noPdf}>
                  <Ionicons name="document-outline" size={40} color={colors.textFaint} />
                  <Text style={styles.noPdfText}>
                    Aucun fichier consultable n’est disponible pour ce document.
                  </Text>
                </ScrollView>
              )}
              {pdfUrl ? (
                <View style={styles.readActions}>
                  <Text style={styles.fileInfo} numberOfLines={1}>
                    {fichier?.nom_original}
                    {fichier?.taille_octets
                      ? ` · ${formatTaille(fichier.taille_octets)}`
                      : ''}
                  </Text>
                  <Button
                    label="Navigateur"
                    icon="open-outline"
                    variant="outline"
                    onPress={() => Linking.openURL(pdfUrl)}
                    style={{ height: 42, paddingHorizontal: spacing.md }}
                  />
                </View>
              ) : null}
            </View>
          ) : (
            <ChatPanel
              contextHint={ressource.titre}
              placeholder="Question sur ce document…"
              suggestions={[
                'Résume ce document en 3 points.',
                'Quels sont les concepts clés abordés ?',
              ]}
            />
          )}
        </>
      )}
    </View>
  );
}

function TabBtn({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={18}
        color={active ? colors.primary : colors.textFaint}
      />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </Pressable>
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
  metaCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  metaBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  catLabel: {
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  desc: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  tabBtnActive: {
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.textFaint,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: font.weight.semibold,
  },
  noPdf: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  noPdfText: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  readActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  fileInfo: {
    flex: 1,
    fontSize: font.size.xs,
    color: colors.textMuted,
  },
});
