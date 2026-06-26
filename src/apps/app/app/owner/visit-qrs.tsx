import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { api, OwnerVisitQrs } from '../../lib/api';
import { clearSession } from '../../lib/storage';
import { colors, radius, space } from '../../theme';

export default function OwnerVisitQrsScreen() {
  const router = useRouter();
  const [data, setData] = useState<OwnerVisitQrs | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qrs = await api.ownerVisitQrs();
      setData(qrs);
    } catch (e: any) {
      if (e?.message?.includes('401') || e?.message?.includes('403')) {
        clearSession();
        router.replace('/owner/login');
        return;
      }
      Alert.alert('Error', e?.message ?? 'No se pudieron cargar los QR');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>QR diario</Text>
        <Text style={styles.title}>Visitas por kiosco</Text>
        <Text style={styles.subtitle}>
          Este QR y código cambian cada día. El player puede escanear el QR o ingresar el código del local.
        </Text>
      </View>

      {data.kiosks.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="storefront-outline" size={32} color={colors.muted} />
          <Text style={styles.emptyText}>Todavía no tenés kioscos cargados.</Text>
        </View>
      ) : (
        data.kiosks.map((kiosk) => (
          <View key={kiosk.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kioskName}>{kiosk.name}</Text>
                <Text style={styles.kioskAddress}>
                  {kiosk.address} · {kiosk.city}
                </Text>
              </View>
              <Text style={styles.dateBadge}>{data.date}</Text>
            </View>
            <View style={styles.qrBox}>
              <QRCode
                value={kiosk.visitToken}
                size={220}
                color={colors.navy}
                backgroundColor={colors.card}
              />
            </View>
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Código manual</Text>
              <Text style={styles.visitCode}>{kiosk.visitCode}</Text>
            </View>
          </View>
        ))
      )}

      <Pressable style={styles.refreshButton} onPress={load}>
        <Ionicons name="refresh" size={18} color={colors.white} />
        <Text style={styles.refreshButtonText}>Actualizar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.xs,
  },
  eyebrow: { color: colors.primarySoft, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: colors.white, fontSize: 24, fontWeight: '900' },
  subtitle: { color: '#DCE3EE', fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  kioskName: { color: colors.text, fontSize: 18, fontWeight: '900' },
  kioskAddress: { color: colors.muted, fontSize: 13, marginTop: 2 },
  dateBadge: {
    color: colors.navy,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '800',
  },
  qrBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  codeBox: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: 4,
  },
  codeLabel: { color: colors.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  visitCode: { color: colors.navy, fontSize: 28, fontWeight: '900', letterSpacing: 4 },
  empty: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    alignItems: 'center',
    gap: space.sm,
  },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  refreshButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.xs,
  },
  refreshButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});
