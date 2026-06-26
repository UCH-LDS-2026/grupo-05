import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OwnerService } from './owner.service';

const mockPrisma = {
  owner: { findUnique: jest.fn() },
  kiosk: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  visit: { groupBy: jest.fn() },
  redemption: { count: jest.fn() },
};
const mockConfig = {
  get: jest.fn((key: string) => (key === 'VISIT_QR_SECRET' ? 'test-secret' : undefined)),
};

describe('OwnerService', () => {
  let service: OwnerService;

  beforeEach(() => {
    service = new OwnerService(mockPrisma as any, mockConfig as any);
    jest.clearAllMocks();
  });

  it('rechaza acciones si el owner no existe', async () => {
    mockPrisma.owner.findUnique.mockResolvedValue(null);

    await expect(service.checkOwnerStatus('owner-x')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rechaza acciones si el owner está pendiente de validación', async () => {
    mockPrisma.owner.findUnique.mockResolvedValue({
      id: 'owner-1',
      status: 'PENDIENTE_VALIDACION',
    });

    await expect(service.checkOwnerStatus('owner-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('calcula stats de un kiosco del owner', async () => {
    mockPrisma.kiosk.findUnique.mockResolvedValue({
      id: 'k1',
      ownerId: 'owner-1',
      reviews: [
        { attention: 5, variety: 4, cleanliness: 5, prices: 3, ambiance: 4 },
      ],
    });
    mockPrisma.visit.groupBy.mockResolvedValue([
      { playerId: 'p1' },
      { playerId: 'p2' },
    ]);
    mockPrisma.redemption.count.mockResolvedValue(3);

    const result = await service.getKioskStats('owner-1', 'k1');

    expect(result).toEqual({
      kioskId: 'k1',
      uniqueVisitors: 2,
      avgRating: 4.2,
      reviewCount: 1,
      redemptionCount: 3,
    });
  });

  it('devuelve resumen y reseñas agrupadas por kiosco del owner', async () => {
    mockPrisma.kiosk.findMany.mockResolvedValue([
      {
        id: 'k1',
        name: 'Yes Centro',
        address: 'San Martin 100',
        city: 'Mendoza',
        brand: 'Yes',
        reviews: [
          {
            id: 'r1',
            player: { id: 'p1', name: 'Sofi' },
            attention: 5,
            variety: 4,
            cleanliness: 5,
            prices: 3,
            ambiance: 4,
            comment: 'Muy buena atencion',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
            updatedAt: new Date('2026-06-01T10:00:00.000Z'),
          },
        ],
      },
      {
        id: 'k2',
        name: 'Yes Terminal',
        address: 'Terminal',
        city: 'Mendoza',
        brand: 'Yes',
        reviews: [],
      },
    ]);

    const result = await service.reviews('owner-1');

    expect(mockPrisma.kiosk.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: 'owner-1' } }),
    );
    expect(result.summary).toEqual({
      kioskCount: 2,
      reviewCount: 1,
      avgRating: 4.2,
    });
    expect(result.kiosks[0].avgRating).toBe(4.2);
    expect(result.kiosks[0].reviews[0]).toMatchObject({
      id: 'r1',
      author: 'Sofi',
      playerId: 'p1',
      comment: 'Muy buena atencion',
    });
    expect(result.kiosks[1].avgRating).toBeNull();
  });
});
