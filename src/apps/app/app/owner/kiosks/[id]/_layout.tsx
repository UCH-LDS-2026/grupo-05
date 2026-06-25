import { Slot } from 'expo-router';
import { View } from 'react-native';

// Usamos Slot en lugar de Stack para evitar un 4to nivel de Stack anidado.
// En React Native Web, para evitar que la altura colapse a 0, 
// es importante envolver el Slot en un View con flex: 1.
export default function KioskDetailLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Slot />
    </View>
  );
}
