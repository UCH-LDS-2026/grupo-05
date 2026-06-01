import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RatingPicker } from '../../components/RatingPicker';
import { Stars } from '../../components/Stars';
import { api, KioskDetail, ReviewInput } from '../../lib/api';
import { colors, radius, space } from '../../theme';

const CATS: { key: keyof Omit<ReviewInput, 'comment'>; label: string }[] = [
  { key: 'attention', label: 'Atención' },
  { key: 'variety', label: 'Variedad' },
  { key: 'cleanliness', label: 'Limpieza' },
  { key: 'prices', label: 'Precios' },
  { key: 'ambiance', label: 'Ambiente' },
];

function overall(r: { attention: number; variety: number; cleanliness: number; prices: number; ambiance: number }) {
  return (r.attention + r.variety + r.cleanliness + r.prices + r.ambiance) / 5;
}

export default function KioskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [kiosk, setKiosk] = useState<KioskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingVisit, setSavingVisit] = useState(false);
  const [savingReview, setSavingReview] = useState(false);

  const [form, setForm] = useState<ReviewInput>({
    attention: 0,
    variety: 0,
    cleanliness: 0,
    prices: 0,
    ambiance: 0,
    comment: '',
  });

  const load = useCallback(() => {
    if (!id) return;
    return api
      .kiosk(id)
      .then((k) => {
        setKiosk(k);
        if (k.myReview) {
          setForm({
            attention: k.myReview.attention,
            variety: k.myReview.variety,
            cleanliness: k.myReview.cleanliness,
            prices: k.myReview.prices,
            ambiance: k.myReview.ambiance,
            comment: k.myReview.comment ?? '',
          });
        }
      })
      .catch((e) => Alert.alert('Error', e?.message ?? 'No se pudo cargar'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onVisit() {
    if (!id) return;
    setSavingVisit(true);
    try {
      await api.addVisit(id);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo registrar la visita');
    } finally {
      setSavingVisit(false);
    }
  }

  async function onSaveReview() {
    if (!id) return;
    const incomplete = CATS.some((c) => form[c.key] < 1);
    if (incomplete) {
      Alert.alert('Faltan puntajes', 'Puntuá las 5 categorías (1 a 5 estrellas).');
      return;
    }
    setSavingReview(true);
    try {
      await api.saveReview(id, { ...form, comment: form.comment?.trim() || undefined });
      await load();
      Alert.alert('¡Listo!', 'Tu reseña se guardó.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar la reseña');
    } finally {
      setSavingReview(false);
    }
  }

  if (loading || !kiosk) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      {/* Cabecera */}
      <View style={styles.header}>
        <View style={styles.headRow}>
          <Text style={styles.name}>{kiosk.name}</Text>
          {kiosk.brand && (
            <View style={styles.brandBadge}>
              <Text style={styles.brandText}>{kiosk.brand}</Text>
            </View>
          )}
        </View>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={15} color={colors.muted} />
          <Text style={styles.address}>
            {kiosk.address} · {kiosk.city}
          </Text>
        </View>

        <View style={styles.statRow}>
          <View style={styles.stat}>
            {kiosk.avgRating != null ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Stars value={kiosk.avgRating} size={18} />
                  <Text style={styles.statBig}>{kiosk.avgRating.toFixed(1)}</Text>
                </View>
                <Text style={styles.statLabel}>{kiosk.reviewCount} reseñas</Text>
              </>
            ) : (
              <Text style={styles.statLabel}>Sin reseñas</Text>
            )}
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statBig}>{kiosk.myVisits}</Text>
            <Text style={styles.statLabel}>tus visitas</Text>
          </View>
        </View>

        {kiosk.tags.length > 0 && (
          <View style={styles.tags}>
            {kiosk.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        <Pressable
          style={[styles.visitBtn, savingVisit && { opacity: 0.7 }]}
          onPress={onVisit}
          disabled={savingVisit}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.white} />
          <Text style={styles.visitBtnText}>
            {savingVisit ? 'Registrando…' : 'Marcar visita'}
          </Text>
        </Pressable>
      </View>

      {/* Formulario de reseña */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {kiosk.myReview ? 'Editar tu reseña' : 'Dejá tu reseña'}
        </Text>
        {CATS.map((c) => (
          <RatingPicker
            key={c.key}
            label={c.label}
            value={form[c.key]}
            onChange={(v) => setForm((f) => ({ ...f, [c.key]: v }))}
          />
        ))}
        <TextInput
          style={styles.comment}
          placeholder="Contá tu experiencia (opcional)"
          placeholderTextColor={colors.muted}
          value={form.comment}
          onChangeText={(t) => setForm((f) => ({ ...f, comment: t }))}
          multiline
        />
        <Pressable
          style={[styles.saveBtn, savingReview && { opacity: 0.7 }]}
          onPress={onSaveReview}
          disabled={savingReview}
        >
          <Text style={styles.saveBtnText}>
            {savingReview ? 'Guardando…' : kiosk.myReview ? 'Actualizar reseña' : 'Publicar reseña'}
          </Text>
        </Pressable>
      </View>

      {/* Reseñas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reseñas ({kiosk.reviews.length})</Text>
        {kiosk.reviews.length === 0 ? (
          <Text style={styles.empty}>Todavía no hay reseñas. ¡Sé el primero!</Text>
        ) : (
          kiosk.reviews.map((r) => (
            <View key={r.id} style={styles.review}>
              <View style={styles.reviewHead}>
                <Text style={styles.author}>{r.author}</Text>
                <Stars value={overall(r)} size={14} />
              </View>
              {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.sm,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, flexShrink: 1 },
  brandBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  brandText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  address: { color: colors.muted, fontSize: 14 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: space.md,
    marginTop: space.xs,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statBig: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.muted },
  divider: { width: 1, height: 32, backgroundColor: colors.border },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.xs },
  tag: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: { fontSize: 12, color: colors.navySoft },
  visitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space.md,
    marginTop: space.sm,
  },
  visitBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: space.sm },
  comment: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
    marginTop: space.sm,
  },
  saveBtn: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
    marginTop: space.md,
  },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  empty: { color: colors.muted, fontStyle: 'italic' },
  review: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: space.md,
    gap: 4,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  author: { fontWeight: '700', color: colors.text },
  reviewComment: { color: colors.navySoft, fontSize: 14, lineHeight: 20 },
});
