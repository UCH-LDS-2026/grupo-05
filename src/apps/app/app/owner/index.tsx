import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { api } from '../../lib/api';
import type { OwnerKioskItem } from '../../lib/api';
import { colors, radius, space } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { getPlayer, clearSession } from '../../lib/storage';

export default function OwnerDashboard() {
  const router = useRouter();
  const [kiosks, setKiosks] = useState<OwnerKioskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // We check if it's pending validation. If we didn't fetch the owner from the backend yet,
  // we could fetch `auth/me` to get the status. For now we will fetch kiosks.
  // If the backend returns 403 (Pending validation), we catch it and show the banner.
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    loadKiosks();
  }, []);

  async function loadKiosks() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.ownerKiosks();
      setKiosks(data);
      setIsPending(false);
    } catch (err: any) {
      if (err.message?.includes('PENDIENTE_VALIDACION')) {
        setIsPending(true);
      } else {
        setError(err.message ?? 'Error al cargar kioscos');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearSession();
    router.replace('/owner/login');
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Kioscos</Text>
        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </Pressable>
      </View>

      {isPending && (
        <View style={styles.warningBanner}>
          <Ionicons name="alert-circle" size={24} color={colors.danger} />
          <Text style={styles.warningText}>
            Tu cuenta está en revisión. No podrás crear ni editar kioscos hasta ser validado.
          </Text>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {!isPending && (
        <Link href="/owner/kiosks/new" asChild>
          <Pressable style={styles.createBtn}>
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={styles.createBtnText}>Nuevo Kiosco</Text>
          </Pressable>
        </Link>
      )}

      <FlatList
        data={kiosks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: space.xl }}
        ListEmptyComponent={
          !isPending ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Todavía no tenés kioscos.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Link href={`/owner/kiosks/${item.id}`} asChild>
            <Pressable style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.kioskName}>{item.name}</Text>
                <Text style={styles.kioskAddress}>{item.address}, {item.city}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.muted} />
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: space.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg, marginTop: space.md },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  logoutBtn: { padding: space.sm },
  logoutText: { color: colors.danger, fontWeight: '600' },
  warningBanner: { backgroundColor: '#fee2e2', padding: space.md, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', marginBottom: space.lg, gap: space.sm },
  warningText: { color: colors.danger, flex: 1, fontWeight: '500' },
  createBtn: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: space.md, borderRadius: radius.md, marginBottom: space.lg, gap: space.xs },
  createBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  error: { color: colors.danger, marginBottom: space.md },
  empty: { padding: space.xl, alignItems: 'center' },
  emptyText: { color: colors.muted, fontSize: 16 },
  card: { backgroundColor: colors.card, padding: space.md, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', marginBottom: space.md },
  cardInfo: { flex: 1 },
  kioskName: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 4 },
  kioskAddress: { fontSize: 14, color: colors.muted },
});
