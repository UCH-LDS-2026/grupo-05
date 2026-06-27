import { Ionicons } from '@expo/vector-icons';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '../theme';

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string; raw_value?: string; data?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

type WebQrScannerProps = {
  label: string;
  disabled?: boolean;
  onClose: () => void;
  onManual?: () => void;
  onScanned: (data: string) => void;
};

export default function WebQrScanner({ label, disabled = false, onClose, onManual, onScanned }: WebQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onScannedRef = useRef(onScanned);
  const disabledRef = useRef(disabled);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScannedRef.current = onScanned;
  }, [onScanned]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;
    let frameId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let scanningLocked = false;

    async function start() {
      try {
        const mediaDevices = window.navigator?.mediaDevices;
        if (!mediaDevices?.getUserMedia) {
          throw new Error('Este navegador no permite abrir la cámara. Ingresá el código manualmente.');
        }

        const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
        if (!Detector) {
          throw new Error('Este navegador no puede leer QR desde video. Ingresá el código manualmente.');
        }

        const detector = new Detector({ formats: ['qr_code'] });
        stream = await mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        });

        if (!active) return;
        const video = videoRef.current;
        if (!video) {
          throw new Error('No se pudo montar el visor de cámara. Ingresá el código manualmente.');
        }

        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        if (!active) return;
        setReady(true);

        const scan = async () => {
          if (!active || scanningLocked) return;

          try {
            if (!disabledRef.current && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
              const detections = await detector.detect(video);
              const raw = detections[0]?.rawValue ?? detections[0]?.raw_value ?? detections[0]?.data;
              if (raw) {
                scanningLocked = true;
                onScannedRef.current(String(raw));
                return;
              }
            }
          } catch {
            // Algunos frames iniciales pueden fallar mientras el video estabiliza.
          }

          timeoutId = setTimeout(() => {
            frameId = window.requestAnimationFrame(scan);
          }, 250);
        };

        void scan();
      } catch (e: any) {
        if (active) {
          setError(e?.message ?? 'No se pudo abrir la cámara. Ingresá el código manualmente.');
        }
      }
    }

    void start();

    return () => {
      active = false;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      if (timeoutId !== null) clearTimeout(timeoutId);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <View style={styles.scannerScreen}>
      {ReactCreateElementVideo({ ref: videoRef })}
      <View style={styles.scannerOverlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.scannerText}>
          {error ?? (ready ? label : 'Abriendo cámara...')}
        </Text>
        {!ready && !error ? <ActivityIndicator color={colors.white} /> : null}
        <Pressable style={styles.closeScanner} onPress={onClose}>
          <Ionicons name="close" size={22} color={colors.text} />
          <Text style={styles.closeScannerText}>Cerrar</Text>
        </Pressable>
        {onManual ? (
          <Pressable style={styles.closeScanner} onPress={onManual}>
            <Ionicons name="keypad-outline" size={22} color={colors.text} />
            <Text style={styles.closeScannerText}>Ingresar código</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ReactCreateElementVideo({ ref }: { ref: RefObject<HTMLVideoElement | null> }) {
  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        backgroundColor: colors.navy,
      }}
    />
  );
}

const styles = StyleSheet.create({
  scannerScreen: { flex: 1, backgroundColor: colors.navy },
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
  scannerText: { color: colors.white, fontSize: 16, fontWeight: '800', textAlign: 'center' },
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
