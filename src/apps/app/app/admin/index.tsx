import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api, AdminOwnerItem } from '../../lib/api';
import { clearSession } from '../../lib/storage';
import { colors, radius, space } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboard() {
  const router = useRouter();
  const [owners, setOwners] = useState<AdminOwnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOwners();
  }, []);

  async function loadOwners() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.adminOwners();
      setOwners(data);
    } catch (err: any) {
      setError(err.message ?? 'Error al cargar owners');
    } finally {
      setLoading(false);
    }
  }

  async function handleValidate(id: string, name: string) {
    if (!window.confirm(`¿Estás seguro de validar a ${name}?`)) return;
    try {
      setLoading(true);
      await api.adminValidateOwner(id);
      await loadOwners(); // Refrescar lista
    } catch (err: any) {
      alert(err.message ?? 'Error al validar owner');
      setLoading(false);
    }
  }

  function handleLogout() {
    clearSession();
    router.replace('/admin/login');
  }

  if (loading && owners.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel Admin</Text>
        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={owners}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: space.xl }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay owners registrados.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.ownerName}>{item.name}</Text>
              <Text style={styles.ownerEmail}>{item.email}</Text>
              <Text style={[styles.status, item.status === 'VALIDADO' ? styles.statusValid : styles.statusPending]}>
                {item.status}
              </Text>
            </View>
            
            {item.status === 'PENDIENTE_VALIDACION' && (
              <Pressable style={styles.validateBtn} onPress={() => handleValidate(item.id, item.name)}>
                <View style={{ marginRight: space.xs }}><Ionicons name="checkmark-circle" size={20} color={colors.white} /></View>
                <Text style={styles.validateBtnText}>Validar</Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: space.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg, marginTop: space.md },
  title: { fontSize: 28, fontWeight: '700', color: colors.navy },
  logoutBtn: { padding: space.sm },
  logoutText: { color: colors.danger, fontWeight: '600' },
  error: { color: colors.danger, marginBottom: space.md },
  empty: { padding: space.xl, alignItems: 'center' },
  emptyText: { color: colors.muted, fontSize: 16 },
  card: { backgroundColor: colors.card, padding: space.md, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', marginBottom: space.md },
  cardInfo: { flex: 1 },
  ownerName: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 2 },
  ownerEmail: { fontSize: 14, color: colors.muted, marginBottom: 4 },
  status: { fontSize: 12, fontWeight: '700' },
  statusPending: { color: '#eab308' },
  statusValid: { color: colors.success },
  validateBtn: { backgroundColor: colors.success, flexDirection: 'row', alignItems: 'center', paddingVertical: space.sm, paddingHorizontal: space.md, borderRadius: radius.md },
  validateBtnText: { color: colors.white, fontWeight: '700' },
});
