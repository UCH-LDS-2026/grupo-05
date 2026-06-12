import { NotFoundException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

const mockPrisma = {
  kiosk: { findUnique: jest.fn() },
  review: { upsert: jest.fn() },
};

const dtoBase = {
  attention: 4,
  variety: 3,
  cleanliness: 5,
  prices: 2,
  ambiance: 4,
  comment: 'Muy bueno',
};

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(() => {
    service = new ReviewsService(mockPrisma as any);
    jest.clearAllMocks();
  });

  // -------------------------------------------------------
  // TEST 3: upsert() crea la reseña cuando no existe
  // -------------------------------------------------------
  it('crea una reseña nueva cuando el player aún no reseñó el kiosco', async () => {
    mockPrisma.kiosk.findUnique.mockResolvedValue({ id: 'k1', name: 'Kiosco X' });
    const expected = { id: 'r1', playerId: 'p1', kioskId: 'k1', ...dtoBase };
    mockPrisma.review.upsert.mockResolvedValue(expected);

    const result = await service.upsert('p1', 'k1', dtoBase);

    expect(mockPrisma.review.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { playerId_kioskId: { playerId: 'p1', kioskId: 'k1' } },
        create: expect.objectContaining({ playerId: 'p1', kioskId: 'k1' }),
        update: expect.objectContaining({ attention: 4 }),
      }),
    );
    expect(result).toEqual(expected);
  });

  // -------------------------------------------------------
  // TEST 4: upsert() actualiza la reseña existente
  // -------------------------------------------------------
  it('actualiza la reseña si el player ya había reseñado ese kiosco', async () => {
    mockPrisma.kiosk.findUnique.mockResolvedValue({ id: 'k1' });
    const updated = { id: 'r1', playerId: 'p1', kioskId: 'k1', ...dtoBase, attention: 2 };
    mockPrisma.review.upsert.mockResolvedValue(updated);

    const result = await service.upsert('p1', 'k1', { ...dtoBase, attention: 2 });

    expect(result.attention).toBe(2);
    expect(mockPrisma.review.upsert).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------
  // TEST 5: upsert() lanza NotFoundException si el kiosco no existe
  // -------------------------------------------------------
  it('lanza NotFoundException cuando el kioskId no existe', async () => {
    mockPrisma.kiosk.findUnique.mockResolvedValue(null);

    await expect(service.upsert('p1', 'id-falso', dtoBase)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockPrisma.review.upsert).not.toHaveBeenCalled();
  });
});
