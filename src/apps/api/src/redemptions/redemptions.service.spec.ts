import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RedemptionsService } from './redemptions.service';

const mockPrisma = {
  kiosk: { findUnique: jest.fn() },
  owner: { findUnique: jest.fn() },
  visit: { count: jest.fn() },
  promotion: { findMany: jest.fn(), findUnique: jest.fn() },
  redemption: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
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

const redemptionForOwner = (overrides: any = {}) => ({
  id: 'redemption-1',
  code: 'ABC123',
  status: 'PENDING',
  expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  redeemedAt: null,
  player: { id: 'player-1', name: 'Sofi' },
  promotion: {
    id: 'promo-1',
    title: 'Coca gratis',
    description: 'Una gaseosa chica',
    rewardType: 'FREE_PRODUCT',
    rewardValue: null,
    rewardProduct: 'Coca',
    kiosk: { id: 'k1', name: 'Yes Centro', ownerId: 'owner-1' },
  },
  ...overrides,
});

describe('RedemptionsService', () => {
  let service: RedemptionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.owner.findUnique.mockResolvedValue({
      id: 'owner-1',
      status: 'VALIDADO',
    });
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
      mockPrisma.visit.count.mockResolvedValue(2);
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
      mockPrisma.visit.count.mockResolvedValue(1);

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
      mockPrisma.redemption.findFirst.mockResolvedValue(null);
      mockPrisma.redemption.findUnique.mockResolvedValue(null);
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
      const msLeft = new Date(res.expiresAt).getTime() - Date.now();
      expect(msLeft).toBeGreaterThan(9 * 60 * 1000);
      expect(msLeft).toBeLessThanOrEqual(10 * 60 * 1000);
    });
  });

  describe('validateByOwner', () => {
    it('lanza ForbiddenException si el owner no está validado', async () => {
      mockPrisma.owner.findUnique.mockResolvedValue({
        id: 'owner-1',
        status: 'PENDIENTE_VALIDACION',
      });

      await expect(service.validateByOwner('ABC123', 'owner-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.redemption.findUnique).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si el código no existe', async () => {
      mockPrisma.redemption.findUnique.mockResolvedValue(null);

      await expect(service.validateByOwner('ABC123', 'owner-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza ForbiddenException si el canje pertenece a otro owner', async () => {
      mockPrisma.redemption.findUnique.mockResolvedValue(
        redemptionForOwner({
          promotion: {
            ...redemptionForOwner().promotion,
            kiosk: { id: 'k1', name: 'Yes Centro', ownerId: 'owner-2' },
          },
        }),
      );

      await expect(service.validateByOwner('ABC123', 'owner-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lanza BadRequestException si el código ya fue usado', async () => {
      mockPrisma.redemption.findUnique.mockResolvedValue(
        redemptionForOwner({ status: 'REDEEMED', redeemedAt: new Date() }),
      );

      await expect(service.validateByOwner('ABC123', 'owner-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('marca como EXPIRED si el código está vencido', async () => {
      mockPrisma.redemption.findUnique.mockResolvedValue(
        redemptionForOwner({ expiresAt: new Date(Date.now() - 60 * 1000) }),
      );

      await expect(service.validateByOwner('ABC123', 'owner-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.redemption.update).toHaveBeenCalledWith({
        where: { id: 'redemption-1' },
        data: { status: 'EXPIRED' },
      });
    });

    it('marca como REDEEMED y devuelve datos del canje si el código es válido', async () => {
      const pending = redemptionForOwner();
      mockPrisma.redemption.findUnique
        .mockResolvedValueOnce(pending)
        .mockResolvedValueOnce({
          ...pending,
          status: 'REDEEMED',
          redeemedAt: new Date(),
        });
      mockPrisma.redemption.updateMany.mockResolvedValue({ count: 1 });

      const res = await service.validateByOwner(' abc 123 ', 'owner-1');

      expect(mockPrisma.redemption.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { code: 'ABC123' } }),
      );
      expect(mockPrisma.redemption.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'redemption-1',
            status: 'PENDING',
            redeemedAt: null,
          }),
          data: expect.objectContaining({ status: 'REDEEMED' }),
        }),
      );
      expect(res).toMatchObject({
        code: 'ABC123',
        status: 'REDEEMED',
        player: { name: 'Sofi' },
        promotion: {
          title: 'Coca gratis',
          rewardProduct: 'Coca',
          kioskName: 'Yes Centro',
        },
      });
    });

    it('rechaza si otro pedido ya consumió el canje entre lectura y actualización', async () => {
      mockPrisma.redemption.findUnique.mockResolvedValue(redemptionForOwner());
      mockPrisma.redemption.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.validateByOwner('ABC123', 'owner-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
