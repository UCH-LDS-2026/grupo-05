import { Stack } from 'expo-router';

export default function OwnerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ title: 'Acceso Dueños', headerShown: true }} />
      <Stack.Screen name="register" options={{ title: 'Registro', headerShown: true }} />
      <Stack.Screen name="validation" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ title: 'Panel Owner', headerShown: false }} />
      <Stack.Screen name="kiosks" options={{ headerShown: false }} />
    </Stack>
  );
}
