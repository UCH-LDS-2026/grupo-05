import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../../lib/api';
import type { KioskUpsert } from '../../../../lib/api';
import { colors, radius, space } from '../../../../theme';

export default function EditKiosk() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [form, setForm] = useState<KioskUpsert>({ name: '', address: '', city: '', brand: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadKiosk();
  }, [id]);

  async function loadKiosk() {
    try {
      // Notamos que no hay endpoint específico para GET /owner/kiosks/:id
      // Pero podemos usar el general de GET /kiosks/:id 
      // y si somos owner nos devolverá el kiosco si existe
      const kiosk = await api.kiosk(id);
      setForm({
        name: kiosk.name,
        address: kiosk.address,
        city: kiosk.city,
        brand: kiosk.brand || '',
        lat: kiosk.lat,
        lng: kiosk.lng,
      });
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar kiosco');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit() {
    if (!form.name.trim() || !form.address.trim()) {
      setError('Nombre y dirección son obligatorios');
      return;
    }
    
    setSaving(true);
    setError(null);
    try {
      await api.ownerUpdateKiosk(id, {
        ...form,
        city: form.city || 'Mendoza',
        brand: form.brand || null,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
      });
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Error al actualizar kiosco');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Editar Kiosco</Text>
        
        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.muted}
          value={form.name}
          onChangeText={(val) => setForm({ ...form, name: val })}
        />

        <Text style={styles.label}>Dirección *</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.muted}
          value={form.address}
          onChangeText={(val) => setForm({ ...form, address: val })}
        />

        <Text style={styles.label}>Ciudad</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.muted}
          value={form.city}
          onChangeText={(val) => setForm({ ...form, city: val })}
        />

        <Text style={styles.label}>Marca (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.muted}
          value={form.brand || ''}
          onChangeText={(val) => setForm({ ...form, brand: val })}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: space.sm }}>
            <Text style={styles.label}>Latitud</Text>
            <TextInput
              style={styles.input}
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
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={form.lng ? String(form.lng) : ''}
              onChangeText={(val) => setForm({ ...form, lng: parseFloat(val) })}
            />
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={[styles.button, saving && { opacity: 0.7 }]} onPress={onSubmit} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Guardar Cambios</Text>}
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
