import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { api, RedemptionStart } from '../../../lib/api';
import { colors, radius, space } from '../../../theme';

const TTL_MS = 10 * 60 * 1000;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatCountdown(ms: number) {
  if (ms <= 0) return '00:00';
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${pad(m)}:${pad(s)}`;
}

export default function ActiveRedemptionScreen() {
  const { kioskId, promotionId } = useLocalSearchParams<{
    kioskId: string;
    promotionId: string;
  }>();
  const router = useRouter();

  const [redemption, setRedemption] = useState<RedemptionStart | null>(null);
  const [loading, setLoading] = useState(true);
  const [msLeft, setMsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!kioskId || !promotionId) return;
    api
      .redeemPromo(kioskId, promotionId)
      .then((r) => {
        setRedemption(r);
        const remaining = new Date(r.expiresAt).getTime() - Date.now();
        setMsLeft(Math.max(0, remaining));
      })
      .catch((e) => {
        Alert.alert('Error', e?.message ?? 'No se pudo iniciar el canje');
        router.back();
      })
      .finally(() => setLoading(false));
  }, [kioskId, promotionId]);

  useEffect(() => {
    if (!redemption) return;
    timerRef.current = setInterval(() => {
      const remaining = new Date(redemption.expiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        setMsLeft(0);
        clearInterval(timerRef.current!);
      } else {
        setMsLeft(remaining);
      }
    }, 500);
    return () => clearInterval(timerRef.current!);
  }, [redemption]);

  const expired = msLeft <= 0 && !loading;
  const urgency = msLeft < 60_000; // último minuto → rojo

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Generando código…</Text>
      </View>
    );
  }

  if (!redemption) return null;

  return (
    <View style={styles.container}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={styles.kioskName}>{redemption.promotion.kioskName}</Text>
        <Text style={styles.promoTitle}>{redemption.promotion.title}</Text>
        {redemption.promotion.description ? (
          <Text style={styles.promoDesc}>{redemption.promotion.description}</Text>
        ) : null}
      </View>

      {/* Código */}
      <View style={[styles.codeCard, expired && styles.codeCardExpired]}>
        <Text style={styles.codeLabel}>
          {expired ? 'CÓDIGO EXPIRADO' : 'Mostrá este código al kiosquero'}
        </Text>
        <Text style={[styles.code, expired && styles.codeExpired]}>
          {redemption.code}
        </Text>

        {/* QR */}
        <View style={[styles.qrWrapper, expired && { opacity: 0.3 }]}>
          <QRCode
            value={redemption.code}
            size={180}
            color={colors.navy}
            backgroundColor={colors.card}
          />
        </View>

        {/* Countdown */}
        <View style={[styles.countdownRow, urgency && !expired && styles.countdownUrgent]}>
          <Text style={[styles.countdownLabel, urgency && !expired && styles.countdownLabelUrgent]}>
            {expired ? 'Expirado' : 'Expira en'}
          </Text>
          <Text style={[styles.countdown, urgency && !expired && styles.countdownUrgentText, expired && styles.countdownExpired]}>
            {expired ? '—' : formatCountdown(msLeft)}
          </Text>
        </View>
      </View>

      {expired ? (
        <Pressable
          style={styles.retryBtn}
          onPress={() => {
            setLoading(true);
            setRedemption(null);
            api
              .redeemPromo(kioskId!, promotionId!)
              .then((r) => {
                setRedemption(r);
                setMsLeft(Math.max(0, new Date(r.expiresAt).getTime() - Date.now()));
              })
              .catch((e) => Alert.alert('Error', e?.message ?? 'No se pudo renovar'))
              .finally(() => setLoading(false));
          }}
        >
          <Text style={styles.retryBtnText}>Generar nuevo código</Text>
        </Pressable>
      ) : (
        <Text style={styles.hint}>
          El kiosquero ingresa el código en la app para confirmar el canje.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: space.lg,
    gap: space.lg,
    justifyContent: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.md },
  loadingText: { color: colors.muted, fontSize: 15 },
  header: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: space.xs,
  },
  kioskName: { fontSize: 13, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  promoTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  promoDesc: { fontSize: 14, color: colors.navySoft, textAlign: 'center' },
  codeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.xl,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    gap: space.lg,
  },
  codeCardExpired: { borderColor: colors.border, opacity: 0.8 },
  codeLabel: { fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  code: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.navy,
    letterSpacing: 8,
  },
  codeExpired: { color: colors.muted },
  qrWrapper: {
    padding: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.bg,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
  },
  countdownUrgent: { backgroundColor: '#FFF0ED' },
  countdownLabel: { fontSize: 13, color: colors.muted },
  countdownLabelUrgent: { color: colors.danger },
  countdown: { fontSize: 22, fontWeight: '800', color: colors.text },
  countdownUrgentText: { color: colors.danger },
  countdownExpired: { color: colors.muted },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  retryBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  hint: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
});
