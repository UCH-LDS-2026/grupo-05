import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { saveSession } from '../../lib/storage';
import { colors, radius, space } from '../../theme';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    try {
      setLoading(true);
      setError('');
      const data = await api.adminLogin(email, password);
      // Reutilizamos el almacenamiento de token/player (en este caso el admin)
      saveSession((data as any).token, (data as any).admin || { id: 'admin', name: 'Admin' });
      router.replace('/admin');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Spot Admin</Text>
        <Text style={styles.subtitle}>Iniciá sesión para administrar</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.btnText}>Ingresar</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: space.xl },
  card: { backgroundColor: colors.card, padding: space.xl, borderRadius: radius.lg, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  title: { fontSize: 24, fontWeight: '700', color: colors.navy, textAlign: 'center', marginBottom: space.sm },
  subtitle: { fontSize: 16, color: colors.muted, textAlign: 'center', marginBottom: space.xl },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space.md, marginBottom: space.md, fontSize: 16 },
  btn: { backgroundColor: colors.navy, padding: space.md, borderRadius: radius.md, alignItems: 'center', marginTop: space.sm },
  btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  error: { color: colors.danger, marginBottom: space.md, textAlign: 'center' },
});
