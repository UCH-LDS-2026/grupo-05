import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import OwnerPromotions from '../app/owner/kiosks/[id]/promotions';
import { api } from '../lib/api';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'kiosk-1' }),
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
}));

jest.mock('../lib/api', () => ({
  api: {
    ownerKioskPromotions: jest.fn(),
    ownerTogglePromotion: jest.fn(),
    ownerDeletePromotion: jest.fn(),
    ownerCreatePromotion: jest.fn(),
    ownerUpdatePromotion: jest.fn(),
  },
}));

describe('OwnerPromotions Screen', () => {
  const mockPromotions = [
    {
      id: 'promo-1',
      title: 'Coca Gratis',
      description: 'Una Coca bien fria',
      active: true,
      rewardType: 'FREE_PRODUCT',
      rewardProduct: 'Coca-Cola 500ml',
      rewardValue: null,
      rules: [
        {
          id: 'rule-1',
          type: 'FREQUENCY',
          minVisits: 3,
          windowDays: 7,
        },
      ],
      startsAt: null,
      endsAt: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza la lista de promociones correctamente', async () => {
    (api.ownerKioskPromotions as jest.Mock).mockResolvedValue(mockPromotions);

    render(<OwnerPromotions />);

    // Esperar a que cargue
    await waitFor(() => {
      expect(screen.queryByText('Cargando promociones...')).toBeNull();
    });

    expect(screen.getByText('Coca Gratis')).toBeOnTheScreen();
    expect(screen.getByText('Una Coca bien fria')).toBeOnTheScreen();
    expect(screen.getByText('Producto gratis: Coca-Cola 500ml')).toBeOnTheScreen();
    expect(screen.getByText('3 visitas en 7 días')).toBeOnTheScreen();
  });

  it('muestra estado vacio si el kiosco no tiene promociones', async () => {
    (api.ownerKioskPromotions as jest.Mock).mockResolvedValue([]);

    render(<OwnerPromotions />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando promociones...')).toBeNull();
    });

    expect(screen.getByText('Sin promociones')).toBeOnTheScreen();
    expect(screen.getByText('Este kiosco todavía no tiene promociones configuradas.')).toBeOnTheScreen();
  });
});
