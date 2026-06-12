import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PromotionsService } from './promotions.service';

// ---------- mocks ----------
const mockPrisma = {
  promotion: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  redemption: { count: jest.fn() },
  visit: { count: jest.fn() },
  kiosk: { findUnique: jest.fn() },
};

const mockPurchases = {
  getPlayerPurchases: jest.fn(),
};

// Promo "base" elegible: sin caps, sin audiencia, sin vigencia, sin reglas.
// Cada test sobreescribe lo que necesita.
function promo(overrides: Record<string, any> = {}) {
  return {
    id: 'promo-1',
    kioskId: 'k1',
    title: 'Promo demo',
    description: null,
    active: true,
    rewardType: 'FREE_PRODUCT',
    rewardValue: null,
    rewardProduct: 'Coca-Cola 237ml',
    audienceDays: [],
    audienceFromHour: null,
    audienceToHour: null,
    capPerPlayer: null,
    capPerPeriod: null,
    capTotal: null,
    periodDays: null,
    startsAt: null,
    endsAt: null,
    rules: [],
    ...overrides,
  };
}

describe('PromotionsService — motor de evaluación', () => {
  let service: PromotionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    // counts en 0 por defecto (sin canjes previos)
    mockPrisma.redemption.count.mockResolvedValue(0);
    mockPrisma.visit.count.mockResolvedValue(0);
    mockPurchases.getPlayerPurchases.mockResolvedValue([]);
    service = new PromotionsService(mockPrisma as any, mockPurchases as any);
  });

  describe('regla FREQUENCY', () => {
    it('es elegible cuando las visitas alcanzan el mínimo', async () => {
      mockPrisma.promotion.findMany.mockResolvedValue([
        promo({ rules: [{ type: 'FREQUENCY', minVisits: 3, windowDays: 7 }] }),
      ]);
      mockPrisma.visit.count.mockResolvedValue(3);

      const [p] = await service.evaluatePromotionsForPlayer('k1', 'player-1');

      expect(p.eligible).toBe(true);
      expect(p.ruleProgress?.[0]).toMatchObject({
        type: 'FREQUENCY',
        current: 3,
        required: 3,
      });
    });

    it('NO es elegible cuando faltan visitas', async () => {
      mockPrisma.promotion.findMany.mockResolvedValue([
        promo({ rules: [{ type: 'FREQUENCY', minVisits: 3, windowDays: 7 }] }),
      ]);
      mockPrisma.visit.count.mockResolvedValue(1);

      const [p] = await service.evaluatePromotionsForPlayer('k1', 'player-1');

      expect(p.eligible).toBe(false);
      expect(p.ruleProgress?.[0]).toMatchObject({ current: 1, required: 3 });
    });
  });

  describe('regla AMOUNT', () => {
    it('es elegible cuando el gasto en la ventana alcanza el mínimo', async () => {
      mockPrisma.promotion.findMany.mockResolvedValue([
        promo({ rules: [{ type: 'AMOUNT', minAmount: 2000, windowDays: 7 }] }),
      ]);
      mockPurchases.getPlayerPurchases.mockResolvedValue([
        { createdAt: new Date(), amount: 1500, products: [] },
        { createdAt: new Date(), amount: 800, products: [] },
      ]);

      const [p] = await service.evaluatePromotionsForPlayer('k1', 'player-1');

      expect(p.eligible).toBe(true); // 2300 >= 2000
    });

    it('NO cuenta compras fuera de la ventana temporal', async () => {
      mockPrisma.promotion.findMany.mockResolvedValue([
        promo({ rules: [{ type: 'AMOUNT', minAmount: 2000, windowDays: 7 }] }),
      ]);
      const hace12dias = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000);
      mockPurchases.getPlayerPurchases.mockResolvedValue([
        { createdAt: hace12dias, amount: 5000, products: [] },
      ]);

      const [p] = await service.evaluatePromotionsForPlayer('k1', 'player-1');

      expect(p.eligible).toBe(false); // la compra vieja no suma
    });
  });

  describe('regla PRODUCTS', () => {
    it('es elegible cuando compró todos los productos requeridos (case-insensitive)', async () => {
      mockPrisma.promotion.findMany.mockResolvedValue([
        promo({
          rules: [{ type: 'PRODUCTS', products: ['Coca-Cola 237ml', 'Alfajor Milka'] }],
        }),
      ]);
      mockPurchases.getPlayerPurchases.mockResolvedValue([
        { createdAt: new Date(), amount: 0, products: ['coca-cola 237ml'] },
        { createdAt: new Date(), amount: 0, products: ['ALFAJOR MILKA'] },
      ]);

      const [p] = await service.evaluatePromotionsForPlayer('k1', 'player-1');

      expect(p.eligible).toBe(true);
    });

    it('NO es elegible si falta alguno de los productos', async () => {
      mockPrisma.promotion.findMany.mockResolvedValue([
        promo({
          rules: [{ type: 'PRODUCTS', products: ['Coca-Cola 237ml', 'Alfajor Milka'] }],
        }),
      ]);
      mockPurchases.getPlayerPurchases.mockResolvedValue([
        { createdAt: new Date(), amount: 0, products: ['Coca-Cola 237ml'] },
      ]);

      const [p] = await service.evaluatePromotionsForPlayer('k1', 'player-1');

      expect(p.eligible).toBe(false);
    });
  });

  describe('reglas combinadas (AND)', () => {
    it('si una regla falla, la promo no es elegible', async () => {
      mockPrisma.promotion.findMany.mockResolvedValue([
        promo({
          rules: [
            { type: 'FREQUENCY', minVisits: 2, windowDays: 7 },
            { type: 'AMOUNT', minAmount: 5000, windowDays: 7 },
          ],
        }),
      ]);
      mockPrisma.visit.count.mockResolvedValue(5); // frecuencia OK
      mockPurchases.getPlayerPurchases.mockResolvedValue([
        { createdAt: new Date(), amount: 100, products: [] }, // monto NO alcanza
      ]);

      const [p] = await service.evaluatePromotionsForPlayer('k1', 'player-1');

      expect(p.eligible).toBe(false);
    });
  });

  describe('caps (topes de canje)', () => {
    it('NO es elegible si el player alcanzó capPerPlayer', async () => {
      mockPrisma.promotion.findMany.mockResolvedValue([
        promo({ capPerPlayer: 1 }),
      ]);
      mockPrisma.redemption.count.mockResolvedValue(1); // ya canjeó 1

      const [p] = await service.evaluatePromotionsForPlayer('k1', 'player-1');

      expect(p.eligible).toBe(false);
    });

    it('NO es elegible si se alcanzó capTotal', async () => {
      mockPrisma.promotion.findMany.mockResolvedValue([
        promo({ capTotal: 10 }),
      ]);
      mockPrisma.redemption.count.mockResolvedValue(10);

      const [p] = await service.evaluatePromotionsForPlayer('k1', 'player-1');

      expect(p.eligible).toBe(false);
    });
  });

  describe('vigencia y audiencia (con fake timers)', () => {
    afterEach(() => jest.useRealTimers());

    it('NO es elegible si la promo ya venció (endsAt en el pasado)', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-17T15:00:00'));
      mockPrisma.promotion.findMany.mockResolvedValue([
        promo({ endsAt: new Date('2026-06-10T00:00:00') }),
      ]);

      const [p] = await service.evaluatePromotionsForPlayer('k1', 'player-1');

      expect(p.eligible).toBe(false);
    });

    it('NO es elegible fuera de los días de audiencia', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-17T15:00:00'));
      const hoy = new Date().getDay();
      const otroDia = (hoy + 1) % 7; // un día que NO es hoy
      mockPrisma.promotion.findMany.mockResolvedValue([
        promo({ audienceDays: [otroDia] }),
      ]);

      const [p] = await service.evaluatePromotionsForPlayer('k1', 'player-1');

      expect(p.eligible).toBe(false);
    });

    it('es elegible dentro del día de audiencia', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-17T15:00:00'));
      const hoy = new Date().getDay();
      mockPrisma.promotion.findMany.mockResolvedValue([
        promo({ audienceDays: [hoy] }),
      ]);

      const [p] = await service.evaluatePromotionsForPlayer('k1', 'player-1');

      expect(p.eligible).toBe(true);
    });
  });

  it('una promo sin reglas ni restricciones es elegible', async () => {
    mockPrisma.promotion.findMany.mockResolvedValue([promo()]);

    const [p] = await service.evaluatePromotionsForPlayer('k1', 'player-1');

    expect(p.eligible).toBe(true);
    expect(p).toMatchObject({ promotionId: 'promo-1', rewardType: 'FREE_PRODUCT' });
  });
});

