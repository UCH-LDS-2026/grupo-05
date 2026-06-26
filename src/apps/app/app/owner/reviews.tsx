import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stars } from '../../components/Stars';
import { api, OwnerReviewKiosk, OwnerReviews, ReviewItem } from '../../lib/api';
import { clearSession, getOwner } from '../../lib/storage';
import { colors, radius, space } from '../../theme';

const CATS: { key: keyof Pick<ReviewItem, 'attention' | 'variety' | 'cleanliness' | 'prices' | 'ambiance'>; label: string }[] = [
  { key: 'attention', label: 'Atención' },
  { key: 'variety', label: 'Variedad' },
  { key: 'cleanliness', label: 'Limpieza' },
  { key: 'prices', label: 'Precios' },
  { key: 'ambiance', label: 'Ambiente' },
];

function overall(r: ReviewItem) {
  return (r.attention + r.variety + r.cleanliness + r.prices + r.ambiance) / 5;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function EmptyState() {
  return (
    <View style={styles.emptyBox}>
      <Ionicons name="chatbubble-ellipses-outline" size={30} color={colors.muted} />
      <Text style={styles.emptyTitle}>Todavía no recibiste reseñas</Text>
      <Text style={styles.emptyText}>
        Cuando los players opinen sobre tus kioscos, vas a ver acá el detalle por local y por categoría.
      </Text>
    </View>
  );
}

function ReviewCard({ review }: { review: ReviewItem }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.author}>{review.author}</Text>
          <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
        </View>
        <View style={styles.reviewScore}>
          <Stars value={overall(review)} size={15} />
          <Text style={styles.reviewScoreText}>{overall(review).toFixed(1)}</Text>
        </View>
      </View>

      {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}

      <View style={styles.catGrid}>
        {CATS.map((cat) => (
          <View key={cat.key} style={styles.catPill}>
            <Text style={styles.catLabel}>{cat.label}</Text>
            <Text style={styles.catValue}>{review[cat.key]}/5</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function KioskBlock({ kiosk }: { kiosk: OwnerReviewKiosk }) {
  return (
    <View style={styles.kioskBlock}>
      <View style={styles.kioskHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kioskName}>{kiosk.name}</Text>
          <Text style={styles.kioskAddress}>
            {kiosk.address} · {kiosk.city}
          </Text>
        </View>
        <View style={styles.kioskMetric}>
          <Text style={styles.kioskMetricValue}>
            {kiosk.avgRating == null ? '-' : kiosk.avgRating.toFixed(1)}
          </Text>
          <Text style={styles.kioskMetricLabel}>{kiosk.reviewCount} reseñas</Text>
        </View>
      </View>

      {kiosk.reviews.length === 0 ? (
        <Text style={styles.noReviews}>Este kiosco todavía no tiene reseñas.</Text>
      ) : (
        <View style={{ gap: space.sm }}>
          {kiosk.reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function OwnerReviewsScreen() {
  const router = useRouter();
  const [data, setData] = useState<OwnerReviews | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const owner = getOwner();

  const load = useCallback(async () => {
    try {
      const reviews = await api.ownerReviews();
      setData(reviews);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudieron cargar las reseñas');
      if (e?.message?.includes('401') || e?.message?.includes('403')) {
        clearSession();
        router.replace('/owner/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const kiosksWithReviews = useMemo(
    () => data?.kiosks.filter((kiosk) => kiosk.reviewCount > 0).length ?? 0,
    [data],
  );

  function onLogout() {
    clearSession();
    router.replace('/owner/login');
  }

  if (loading || !data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.eyebrow}>Panel de dueño</Text>
            <Text style={styles.title}>Reseñas recibidas</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.text} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          {owner?.name ? `${owner.name}, ` : ''}seguí lo que opinan los players sobre tus locales.
        </Text>

        <Pressable style={styles.redeemShortcut} onPress={() => router.push('/owner/redeem')}>
          <Ionicons name="qr-code-outline" size={20} color={colors.navy} />
          <Text style={styles.redeemShortcutText}>Validar canje por código o QR</Text>
        </Pressable>

        <Pressable style={styles.redeemShortcut} onPress={() => router.push('/owner/visit-qrs')}>
          <Ionicons name="scan-outline" size={20} color={colors.navy} />
          <Text style={styles.redeemShortcutText}>Mostrar QR diario de visitas</Text>
        </Pressable>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{data.summary.reviewCount}</Text>
            <Text style={styles.summaryLabel}>reseñas</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {data.summary.avgRating == null ? '-' : data.summary.avgRating.toFixed(1)}
            </Text>
            <Text style={styles.summaryLabel}>promedio</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {kiosksWithReviews}/{data.summary.kioskCount}
            </Text>
            <Text style={styles.summaryLabel}>con feedback</Text>
          </View>
        </View>
      </View>

      {data.summary.reviewCount === 0 ? (
        <EmptyState />
      ) : (
        data.kiosks.map((kiosk) => <KioskBlock key={kiosk.id} kiosk={kiosk} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg },
  loading: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  eyebrow: { color: colors.primarySoft, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: colors.white, fontSize: 24, fontWeight: '800', marginTop: 2 },
  subtitle: { color: '#DCE3EE', fontSize: 14, lineHeight: 20 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemShortcut: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  redeemShortcutText: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  summaryGrid: { flexDirection: 'row', gap: space.sm },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.md,
    padding: space.md,
    minHeight: 74,
    justifyContent: 'center',
  },
  summaryValue: { color: colors.white, fontSize: 22, fontWeight: '800' },
  summaryLabel: { color: '#DCE3EE', fontSize: 12, marginTop: 2 },
  kioskBlock: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.md,
  },
  kioskHead: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  kioskName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  kioskAddress: { color: colors.muted, fontSize: 13, marginTop: 2 },
  kioskMetric: {
    alignItems: 'flex-end',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minWidth: 88,
  },
  kioskMetricValue: { color: colors.text, fontSize: 18, fontWeight: '800' },
  kioskMetricLabel: { color: colors.muted, fontSize: 11 },
  noReviews: { color: colors.muted, fontStyle: 'italic' },
  reviewCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  author: { color: colors.text, fontSize: 15, fontWeight: '700' },
  reviewDate: { color: colors.muted, fontSize: 12, marginTop: 2 },
  reviewScore: { alignItems: 'flex-end', gap: 2 },
  reviewScoreText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  comment: { color: colors.navySoft, fontSize: 14, lineHeight: 20 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  catPill: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 5,
  },
  catLabel: { color: colors.muted, fontSize: 12 },
  catValue: { color: colors.text, fontSize: 12, fontWeight: '700' },
  emptyBox: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    alignItems: 'center',
    gap: space.sm,
  },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
