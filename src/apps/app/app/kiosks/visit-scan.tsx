import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../../lib/api';
import { colors, radius, space } from '../../theme';

function extractVisitToken(raw: string) {
  const value = raw.trim();
  if (!value) return '';
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed?.visitToken === 'string') return parsed.visitToken;
  } catch {
    // El QR diario actual contiene el token directo. JSON queda para compatibilidad futura.
  }
  return value;
}

export default function VisitScanScreen() {
  const router = useRouter();
  const { kioskId, kioskName } = useLocalSearchParams<{ kioskId: string; kioskName?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [submitting, setSubmitting] = useState(false);
  const scanLocked = useRef(false);

  async function submit(raw: string) {
    if (!kioskId) return;
    const visitToken = extractVisitToken(raw);
    if (!visitToken) {
      Alert.alert('QR inválido', 'Escaneá el QR diario del kiosco.');
      scanLocked.current = false;
      return;
    }
    setSubmitting(true);
    try {
      await api.addVisit(kioskId, visitToken);
      Alert.alert('Visita registrada', 'La visita se guardó correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('No se pudo registrar', e?.message ?? 'Escaneá el QR diario del kiosco.');
      scanLocked.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  async function requestCamera() {
    const next = await requestPermission();
    if (!next.granted) {
      Alert.alert('Permiso requerido', 'Necesitás habilitar la cámara para escanear el QR.');
    }
  }

  if (!permission?.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Ionicons name="camera-outline" size={42} color={colors.navy} />
        <Text style={styles.permissionTitle}>Escanear QR del kiosco</Text>
        <Text style={styles.permissionText}>
          Para marcar la visita necesitás escanear el QR diario que muestra el dueño en el local.
        </Text>
        <Pressable style={styles.primaryButton} onPress={requestCamera}>
          <Text style={styles.primaryButtonText}>Habilitar cámara</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          if (scanLocked.current || submitting) return;
          scanLocked.current = true;
          void submit(data);
        }}
      />
      <View style={styles.overlay}>
        <View style={styles.topCard}>
          <Text style={styles.eyebrow}>Marcar visita</Text>
          <Text style={styles.title}>{kioskName ?? 'Kiosco'}</Text>
        </View>
        <View style={styles.scanFrame} />
        <Text style={styles.scanText}>
          {submitting ? 'Registrando visita…' : 'Enfocá el QR diario del mostrador'}
        </Text>
        {submitting ? <ActivityIndicator color={colors.white} /> : null}
        <Pressable style={styles.closeButton} onPress={() => router.back()} disabled={submitting}>
          <Ionicons name="close" size={20} color={colors.text} />
          <Text style={styles.closeButtonText}>Cancelar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
    gap: space.lg,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  topCard: {
    position: 'absolute',
    top: space.xl,
    left: space.lg,
    right: space.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
    alignItems: 'center',
  },
  eyebrow: { color: colors.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 2 },
  scanFrame: {
    width: 240,
    height: 240,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.primarySoft,
  },
  scanText: { color: colors.white, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  closeButton: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  closeButtonText: { color: colors.text, fontSize: 15, fontWeight: '800' },
  permissionScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.md,
  },
  permissionTitle: { color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  permissionText: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    marginTop: space.sm,
  },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});
