import { NotFoundException } from '@nestjs/common';
import { KiosksService } from './kiosks.service';

// ---------- mock de PrismaService ----------
const mockPrisma = {
  kiosk: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  visit: {
    count: jest.fn(),
  },
  review: {
    findUnique: jest.fn(),
  },
};

describe('KiosksService', () => {
  let service: KiosksService;

  beforeEach(() => {
    service = new KiosksService(mockPrisma as any);
    jest.clearAllMocks();
  });

  // -------------------------------------------------------
  // TEST 1: list() calcula avgRating correctamente
  // -------------------------------------------------------
  describe('list()', () => {
    it('calcula avgRating como promedio de las 5 categorías entre todas las reseñas', async () => {
      mockPrisma.kiosk.findMany.mockResolvedValue([
        {
          id: 'k1',
          name: 'Kiosco Centro',
          address: 'San Martín 100',
          city: 'Mendoza',
          brand: null,
          lat: -32.89,
          lng: -68.84,
          tags: [],
          reviews: [
            // (5+5+5+5+5)/5 = 5.0
            { attention: 5, variety: 5, cleanliness: 5, prices: 5, ambiance: 5 },
            // (1+1+1+1+1)/5 = 1.0
            { attention: 1, variety: 1, cleanliness: 1, prices: 1, ambiance: 1 },
          ],
          _count: { visits: 10, reviews: 2 },
        },
      ]);

      const result = await service.list();

      expect(result).toHaveLength(1);
      // promedio de 5.0 y 1.0 → 3.0
      expect(result[0].avgRating).toBe(3.0);
      expect(result[0].reviewCount).toBe(2);
      expect(result[0].visitCount).toBe(10);
    });

    it('devuelve avgRating null cuando el kiosco no tiene reseñas', async () => {
      mockPrisma.kiosk.findMany.mockResolvedValue([
        {
          id: 'k2',
          name: 'Kiosco Sin Reseñas',
          address: 'Rivadavia 50',
          city: 'Mendoza',
          brand: 'Yes',
          lat: null,
          lng: null,
          tags: [{ tag: { name: '24hs' } }],
          reviews: [],
          _count: { visits: 0, reviews: 0 },
        },
      ]);

      const result = await service.list();

      expect(result[0].avgRating).toBeNull();
      expect(result[0].tags).toEqual(['24hs']);
    });
  });

  // -------------------------------------------------------
  // TEST 2: detail() lanza NotFoundException si el kiosco no existe
  // -------------------------------------------------------
  describe('detail()', () => {
    it('lanza NotFoundException cuando el kiosco no existe', async () => {
      mockPrisma.kiosk.findUnique.mockResolvedValue(null);

      await expect(service.detail('id-inexistente', 'player-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('incluye myVisits y myReview del player autenticado', async () => {
      mockPrisma.kiosk.findUnique.mockResolvedValue({
        id: 'k1',
        name: 'Kiosco Test',
        address: 'Dir 1',
        city: 'Mendoza',
        brand: null,
        lat: -32.89,
        lng: -68.84,
        tags: [],
        reviews: [],
        _count: { visits: 5 },
      });
      mockPrisma.visit.count.mockResolvedValue(3);
      mockPrisma.review.findUnique.mockResolvedValue(null);

      const result = await service.detail('k1', 'player-1');

      expect(result.myVisits).toBe(3);
      expect(result.myReview).toBeNull();
      expect(result.visitCount).toBe(5);
    });
  });
});
