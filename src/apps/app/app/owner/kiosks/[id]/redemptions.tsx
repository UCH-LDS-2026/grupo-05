import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, space } from '../../../../theme';
import { Ionicons } from '@expo/vector-icons';

export default function RedemptionsPlaceholder() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Validar Canje</Text>
      </View>

      <View style={styles.center}>
        <View style={{ marginBottom: space.lg }}><Ionicons name="construct" size={64} color={colors.muted} /></View>
        <Text style={styles.message}>Módulo en construcción.</Text>
        <Text style={styles.subMessage}>Aquí se implementará la validación de códigos de canje (Joel).</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: space.md },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: space.xl, marginTop: space.sm },
  backBtn: { padding: space.sm, marginRight: space.sm },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.xl },
  message: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: space.sm },
  subMessage: { fontSize: 15, color: colors.muted, textAlign: 'center' },
});
