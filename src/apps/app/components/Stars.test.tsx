import { Ionicons } from '@expo/vector-icons';
import { render, screen } from '@testing-library/react-native';
import { Stars } from './Stars';

// Nombres de los 5 íconos renderizados, en orden.
function iconNames(): string[] {
  return screen.UNSAFE_getAllByType(Ionicons).map((n) => n.props.name as string);
}

describe('<Stars />', () => {
  it('renderiza 5 estrellas llenas con value=5', () => {
    render(<Stars value={5} />);
    expect(iconNames()).toEqual(['star', 'star', 'star', 'star', 'star']);
  });

  it('renderiza media estrella con un promedio .5', () => {
    render(<Stars value={3.5} />);
    expect(iconNames()).toEqual([
      'star',
      'star',
      'star',
      'star-half',
      'star-outline',
    ]);
  });

  it('renderiza todas vacías con value=0', () => {
    render(<Stars value={0} />);
    expect(iconNames().every((n) => n === 'star-outline')).toBe(true);
    expect(iconNames()).toHaveLength(5);
  });
});
