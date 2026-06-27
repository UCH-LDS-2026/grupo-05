import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WebQrScanner from '../../components/WebQrScanner';
import { api, RedemptionRedeemed } from '../../lib/api';
import { clearSession } from '../../lib/storage';
import { colors, radius, space } from '../../theme';

function extractCode(raw: string) {
  const value = raw.trim();
  if (!value) return '';

  try {
    const parsed = JSON.parse(value);
    if (typeof parsed?.code === 'string') return parsed.code.trim().toUpperCase();
  } catch {
    // El QR actual contiene solo el código. Se aceptan JSON/URL para compatibilidad futura.
  }

  try {
    const url = new URL(value);
    const queryCode = url.searchParams.get('code') ?? url.searchParams.get('redeem');
    if (queryCode) return queryCode.trim().toUpperCase();
    const lastSegment = url.pathname.split('/').filter(Boolean).pop();
    if (lastSegment) return lastSegment.trim().toUpperCase();
  } catch {
    // No es URL: se trata como código directo.
  }

  return value.toUpperCase();
}

export default function OwnerRedeemScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RedemptionRedeemed | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [cameraModule, setCameraModule] = useState<any>(null);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const scanLocked = useRef(false);

  const normalizedCode = useMemo(() => extractCode(code), [code]);

  useEffect(() => {
    let mounted = true;

    if (Platform.OS === 'web') {
      const hasBrowserCamera = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
      setCameraAvailable(hasBrowserCamera);
      setCameraPermissionGranted(hasBrowserCamera);
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

  async function confirmCode(rawCode = code) {
    const cleanCode = extractCode(rawCode);
    if (!cleanCode) {
      Alert.alert('Código requerido', 'Ingresá o escaneá un código de canje.');
      return;
    }

    setSubmitting(true);
    try {
      const redeemed = await api.ownerRedeemCode(cleanCode);
      setResult(redeemed);
      setCode('');
      setScanning(false);
      Alert.alert(
        'Canje validado',
        `${redeemed.promotion.title}\n${redeemed.promotion.kioskName}\nPlayer: ${redeemed.player.name}`,
      );
    } catch (e: any) {
      if (e?.message?.includes('401') || e?.message?.includes('403')) {
        clearSession();
        router.replace('/owner/login');
        return;
      }
      Alert.alert('No se pudo validar', e?.message ?? 'Revisá el código e intentá de nuevo.');
    } finally {
      setSubmitting(false);
      scanLocked.current = false;
    }
  }

  async function openScanner() {
    setScannerError(null);
    if (Platform.OS === 'web') {
      const hasBrowserCamera = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
      if (!hasBrowserCamera) {
        setCameraAvailable(false);
        setScannerError('Este navegador no permite abrir la cámara. Ingresá el código manualmente.');
        return;
      }
      setCameraAvailable(true);
      setCameraPermissionGranted(true);
      scanLocked.current = false;
      setScanning(true);
      return;
    }
    if (cameraAvailable === null) {
      setScannerError('No se pudo confirmar la cámara. Ingresá el código manualmente.');
      return;
    }
    if (cameraAvailable === false || !cameraModule) {
      setScannerError('No se encontró una cámara disponible. Ingresá el código manualmente.');
      return;
    }
    if (!cameraPermissionGranted) {
      const next = await cameraModule.requestCameraPermissionsAsync();
      if (!next.granted) {
        setScannerError('Permiso de cámara denegado. Ingresá el código manualmente.');
        return;
      }
      setCameraPermissionGranted(true);
    }
    scanLocked.current = false;
    setScanning(true);
  }

  if (scanning) {
    if (Platform.OS === 'web') {
      return (
        <WebQrScanner
          label="Enfocá el QR del cliente"
          disabled={submitting}
          onClose={() => setScanning(false)}
          onManual={() => setScanning(false)}
          onScanned={(data) => {
            if (scanLocked.current || submitting) return;
            scanLocked.current = true;
            void confirmCode(data);
          }}
        />
      );
    }

    const CameraComponent = cameraModule?.CameraView;
    if (!CameraComponent) {
      return (
        <View style={styles.container}>
          <Text style={styles.fallbackText}>No se pudo abrir la cámara. Ingresá el código manualmente.</Text>
        </View>
      );
    }

    return (
      <View style={styles.scannerScreen}>
        <CameraComponent
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onMountError={({ message }: { message?: string }) => {
            setScannerError(message || 'La cámara no pudo iniciar. Ingresá el código manualmente.');
            setScanning(false);
          }}
          onBarcodeScanned={({ data }: { data: string }) => {
            if (scanLocked.current || submitting) return;
            scanLocked.current = true;
            void confirmCode(data);
          }}
        />
        <View style={styles.scannerOverlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scannerText}>Enfocá el QR del cliente</Text>
          <Pressable style={styles.closeScanner} onPress={() => setScanning(false)}>
            <Ionicons name="close" size={22} color={colors.text} />
            <Text style={styles.closeScannerText}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Mostrador</Text>
        <Text style={styles.title}>Validar canje</Text>
        <Text style={styles.subtitle}>
          Escaneá el QR del player o ingresá el código corto que aparece en su pantalla.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Código</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="ABC123"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={32}
          style={styles.input}
          editable={!submitting}
        />

        <View style={styles.actions}>
          <Pressable style={styles.scanButton} onPress={openScanner} disabled={submitting}>
            <Ionicons name="qr-code-outline" size={20} color={colors.navy} />
            <Text style={styles.scanButtonText}>Escanear QR</Text>
          </Pressable>
          <Pressable
            style={[styles.confirmButton, (!normalizedCode || submitting) && styles.buttonDisabled]}
            onPress={() => confirmCode()}
            disabled={!normalizedCode || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.confirmButtonText}>Validar</Text>
            )}
          </Pressable>
        </View>
        {scannerError ? <Text style={styles.fallbackText}>{scannerError}</Text> : null}
      </View>

      {result ? (
        <View style={styles.resultCard}>
          <View style={styles.resultIcon}>
            <Ionicons name="checkmark" size={22} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.resultTitle}>{result.promotion.title}</Text>
            <Text style={styles.resultText}>
              {result.promotion.kioskName} · {result.player.name}
            </Text>
            <Text style={styles.resultCode}>Código {result.code}</Text>
          </View>
        </View>
      ) : null}

      {Platform.OS === 'web' ? (
        <Text style={styles.webHint}>
          En web, el navegador puede pedir permiso de cámara antes de abrir el lector.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: space.lg,
    gap: space.lg,
  },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.xs,
  },
  eyebrow: { color: colors.primarySoft, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: colors.white, fontSize: 26, fontWeight: '900' },
  subtitle: { color: '#DCE3EE', fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  label: { color: colors.text, fontSize: 14, fontWeight: '800' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 3,
  },
  actions: { flexDirection: 'row', gap: space.sm },
  scanButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    backgroundColor: colors.white,
  },
  scanButtonText: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: { opacity: 0.55 },
  confirmButtonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: space.lg,
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
  },
  resultIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  resultText: { color: colors.navySoft, fontSize: 14, marginTop: 2 },
  resultCode: { color: colors.muted, fontSize: 12, marginTop: 4, fontWeight: '700' },
  webHint: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  fallbackText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  scannerScreen: { flex: 1, backgroundColor: colors.navy },
  camera: { flex: 1 },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
    gap: space.lg,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.primarySoft,
    backgroundColor: 'transparent',
  },
  scannerText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  closeScanner: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  closeScannerText: { color: colors.text, fontSize: 15, fontWeight: '800' },
});
