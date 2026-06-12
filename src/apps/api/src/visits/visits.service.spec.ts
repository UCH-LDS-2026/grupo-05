import { NotFoundException } from '@nestjs/common';
import { VisitsService } from './visits.service';

const mockPrisma = {
  kiosk: { findUnique: jest.fn() },
  visit: {
    create: jest.fn(),
    count: jest.fn(),
  },
};

describe('VisitsService', () => {
  let service: VisitsService;

  beforeEach(() => {
    service = new VisitsService(mockPrisma as any);
    jest.clearAllMocks();
  });

  // -------------------------------------------------------
  // TEST 6: create() registra la visita y devuelve totalVisits
  // -------------------------------------------------------
  it('registra la visita y retorna el total acumulado del player en ese kiosco', async () => {
    mockPrisma.kiosk.findUnique.mockResolvedValue({ id: 'k1' });
    mockPrisma.visit.create.mockResolvedValue({
      id: 'v1',
      createdAt: new Date('2026-01-01'),
    });
    mockPrisma.visit.count.mockResolvedValue(4);

    const result = await service.create('p1', 'k1');

    expect(result.id).toBe('v1');
    expect(result.totalVisits).toBe(4);
    expect(mockPrisma.visit.create).toHaveBeenCalledWith({
      data: { playerId: 'p1', kioskId: 'k1' },
    });
    // count debe filtrar por playerId y kioskId
    expect(mockPrisma.visit.count).toHaveBeenCalledWith({
      where: { playerId: 'p1', kioskId: 'k1' },
    });
  });

  // -------------------------------------------------------
  // TEST 7: create() lanza NotFoundException si el kiosco no existe
  // -------------------------------------------------------
  it('lanza NotFoundException si el kiosco no existe', async () => {
    mockPrisma.kiosk.findUnique.mockResolvedValue(null);

    await expect(service.create('p1', 'k-inexistente')).rejects.toThrow(
      NotFoundException,
    );
    expect(mockPrisma.visit.create).not.toHaveBeenCalled();
  });
});
