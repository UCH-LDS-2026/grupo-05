import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { colors } from '../theme';

/** Estrellas de solo lectura (acepta promedios con media estrella). */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const name =
          value >= i ? 'star' : value >= i - 0.5 ? 'star-half' : 'star-outline';
        return (
          <Ionicons
            key={i}
            name={name as any}
            size={size}
            color={value >= i - 0.5 ? colors.star : colors.starEmpty}
          />
        );
      })}
    </View>
  );
}
