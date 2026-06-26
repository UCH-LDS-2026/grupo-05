import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { api } from '../../lib/api';
import { saveOwnerSession } from '../../lib/storage';
import { colors, radius, space } from '../../theme';

export default function OwnerRegister() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Completá todos los campos');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.ownerRegister(name.trim(), email.trim(), password.trim()) as any;
      const owner = res.owner;
      saveOwnerSession(res.token, owner);

      if (owner.status === 'PENDIENTE_VALIDACION') {
        router.replace('/owner/validation');
      } else {
        router.replace('/owner/reviews');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Error al registrarte');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={styles.card}>
          <Text style={styles.title}>Crear cuenta de Dueño</Text>
          <Text style={styles.subtitle}>Comenzá a gestionar tu kiosco.</Text>

          <Text style={styles.label}>Nombre completo</Text>
          <TextInput style={styles.input} placeholder="Juan Pérez" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="tu@email.com" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={colors.muted} secureTextEntry value={password} onChangeText={setPassword} />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={[styles.button, loading && { opacity: 0.7 }]} onPress={onSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Registrarme</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: space.xl },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.xl, gap: space.xs },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: space.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: space.sm, marginBottom: space.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.md, fontSize: 16, color: colors.text, backgroundColor: colors.bg },
  error: { color: colors.danger, marginTop: space.sm, fontSize: 14 },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: space.md + 2, alignItems: 'center', marginTop: space.lg },
  buttonText: { color: colors.white, fontSize: 17, fontWeight: '700' },
});
