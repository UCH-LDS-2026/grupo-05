import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createVisitQrToken } from './visit-qr';
import { VisitsService } from './visits.service';

const mockPrisma = {
  kiosk: { findUnique: jest.fn() },
  visit: {
    findFirst: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
};

const mockConfig = {
  get: jest.fn((key: string) => (key === 'VISIT_QR_SECRET' ? 'test-secret' : undefined)),
};

describe('VisitsService', () => {
  let service: VisitsService;

  beforeEach(() => {
    service = new VisitsService(mockPrisma as any, mockConfig as any);
    jest.clearAllMocks();
  });

  it('registra la visita y retorna el total acumulado del player en ese kiosco', async () => {
    mockPrisma.kiosk.findUnique.mockResolvedValue({ id: 'k1' });
    mockPrisma.visit.findFirst.mockResolvedValue(null);
    mockPrisma.visit.create.mockResolvedValue({
      id: 'v1',
      createdAt: new Date('2026-01-01'),
    });
    mockPrisma.visit.count.mockResolvedValue(4);

    const result = await service.create('p1', 'k1', createVisitQrToken('k1', 'test-secret'));

    expect(result.id).toBe('v1');
    expect(result.totalVisits).toBe(4);
    expect(mockPrisma.visit.create).toHaveBeenCalledWith({
      data: { playerId: 'p1', kioskId: 'k1' },
    });
    expect(mockPrisma.visit.count).toHaveBeenCalledWith({
      where: { playerId: 'p1', kioskId: 'k1' },
    });
  });

  it('lanza NotFoundException si el kiosco no existe', async () => {
    mockPrisma.kiosk.findUnique.mockResolvedValue(null);

    await expect(service.create('p1', 'k-inexistente', 'token')).rejects.toThrow(
      NotFoundException,
    );
    expect(mockPrisma.visit.create).not.toHaveBeenCalled();
  });

  it('rechaza si el token no corresponde al kiosco', async () => {
    mockPrisma.kiosk.findUnique.mockResolvedValue({ id: 'k1' });

    await expect(
      service.create('p1', 'k1', createVisitQrToken('otro-kiosco', 'test-secret')),
    ).rejects.toThrow(BadRequestException);
    expect(mockPrisma.visit.create).not.toHaveBeenCalled();
  });

  it('rechaza si el player ya registró visita hoy en ese kiosco', async () => {
    mockPrisma.kiosk.findUnique.mockResolvedValue({ id: 'k1' });
    mockPrisma.visit.findFirst.mockResolvedValue({ id: 'v-hoy' });

    await expect(
      service.create('p1', 'k1', createVisitQrToken('k1', 'test-secret')),
    ).rejects.toThrow(BadRequestException);
    expect(mockPrisma.visit.create).not.toHaveBeenCalled();
  });
});
