import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../../lib/api';
import type { KioskUpsert } from '../../../lib/api';
import { colors, radius, space } from '../../../theme';

export default function NewKiosk() {
  const router = useRouter();
  const [form, setForm] = useState<KioskUpsert>({ name: '', address: '', city: 'Mendoza', brand: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!form.name.trim() || !form.address.trim()) {
      setError('Nombre y dirección son obligatorios');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await api.ownerCreateKiosk({
        ...form,
        city: form.city || 'Mendoza',
        brand: form.brand || null,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
      });
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Error al crear kiosco');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nuevo Kiosco</Text>
        
        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Kiosco Pepe"
          placeholderTextColor={colors.muted}
          value={form.name}
          onChangeText={(val) => setForm({ ...form, name: val })}
        />

        <Text style={styles.label}>Dirección *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Av. San Martín 123"
          placeholderTextColor={colors.muted}
          value={form.address}
          onChangeText={(val) => setForm({ ...form, address: val })}
        />

        <Text style={styles.label}>Ciudad</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Mendoza"
          placeholderTextColor={colors.muted}
          value={form.city}
          onChangeText={(val) => setForm({ ...form, city: val })}
        />

        <Text style={styles.label}>Marca (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Yes"
          placeholderTextColor={colors.muted}
          value={form.brand || ''}
          onChangeText={(val) => setForm({ ...form, brand: val })}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: space.sm }}>
            <Text style={styles.label}>Latitud</Text>
            <TextInput
              style={styles.input}
              placeholder="-32.89"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={form.lat ? String(form.lat) : ''}
              onChangeText={(val) => setForm({ ...form, lat: parseFloat(val) })}
            />
          </View>
          <View style={{ flex: 1, marginLeft: space.sm }}>
            <Text style={styles.label}>Longitud</Text>
            <TextInput
              style={styles.input}
              placeholder="-68.84"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={form.lng ? String(form.lng) : ''}
              onChangeText={(val) => setForm({ ...form, lng: parseFloat(val) })}
            />
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={[styles.button, loading && { opacity: 0.7 }]} onPress={onSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Crear Kiosco</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.xl, backgroundColor: colors.bg, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: space.lg },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: space.sm, marginBottom: space.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.md, fontSize: 16, color: colors.text, backgroundColor: colors.card },
  row: { flexDirection: 'row' },
  error: { color: colors.danger, marginTop: space.md, fontSize: 14 },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: space.md + 2, alignItems: 'center', marginTop: space.lg },
  buttonText: { color: colors.white, fontSize: 17, fontWeight: '700' },
});
