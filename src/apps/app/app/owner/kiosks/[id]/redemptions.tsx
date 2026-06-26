import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../../lib/api';
import type { RedemptionValidation } from '../../../../lib/api';
import { colors, radius, space } from '../../../../theme';

function normalizeCode(value: string) {
  return value.toUpperCase().replace(/\s+/g, '');
}

function rewardText(redemption: RedemptionValidation) {
  const { rewardType, rewardValue, rewardProduct, title } = redemption.promotion;
  if (rewardType === 'FREE_PRODUCT') return rewardProduct ?? title;
  if (rewardType === 'TWO_FOR_ONE') return `2x1 ${rewardProduct ?? title}`;
  if (rewardType === 'DISCOUNT_PCT') return `${rewardValue ?? 0}% de descuento`;
  if (rewardType === 'DISCOUNT_AMOUNT') return `$${rewardValue ?? 0} de descuento`;
  return title;
}

export default function OwnerKioskRedemptions() {
  const params = useLocalSearchParams<{ id: string }>();
  const kioskId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RedemptionValidation | null>(null);

  async function onValidate() {
    const normalized = normalizeCode(code);
    setCode(normalized);
    if (!normalized) {
      setError('Ingresá el código del cliente');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.validateRedemption(normalized);
      if (kioskId && res.promotion.kioskId !== kioskId) {
        setError('Este código corresponde a otro kiosco');
        return;
      }
      setResult(res);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo validar el canje');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Mostrador</Text>
            <Text style={styles.title}>Validar canje</Text>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.label}>Código</Text>
          <TextInput
            style={styles.input}
            placeholder="ABC123"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            value={code}
            onChangeText={(value) => {
              setCode(normalizeCode(value));
              setError(null);
              setResult(null);
            }}
            maxLength={12}
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onValidate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <Text style={styles.buttonText}>Validar</Text>
              </>
            )}
          </Pressable>
        </View>

        {result && (
          <View style={[styles.result, styles.successBox]}>
            <View style={styles.resultTitleRow}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={styles.resultLabel}>Canje válido</Text>
            </View>
            <Text style={styles.reward}>{rewardText(result)}</Text>
            <Text style={styles.resultText}>
              Entregar a {result.player.name} en {result.promotion.kioskName}.
            </Text>
            <Text style={styles.code}>Código {result.code}</Text>
          </View>
        )}

        {error && (
          <View style={[styles.result, styles.errorBox]}>
            <View style={styles.resultTitleRow}>
              <Ionicons name="alert-circle" size={24} color={colors.danger} />
              <Text style={[styles.resultLabel, styles.errorTitle]}>No se pudo validar</Text>
            </View>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flexGrow: 1,
    padding: space.md,
    justifyContent: 'center',
    gap: space.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  backBtn: {
    padding: space.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  panel: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space.lg,
    gap: space.md,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: space.xs,
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
  result: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space.lg,
    gap: space.sm,
  },
  successBox: {
    backgroundColor: '#EAF7F1',
    borderColor: colors.success,
  },
  errorBox: {
    backgroundColor: '#FDECEC',
    borderColor: colors.danger,
  },
  resultTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.xs,
  },
  resultLabel: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '800',
  },
  errorTitle: {
    color: colors.danger,
  },
  reward: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  resultText: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
  },
  errorText: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
  },
  code: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
});
