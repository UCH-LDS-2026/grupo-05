import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../lib/auth';
import { colors, radius, space } from '../theme';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!code.trim()) {
      setError('Ingresá tu código de invitación');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(code.trim(), name.trim() || undefined);
      router.replace('/kiosks');
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo ingresar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hero}>
        <Text style={styles.logo}>Spot</Text>
        <Text style={styles.tagline}>Tu kiosco favorito, a un toque.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Ingresar con invitación</Text>
        <Text style={styles.subtitle}>
          Spot es por invitación. Pegá tu código para entrar.
        </Text>

        <Text style={styles.label}>Código de invitación</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: SPOT2026"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          value={code}
          onChangeText={setCode}
        />

        <Text style={styles.label}>Tu nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="¿Cómo te llamás?"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </Pressable>

        <Text style={styles.hint}>
          Códigos de demo: SPOT2026 · YESMZA
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: space.xxl,
  },
  logo: { color: colors.primary, fontSize: 56, fontWeight: '800', letterSpacing: -1 },
  tagline: { color: colors.white, fontSize: 16, marginTop: space.xs, opacity: 0.8 },
  card: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg * 1.6,
    borderTopRightRadius: radius.lg * 1.6,
    padding: space.xl,
    paddingBottom: space.xxl,
    gap: space.xs,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: space.md },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: space.sm,
    marginBottom: space.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  error: { color: colors.danger, marginTop: space.sm, fontSize: 14 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space.md + 2,
    alignItems: 'center',
    marginTop: space.lg,
  },
  buttonText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  hint: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
    marginTop: space.md,
  },
});
