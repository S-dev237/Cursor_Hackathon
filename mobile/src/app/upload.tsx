import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { api, ApiError } from '../lib/api';
import { Button, Input } from '../components/ui';
import { colors, font, radius, spacing } from '../lib/theme';
import {
  TYPES_PEDAGOGIQUES,
  TYPES_SCIENTIFIQUES,
  TYPE_LABELS,
  ACCES_LABELS,
  formatTaille,
} from '../lib/format';
import type { NiveauAcces, TypeDocument } from '../lib/types';

const ACCES: NiveauAcces[] = ['PUBLIC', 'CAMPUS', 'PRIVE'];

export default function Upload() {
  const insets = useSafeAreaInsets();
  const [titre, setTitre] = useState('');
  const [type, setType] = useState<TypeDocument>('COURS');
  const [acces, setAcces] = useState<NiveauAcces>('CAMPUS');
  const [annee, setAnnee] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (!res.canceled && res.assets?.[0]) {
      setFile(res.assets[0]);
      if (!titre) setTitre(res.assets[0].name.replace(/\.pdf$/i, ''));
    }
  };

  const submit = async () => {
    setError(null);
    if (!titre.trim()) return setError('Le titre est requis.');
    if (!file) return setError('Sélectionnez un fichier PDF.');

    setLoading(true);
    try {
      const { id } = await api.creerRessource({
        titre: titre.trim(),
        type_document: type,
        niveau_acces: acces,
        annee: annee ? parseInt(annee, 10) : undefined,
        description: description.trim() || undefined,
      });
      await api.uploaderFichier(id, {
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType ?? 'application/pdf',
      });
      router.back();
      router.push(`/document/${id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Échec de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Importer un document</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Sélecteur de fichier */}
        <Pressable
          style={[styles.dropzone, file && styles.dropzoneFilled]}
          onPress={pick}
        >
          <View style={styles.dropIcon}>
            <Ionicons
              name={file ? 'document-text' : 'cloud-upload-outline'}
              size={28}
              color={colors.primary}
            />
          </View>
          {file ? (
            <>
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={styles.fileMeta}>
                {file.size ? formatTaille(file.size) : 'PDF'} · Toucher pour changer
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.dropTitle}>Choisir un fichier PDF</Text>
              <Text style={styles.dropSub}>Touchez pour parcourir vos fichiers</Text>
            </>
          )}
        </Pressable>

        <Input
          label="Titre"
          placeholder="Ex. Cours de Réseaux — Routage OSPF"
          value={titre}
          onChangeText={setTitre}
        />

        {/* Type pédagogique */}
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Ressource pédagogique</Text>
          <View style={styles.wrap}>
            {TYPES_PEDAGOGIQUES.map((t) => (
              <TypeChip key={t} t={t} active={type === t} onPress={() => setType(t)} />
            ))}
          </View>
          <Text style={[styles.label, { marginTop: spacing.sm }]}>
            Production scientifique
          </Text>
          <View style={styles.wrap}>
            {TYPES_SCIENTIFIQUES.map((t) => (
              <TypeChip key={t} t={t} active={type === t} onPress={() => setType(t)} />
            ))}
          </View>
        </View>

        {/* Niveau d'accès */}
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Niveau d’accès</Text>
          <View style={styles.row}>
            {ACCES.map((a) => (
              <Pressable
                key={a}
                onPress={() => setAcces(a)}
                style={[styles.accesChip, acces === a && styles.accesChipActive]}
              >
                <Ionicons
                  name={
                    a === 'PUBLIC'
                      ? 'globe-outline'
                      : a === 'CAMPUS'
                        ? 'business-outline'
                        : 'lock-closed-outline'
                  }
                  size={16}
                  color={acces === a ? colors.white : colors.textMuted}
                />
                <Text
                  style={[
                    styles.accesText,
                    acces === a && { color: colors.white },
                  ]}
                >
                  {ACCES_LABELS[a]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input
              label="Année"
              placeholder="2026"
              keyboardType="number-pad"
              value={annee}
              onChangeText={setAnnee}
            />
          </View>
        </View>

        <Input
          label="Description (optionnel)"
          placeholder="Quelques mots sur le contenu…"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ height: 90, textAlignVertical: 'top', paddingTop: spacing.md }}
        />

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button
          label="Publier le document"
          icon="cloud-upload"
          onPress={submit}
          loading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TypeChip({
  t,
  active,
  onPress,
}: {
  t: TypeDocument;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.typeChip, active && styles.typeChipActive]}
    >
      <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
        {TYPE_LABELS[t]}
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
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.semibold,
    color: colors.text,
  },
  dropzone: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dropzoneFilled: {
    borderStyle: 'solid',
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  dropIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  dropTitle: {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.text,
  },
  dropSub: {
    fontSize: font.size.sm,
    color: colors.textMuted,
  },
  fileName: {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.primaryDark,
    paddingHorizontal: spacing.lg,
  },
  fileMeta: {
    fontSize: font.size.xs,
    color: colors.textMuted,
  },
  label: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.textMuted,
  },
  typeChipTextActive: {
    color: colors.white,
    fontWeight: font.weight.semibold,
  },
  accesChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  accesChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  accesText: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.textMuted,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: font.size.sm,
    color: colors.danger,
  },
});
