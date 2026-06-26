import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../lib/auth';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.navy },
            headerTintColor: colors.white,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="owner/login" options={{ title: 'Acceso Dueños', headerShown: true }} />
          <Stack.Screen name="owner/register" options={{ title: 'Registro', headerShown: true }} />
          <Stack.Screen name="owner/validation" options={{ headerShown: false }} />
          <Stack.Screen name="owner/reviews" options={{ title: 'Reseñas' }} />
          <Stack.Screen name="owner/redeem" options={{ title: 'Validar canje' }} />
          <Stack.Screen name="owner/visit-qrs" options={{ title: 'QR de visitas' }} />
          <Stack.Screen name="kiosks/index" options={{ title: 'Spot' }} />
          <Stack.Screen name="kiosks/[id]" options={{ title: 'Kiosco' }} />
          <Stack.Screen name="kiosks/visit-scan" options={{ title: 'Marcar visita' }} />
          <Stack.Screen name="kiosks/redeem" options={{ title: 'Canje' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
