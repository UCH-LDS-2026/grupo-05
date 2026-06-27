import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import WebQrScanner from '../../components/WebQrScanner';
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
  const [submitting, setSubmitting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [cameraModule, setCameraModule] = useState<any>(null);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [visitCode, setVisitCode] = useState('');
  const scanLocked = useRef(false);

  useEffect(() => {
    let mounted = true;

    if (Platform.OS === 'web') {
      const hasBrowserCamera = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
      setCameraAvailable(hasBrowserCamera);
      setCameraPermissionGranted(hasBrowserCamera);
      setManualMode(!hasBrowserCamera);
      return () => {
        mounted = false;
      };
    }

    import('expo-camera')
      .then(async (module) => {
        if (!mounted) return;
        setCameraModule(module);
        setCameraAvailable(await module.CameraView.isAvailableAsync());
      })
      .catch(() => {
        if (mounted) setCameraAvailable(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function submitVisit(proof: { visitToken?: string; visitCode?: string }) {
    if (!kioskId) return;
    setSubmitting(true);
    try {
      await api.addVisit(kioskId, proof);
      Alert.alert('Visita registrada', 'La visita se guardó correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('No se pudo registrar', e?.message ?? 'Escaneá el QR o ingresá el código diario del kiosco.');
      scanLocked.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  async function submitScan(raw: string) {
    const visitToken = extractVisitToken(raw);
    if (!visitToken) {
      Alert.alert('QR inválido', 'Escaneá el QR diario del kiosco.');
      scanLocked.current = false;
      return;
    }
    await submitVisit({ visitToken });
  }

  async function submitManualCode() {
    const cleanCode = visitCode.trim().toUpperCase();
    if (!cleanCode) {
      Alert.alert('Código requerido', 'Ingresá el código diario que muestra el dueño.');
      return;
    }
    await submitVisit({ visitCode: cleanCode });
  }

  async function requestCamera() {
    setCameraError(null);
    if (Platform.OS === 'web') {
      const hasBrowserCamera = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
      setCameraAvailable(hasBrowserCamera);
      setCameraPermissionGranted(hasBrowserCamera);
      setManualMode(!hasBrowserCamera);
      if (!hasBrowserCamera) {
        setCameraError('Este navegador no permite abrir la cámara. Ingresá el código manualmente.');
      }
      return;
    }
    if (!cameraModule) {
      setCameraError('No se encontró una cámara disponible.');
      setManualMode(true);
      return;
    }
    const next = await cameraModule.requestCameraPermissionsAsync();
    if (!next.granted) {
      Alert.alert('Permiso requerido', 'Necesitás habilitar la cámara para escanear el QR.');
      setManualMode(true);
      return;
    }
    setCameraPermissionGranted(true);
    setManualMode(false);
  }

  if (cameraAvailable === null) {
    return (
      <View style={styles.permissionScreen}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.permissionText}>Preparando la cámara...</Text>
        <ManualCodeForm
          value={visitCode}
          onChangeText={setVisitCode}
          onSubmit={submitManualCode}
          submitting={submitting}
        />
      </View>
    );
  }

  if (manualMode || !cameraPermissionGranted) {
    return (
      <View style={styles.permissionScreen}>
        <Ionicons name="camera-outline" size={42} color={colors.navy} />
        <Text style={styles.permissionTitle}>Marcar visita</Text>
        <Text style={styles.permissionText}>
          Escaneá el QR diario del local o ingresá el código que muestra el dueño.
        </Text>
        <ManualCodeForm
          value={visitCode}
          onChangeText={setVisitCode}
          onSubmit={submitManualCode}
          submitting={submitting}
        />
        {!cameraPermissionGranted ? (
          <Pressable style={styles.secondaryButton} onPress={requestCamera}>
            <Text style={styles.secondaryButtonText}>Habilitar cámara</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.secondaryButton} onPress={() => setManualMode(false)}>
            <Text style={styles.secondaryButtonText}>Escanear QR</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (cameraAvailable === false || cameraError) {
    return (
      <View style={styles.permissionScreen}>
        <Ionicons name="alert-circle-outline" size={42} color={colors.navy} />
        <Text style={styles.permissionTitle}>No se pudo abrir la cámara</Text>
        <Text style={styles.permissionText}>
          {cameraError ??
            (Platform.OS === 'web'
              ? 'Revisá que el navegador tenga cámara disponible y que la app esté abierta en localhost o HTTPS.'
              : 'Revisá los permisos de cámara del dispositivo e intentá de nuevo.')}
        </Text>
        <Pressable style={styles.primaryButton} onPress={requestCamera}>
          <Text style={styles.primaryButtonText}>Reintentar</Text>
        </Pressable>
        <ManualCodeForm
          value={visitCode}
          onChangeText={setVisitCode}
          onSubmit={submitManualCode}
          submitting={submitting}
        />
      </View>
    );
  }

  const CameraComponent = cameraModule?.CameraView;

  if (Platform.OS === 'web') {
    return (
      <WebQrScanner
        label={submitting ? 'Registrando visita...' : 'Enfocá el QR diario del mostrador'}
        disabled={submitting}
        onClose={() => router.back()}
        onManual={() => setManualMode(true)}
        onScanned={(data) => {
          if (scanLocked.current || submitting) return;
          scanLocked.current = true;
          void submitScan(data);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {CameraComponent ? (
        <CameraComponent
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onMountError={({ message }: { message?: string }) =>
            setCameraError(message || 'La cámara no pudo iniciar.')
          }
          onBarcodeScanned={({ data }: { data: string }) => {
            if (scanLocked.current || submitting) return;
            scanLocked.current = true;
            void submitScan(data);
          }}
        />
      ) : null}
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
        <Pressable style={styles.manualButton} onPress={() => setManualMode(true)} disabled={submitting}>
          <Ionicons name="keypad-outline" size={20} color={colors.text} />
          <Text style={styles.manualButtonText}>Ingresar código</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ManualCodeForm({
  value,
  onChangeText,
  onSubmit,
  submitting,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <View style={styles.manualCard}>
      <Text style={styles.manualLabel}>Código diario</Text>
      <TextInput
        value={value}
        onChangeText={(next) => onChangeText(next.toUpperCase())}
        placeholder="ABC123"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={12}
        style={styles.manualInput}
        editable={!submitting}
      />
      <Pressable
        style={[styles.primaryButton, (!value.trim() || submitting) && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={!value.trim() || submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>Registrar visita</Text>
        )}
      </Pressable>
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
  manualButton: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  manualButtonText: { color: colors.text, fontSize: 15, fontWeight: '800' },
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
  secondaryButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    backgroundColor: colors.white,
  },
  secondaryButtonText: { color: colors.navy, fontSize: 16, fontWeight: '800' },
  buttonDisabled: { opacity: 0.55 },
  manualCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
  },
  manualLabel: { color: colors.text, fontSize: 14, fontWeight: '800' },
  manualInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
  },
});
