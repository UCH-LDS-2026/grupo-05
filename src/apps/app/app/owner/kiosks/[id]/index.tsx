import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../../lib/api';
import type { KioskStats } from '../../../../lib/api';
import { colors, radius, space } from '../../../../theme';
import { Ionicons } from '@expo/vector-icons';

export default function KioskDashboard() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  console.log('[KioskDashboard] RENDER — params:', params, '— id resuelto:', id);

  const [stats, setStats] = useState<KioskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[KioskDashboard] useEffect — id:', id);
    if (id) {
      loadStats();
    } else {
      console.log('[KioskDashboard] id undefined, seteando error');
      setError('ID de kiosco inválido');
      setLoading(false);
    }
  }, [id]);

  async function loadStats() {
    console.log('[KioskDashboard] loadStats — llamando ownerKioskStats con id:', id);
    try {
      setLoading(true);
      setError(null);
      const data = await api.ownerKioskStats(id);
      console.log('[KioskDashboard] ownerKioskStats OK — data:', data);
      setStats(data);
    } catch (e: any) {
      console.error('[KioskDashboard] ownerKioskStats ERROR:', e?.message, e);
      setError(e?.message ?? 'Error al cargar estadísticas');
    } finally {
      console.log('[KioskDashboard] finally — setLoading(false)');
      setLoading(false);
    }
  }

  if (loading) {
    console.log('[KioskDashboard] return: LOADING');
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: space.md }}>Cargando estadísticas...</Text>
      </View>
    );
  }

  if (error || !stats) {
    console.log('[KioskDashboard] return: ERROR —', error);
    return (
      <View style={styles.fullScreen}>
        <View style={{ marginBottom: space.md }}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        </View>
        <Text style={styles.error}>{error || 'No se encontraron datos del kiosco'}</Text>
        <Pressable onPress={() => router.back()} style={styles.btnSecondary}>
          <Text style={styles.btnTextSecondary}>Volver al panel</Text>
        </Pressable>
      </View>
    );
  }

  console.log('[KioskDashboard] return: STATS OK —', stats);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: space.xl }}>
      {/* Header — Link de editar comentado temporalmente para descarte */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Dashboard del Kiosco</Text>
        {/* <Link href={`/owner/kiosks/${id}/edit`} asChild>
          <Pressable style={styles.editBtn}>
            <Ionicons name="pencil" size={20} color={colors.primary} />
          </Pressable>
        </Link> */}
        <Pressable style={styles.editBtn} onPress={() => router.push(`/owner/kiosks/${id}/edit` as any)}>
          <Ionicons name="pencil" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}><Ionicons name="people" size={28} color={colors.primary} /></View>
          <Text style={styles.statValue}>{stats.uniqueVisitors}</Text>
          <Text style={styles.statLabel}>Visitantes Únicos</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}><Ionicons name="star" size={28} color="#eab308" /></View>
          <Text style={styles.statValue}>
            {stats.avgRating != null ? stats.avgRating.toFixed(1) : '-'}
          </Text>
          <Text style={styles.statLabel}>Rating Promedio</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}><Ionicons name="chatbubbles" size={28} color={colors.muted} /></View>
          <Text style={styles.statValue}>{stats.reviewCount}</Text>
          <Text style={styles.statLabel}>Reseñas Totales</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}><Ionicons name="gift" size={28} color="#10b981" /></View>
          <Text style={styles.statValue}>{stats.redemptionCount}</Text>
          <Text style={styles.statLabel}>Canjes Validados</Text>
        </View>
      </View>

      {/* Acciones — Links comentados temporalmente para descarte */}
      <View style={styles.actionsContainer}>
        {/* Placeholder Bauti — Promociones */}
        {/* <Link href={`/owner/kiosks/${id}/promotions`} asChild> */}
        <Pressable style={styles.actionBtn} onPress={() => router.push(`/owner/kiosks/${id}/promotions` as any)}>
          <Ionicons name="pricetags" size={24} color={colors.white} />
          <Text style={styles.actionBtnText}>Promociones</Text>
          <View style={{ marginLeft: 'auto' }}><Ionicons name="chevron-forward" size={20} color={colors.white} /></View>
        </Pressable>
        {/* </Link> */}

        {/* Placeholder Joel — Validar Canje */}
        {/* <Link href={`/owner/kiosks/${id}/redemptions`} asChild> */}
        <Pressable style={styles.actionBtnGreen} onPress={() => router.push(`/owner/kiosks/${id}/redemptions` as any)}>
          <Ionicons name="qr-code" size={24} color={colors.white} />
          <Text style={styles.actionBtnText}>Validar Canje</Text>
          <View style={{ marginLeft: 'auto' }}><Ionicons name="chevron-forward" size={20} color={colors.white} /></View>
        </Pressable>
        {/* </Link> */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: space.md },
  fullScreen: {
    flex: 1,
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    padding: space.xl,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: space.xl, marginTop: space.sm },
  backBtn: { padding: space.sm, marginRight: space.sm },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, flex: 1 },
  editBtn: { padding: space.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginBottom: space.xl },
  statCard: { flexBasis: '47%', backgroundColor: colors.card, padding: space.md, borderRadius: radius.lg, alignItems: 'center' },
  statIcon: { marginBottom: space.xs },
  statValue: { fontSize: 32, fontWeight: '800', color: colors.text, marginVertical: space.xs },
  statLabel: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  actionsContainer: { gap: space.md },
  actionBtn: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', padding: space.lg, borderRadius: radius.md, gap: space.md },
  actionBtnGreen: { backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', padding: space.lg, borderRadius: radius.md, gap: space.md },
  actionBtnText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  error: { color: colors.danger, marginBottom: space.lg, fontSize: 16, textAlign: 'center' },
  btnSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: space.md, borderRadius: radius.md, marginTop: space.sm },
  btnTextSecondary: { color: colors.text, fontWeight: '600' },
});
