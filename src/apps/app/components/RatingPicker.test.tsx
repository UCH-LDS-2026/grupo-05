import { Ionicons } from '@expo/vector-icons';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RatingPicker } from './RatingPicker';

function iconNames(): string[] {
  return screen.UNSAFE_getAllByType(Ionicons).map((n) => n.props.name as string);
}

describe('<RatingPicker />', () => {
  it('muestra la etiqueta', () => {
    render(<RatingPicker label="Atención" value={0} onChange={() => {}} />);
    expect(screen.getByText('Atención')).toBeOnTheScreen();
  });

  it('llama onChange con el puntaje de la estrella tocada', () => {
    const onChange = jest.fn();
    render(<RatingPicker label="Limpieza" value={0} onChange={onChange} />);

    const stars = screen.UNSAFE_getAllByType(Ionicons);
    expect(stars).toHaveLength(5);

    fireEvent.press(stars[3]); // 4ta estrella → el press sube al Pressable padre

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('refleja el value actual pintando las estrellas llenas', () => {
    render(<RatingPicker label="Precios" value={3} onChange={() => {}} />);
    expect(iconNames()).toEqual([
      'star',
      'star',
      'star',
      'star-outline',
      'star-outline',
    ]);
  });
});
