import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RedemptionsService } from './redemptions.service';

const mockPrisma = {
  kiosk: { findUnique: jest.fn() },
  visit: { count: jest.fn() },
  promotion: { findMany: jest.fn(), findUnique: jest.fn() },
  redemption: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
};

const promoConRegla = (minVisits: number | null) => ({
  id: 'promo-1',
  title: 'Coca gratis',
  description: 'desc',
  active: true,
  kioskId: 'k1',
  kiosk: { name: 'Yes Centro' },
  rules: minVisits == null ? [] : [{ type: 'FREQUENCY', minVisits }],
});

describe('RedemptionsService', () => {
  let service: RedemptionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RedemptionsService(mockPrisma as any);
  });

  describe('eligibleForKiosk', () => {
    it('lanza NotFoundException si el kiosco no existe', async () => {
      mockPrisma.kiosk.findUnique.mockResolvedValue(null);
      await expect(service.eligibleForKiosk('k-none', 'p1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devuelve solo las promos para las que el player tiene visitas suficientes', async () => {
      mockPrisma.kiosk.findUnique.mockResolvedValue({ id: 'k1' });
      mockPrisma.visit.count.mockResolvedValue(2); // el player tiene 2 visitas
      mockPrisma.promotion.findMany.mockResolvedValue([
        { id: 'a', title: 'A', description: null, rules: [{ type: 'FREQUENCY', minVisits: 2 }] },
        { id: 'b', title: 'B', description: null, rules: [{ type: 'FREQUENCY', minVisits: 5 }] },
      ]);

      const res = await service.eligibleForKiosk('k1', 'p1');

      expect(res).toHaveLength(1);
      expect(res[0]).toMatchObject({ id: 'a', minVisits: 2, eligible: true });
    });
  });

  describe('startRedemption', () => {
    it('lanza NotFoundException si la promo no existe o está inactiva', async () => {
      mockPrisma.promotion.findUnique.mockResolvedValue(null);
      await expect(service.startRedemption('promo-x', 'p1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza BadRequestException si faltan visitas', async () => {
      mockPrisma.promotion.findUnique.mockResolvedValue(promoConRegla(3));
      mockPrisma.visit.count.mockResolvedValue(1); // 1 < 3

      await expect(service.startRedemption('promo-1', 'p1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('reutiliza un canje activo existente en lugar de crear otro', async () => {
      mockPrisma.promotion.findUnique.mockResolvedValue(promoConRegla(0));
      mockPrisma.visit.count.mockResolvedValue(0);
      const futuro = new Date(Date.now() + 5 * 60 * 1000);
      mockPrisma.redemption.findFirst.mockResolvedValue({
        id: 'r-existente',
        code: 'ABC123',
        expiresAt: futuro,
        redeemedAt: null,
        createdAt: new Date(),
      });

      const res = await service.startRedemption('promo-1', 'p1');

      expect(res.redemptionId).toBe('r-existente');
      expect(res.code).toBe('ABC123');
      expect(mockPrisma.redemption.create).not.toHaveBeenCalled();
    });

    it('genera un código de 6 caracteres y un canje nuevo cuando no hay activo', async () => {
      mockPrisma.promotion.findUnique.mockResolvedValue(promoConRegla(0));
      mockPrisma.visit.count.mockResolvedValue(0);
      mockPrisma.redemption.findFirst.mockResolvedValue(null); // no hay activo
      mockPrisma.redemption.findUnique.mockResolvedValue(null); // código único
      mockPrisma.redemption.create.mockImplementation(({ data }: any) => ({
        id: 'r-nuevo',
        code: data.code,
        expiresAt: data.expiresAt,
        redeemedAt: null,
        createdAt: new Date(),
      }));

      const res = await service.startRedemption('promo-1', 'p1');

      expect(mockPrisma.redemption.create).toHaveBeenCalledTimes(1);
      expect(res.code).toHaveLength(6);
      expect(res.code).toMatch(/^[A-Z0-9]{6}$/);
      expect(res.promotion).toMatchObject({ kioskName: 'Yes Centro' });
      // expira ~10 min en el futuro
      const msLeft = new Date(res.expiresAt).getTime() - Date.now();
      expect(msLeft).toBeGreaterThan(9 * 60 * 1000);
      expect(msLeft).toBeLessThanOrEqual(10 * 60 * 1000);
    });
  });
});
