import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stars } from '../../components/Stars';
import { api, KioskListItem } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { colors, radius, space } from '../../theme';
import KiosksMap from '../../components/KiosksMap';

export default function KiosksScreen() {
  const { player, logout } = useAuth();
  const router = useRouter();
  const [kiosks, setKiosks] = useState<KioskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const load = useCallback(() => {
    setError(null);
    api
      .kiosks()
      .then(setKiosks)
      .catch((e) => setError(e?.message ?? 'Error al cargar kioscos'))
      .finally(() => setLoading(false));
  }, []);

  // Recarga al volver al listado (ej: después de visitar/reseñar).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function onLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={onLogout} hitSlop={8} style={{ marginRight: 4 }}>
              <Ionicons name="log-out-outline" size={22} color={colors.white} />
            </Pressable>
          ),
        }}
      />

      <View style={styles.greeting}>
        <Text style={styles.hi}>Hola, {player?.name} 👋</Text>
        <Text style={styles.sub}>Descubrí y puntuá kioscos cerca tuyo.</Text>
      </View>

      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabButton, viewMode === 'list' && styles.tabActive]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons name="list" size={16} color={viewMode === 'list' ? colors.white : colors.muted} />
          <Text style={[styles.tabText, viewMode === 'list' && styles.tabTextActive]}>Lista</Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, viewMode === 'map' && styles.tabActive]}
          onPress={() => setViewMode('map')}
        >
          <Ionicons name="map" size={16} color={viewMode === 'map' ? colors.white : colors.muted} />
          <Text style={[styles.tabText, viewMode === 'map' && styles.tabTextActive]}>Mapa</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator
          color={colors.primary}
          size="large"
          style={{ marginTop: space.xxl }}
        />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={load} style={styles.retry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : viewMode === 'list' ? (
        <FlatList
          data={kiosks}
          keyExtractor={(k) => k.id}
          contentContainerStyle={{ padding: space.lg, gap: space.md }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/kiosks/${item.id}`)}
            >
              <View style={styles.cardHead}>
                <Text style={styles.name}>{item.name}</Text>
                {item.brand && (
                  <View style={styles.brandBadge}>
                    <Text style={styles.brandText}>{item.brand}</Text>
                  </View>
                )}
              </View>

              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color={colors.muted} />
                <Text style={styles.address}>{item.address}</Text>
              </View>

              {item.tags.length > 0 && (
                <View style={styles.tags}>
                  {item.tags.map((t) => (
                    <View key={t} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.metaRow}>
                {item.avgRating != null ? (
                  <View style={styles.ratingRow}>
                    <Stars value={item.avgRating} />
                    <Text style={styles.ratingNum}>{item.avgRating.toFixed(1)}</Text>
                    <Text style={styles.metaMuted}>· {item.reviewCount} reseñas</Text>
                  </View>
                ) : (
                  <Text style={styles.metaMuted}>Sin reseñas todavía</Text>
                )}
                <View style={styles.visitRow}>
                  <Ionicons name="walk-outline" size={15} color={colors.muted} />
                  <Text style={styles.metaMuted}>{item.visitCount}</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      ) : (
        <KiosksMap kiosks={kiosks} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  greeting: {
    backgroundColor: colors.navy,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    paddingTop: space.sm,
  },
  hi: { color: colors.white, fontSize: 20, fontWeight: '700' },
  sub: { color: colors.white, opacity: 0.75, marginTop: 2 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderColor: colors.border,
    padding: space.sm,
    justifyContent: 'center',
    gap: space.md,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    gap: space.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontWeight: '600',
    color: colors.muted,
    fontSize: 14,
  },
  tabTextActive: {
    color: colors.white,
  },
  center: { alignItems: 'center', marginTop: space.xxl, gap: space.md },
  error: { color: colors.danger, fontSize: 15 },
  retry: {
    backgroundColor: colors.primary,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.md,
  },
  retryText: { color: colors.white, fontWeight: '600' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 17, fontWeight: '700', color: colors.text, flexShrink: 1 },
  brandBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  brandText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  address: { color: colors.muted, fontSize: 13 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  tag: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: { fontSize: 12, color: colors.navySoft },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xs,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingNum: { fontWeight: '700', color: colors.text },
  metaMuted: { color: colors.muted, fontSize: 13 },
  visitRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
