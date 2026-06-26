import { Test, TestingModule } from '@nestjs/testing';
import { OwnerService } from './owner.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('OwnerService', () => {
  let service: OwnerService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnerService,
        {
          provide: PrismaService,
          useValue: {
            owner: { findUnique: jest.fn() },
            kiosk: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            visit: { groupBy: jest.fn() },
            redemption: { count: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<OwnerService>(OwnerService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkOwnerStatus', () => {
    it('throws NotFound if owner does not exist', async () => {
      jest.spyOn(prisma.owner, 'findUnique').mockResolvedValue(null);
      await expect(service.checkOwnerStatus('1')).rejects.toThrow(NotFoundException);
    });

    it('throws Forbidden if owner is PENDIENTE_VALIDACION', async () => {
      jest.spyOn(prisma.owner, 'findUnique').mockResolvedValue({ status: 'PENDIENTE_VALIDACION' } as any);
      await expect(service.checkOwnerStatus('1')).rejects.toThrow(ForbiddenException);
    });

    it('passes if owner is VALIDADO', async () => {
      jest.spyOn(prisma.owner, 'findUnique').mockResolvedValue({ status: 'VALIDADO' } as any);
      await expect(service.checkOwnerStatus('1')).resolves.toBeUndefined();
    });
  });

  describe('updateKiosk', () => {
    it('throws Forbidden if kiosk belongs to another owner', async () => {
      jest.spyOn(service, 'checkOwnerStatus').mockResolvedValue();
      jest.spyOn(prisma.kiosk, 'findUnique').mockResolvedValue({ id: 'k1', ownerId: 'otherOwner' } as any);

      await expect(
        service.updateKiosk('myOwner', 'k1', { name: 'A', address: 'B' })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getKioskStats', () => {
    it('throws Forbidden if kiosk belongs to another owner', async () => {
      jest.spyOn(prisma.kiosk, 'findUnique').mockResolvedValue({ id: 'k1', ownerId: 'otherOwner' } as any);
      await expect(service.getKioskStats('myOwner', 'k1')).rejects.toThrow(ForbiddenException);
    });

    it('calculates stats correctly', async () => {
      const mockReviews = [
        { attention: 5, variety: 5, cleanliness: 5, prices: 5, ambiance: 5 }, // avg = 5
        { attention: 3, variety: 3, cleanliness: 3, prices: 3, ambiance: 3 }, // avg = 3
      ]; // overall avg = 4
      
      jest.spyOn(prisma.kiosk, 'findUnique').mockResolvedValue({
        id: 'k1',
        ownerId: 'myOwner',
        reviews: mockReviews,
      } as any);

      jest.spyOn(prisma.visit, 'groupBy').mockResolvedValue([
        { playerId: 'p1' },
        { playerId: 'p2' },
        { playerId: 'p3' },
      ] as any); // 3 unique visitors

      jest.spyOn(prisma.redemption, 'count').mockResolvedValue(10);

      const stats = await service.getKioskStats('myOwner', 'k1');
      expect(stats.uniqueVisitors).toBe(3);
      expect(stats.avgRating).toBe(4);
      expect(stats.reviewCount).toBe(2);
      expect(stats.redemptionCount).toBe(10);
    });
  });
});
