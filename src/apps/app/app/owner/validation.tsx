import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { colors, radius, space } from '../../theme';

export default function OwnerValidation() {
  const router = useRouter();

  function onLogout() {
    router.replace('/owner/login');
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>⏳</Text>
        <Text style={styles.title}>Cuenta en Revisión</Text>
        <Text style={styles.text}>
          Tu cuenta ha sido creada exitosamente. Un administrador validará tus datos a la brevedad para que puedas comenzar a operar.
        </Text>
        
        <Pressable style={styles.button} onPress={onLogout}>
          <Text style={styles.buttonText}>Volver</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy, justifyContent: 'center', alignItems: 'center', padding: space.xl },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.xxl, alignItems: 'center', width: '100%' },
  icon: { fontSize: 48, marginBottom: space.md },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: space.sm, textAlign: 'center' },
  text: { fontSize: 16, color: colors.muted, textAlign: 'center', marginBottom: space.xl, lineHeight: 24 },
  button: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: space.md, paddingHorizontal: space.xl },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '600' }
});