describe('PromotionsService — CRUD', () => {
  let service: PromotionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PromotionsService(mockPrisma as any, mockPurchases as any);
  });

  describe('createPromotion', () => {
    it('lanza NotFoundException si el kiosco no existe', async () => {
      mockPrisma.kiosk.findUnique.mockResolvedValue(null);

      await expect(
        service.createPromotion('owner-1', {
          kioskId: 'k-none',
          title: 'x',
          rewardType: 'FREE_PRODUCT',
          rules: [],
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ForbiddenException si el kiosco no es del owner', async () => {
      mockPrisma.kiosk.findUnique.mockResolvedValue({ id: 'k1', ownerId: 'otro-owner' });

      await expect(
        service.createPromotion('owner-1', {
          kioskId: 'k1',
          title: 'x',
          rewardType: 'FREE_PRODUCT',
          rules: [],
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('crea la promo cuando el kiosco pertenece al owner', async () => {
      mockPrisma.kiosk.findUnique.mockResolvedValue({ id: 'k1', ownerId: 'owner-1' });
      mockPrisma.promotion.create.mockResolvedValue({ id: 'new-promo' });

      const res = await service.createPromotion('owner-1', {
        kioskId: 'k1',
        title: 'Promo nueva',
        rewardType: 'FREE_PRODUCT',
        rules: [{ type: 'FREQUENCY', minVisits: 2 }],
      } as any);

      expect(mockPrisma.promotion.create).toHaveBeenCalled();
      expect(res).toMatchObject({ id: 'new-promo' });
    });
  });
});
