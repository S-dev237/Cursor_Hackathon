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
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';
import { Button, Input } from '../components/ui';
import { colors, font, radius, spacing } from '../lib/theme';
import type { TypeUtilisateur } from '../lib/types';

type Mode = 'login' | 'register';

const ROLES: { value: TypeUtilisateur; label: string }[] = [
  { value: 'ETUDIANT', label: 'Étudiant' },
  { value: 'ENSEIGNANT', label: 'Enseignant' },
];

export default function Login() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [role, setRole] = useState<TypeUtilisateur>('ETUDIANT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email || !motDePasse) {
      setError('Email et mot de passe requis.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), motDePasse);
      } else {
        await signUp({
          email: email.trim(),
          mot_de_passe: motDePasse,
          type_user: role,
          nom: nom || undefined,
          prenom: prenom || undefined,
        });
      }
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logo}>
          <Ionicons name="library" size={34} color={colors.white} />
        </View>
        <Text style={styles.title}>AcaDoc</Text>
        <Text style={styles.subtitle}>
          La bibliothèque académique intelligente de votre campus
        </Text>

        <View style={styles.switcher}>
          {(['login', 'register'] as Mode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => {
                setMode(m);
                setError(null);
              }}
              style={[styles.switchTab, mode === m && styles.switchTabActive]}
            >
              <Text
                style={[
                  styles.switchText,
                  mode === m && styles.switchTextActive,
                ]}
              >
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.form}>
          {mode === 'register' ? (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Prénom"
                  placeholder="Awa"
                  value={prenom}
                  onChangeText={setPrenom}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Nom"
                  placeholder="Diallo"
                  value={nom}
                  onChangeText={setNom}
                />
              </View>
            </View>
          ) : null}

          <Input
            label="Email"
            icon="mail-outline"
            placeholder="prenom.nom@univ.fr"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Mot de passe"
            icon="lock-closed-outline"
            placeholder="••••••••"
            secureTextEntry
            value={motDePasse}
            onChangeText={setMotDePasse}
          />

          {mode === 'register' ? (
            <View style={{ gap: spacing.xs }}>
              <Text style={styles.roleLabel}>Je suis</Text>
              <View style={styles.row}>
                {ROLES.map((r) => (
                  <Pressable
                    key={r.value}
                    onPress={() => setRole(r.value)}
                    style={[
                      styles.roleChip,
                      role === r.value && styles.roleChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        role === r.value && styles.roleChipTextActive,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            label={mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            onPress={submit}
            loading={loading}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: font.size.display,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  switcher: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    marginTop: spacing.xxl,
  },
  switchTab: {
    flex: 1,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTabActive: {
    backgroundColor: colors.white,
    ...{
      shadowColor: '#0E3D2B',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
  },
  switchText: {
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: colors.textMuted,
  },
  switchTextActive: {
    color: colors.primary,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  roleLabel: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  roleChip: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  roleChipText: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.textMuted,
  },
  roleChipTextActive: {
    color: colors.primaryDark,
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
