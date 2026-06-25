import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KioskUpsertDto } from './dto/kiosk.dto';
import { Review } from '@prisma/client';

type RatingCats = Pick<
  Review,
  'attention' | 'variety' | 'cleanliness' | 'prices' | 'ambiance'
>;

@Injectable()
export class OwnerService {
  constructor(private readonly prisma: PrismaService) {}

  private overall(reviews: RatingCats[]): number | null {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce(
      (acc, r) =>
        acc +
        (r.attention + r.variety + r.cleanliness + r.prices + r.ambiance) / 5,
      0,
    );
    return Math.round((sum / reviews.length) * 10) / 10;
  }

  async checkOwnerStatus(ownerId: string) {
    const owner = await this.prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException('Owner no encontrado');
    if (owner.status !== 'VALIDADO') {
      throw new ForbiddenException('La cuenta de Owner está PENDIENTE_VALIDACION');
    }
  }

  async getKiosks(ownerId: string) {
    return this.prisma.kiosk.findMany({
      where: { ownerId },
      orderBy: { name: 'asc' },
    });
  }

  async createKiosk(ownerId: string, dto: KioskUpsertDto) {
    await this.checkOwnerStatus(ownerId);
    return this.prisma.kiosk.create({
      data: {
        ownerId,
        name: dto.name,
        address: dto.address,
        city: dto.city || 'Mendoza',
        brand: dto.brand,
        lat: dto.lat,
        lng: dto.lng,
      },
    });
  }

  async updateKiosk(ownerId: string, kioskId: string, dto: KioskUpsertDto) {
    await this.checkOwnerStatus(ownerId);
    const kiosk = await this.prisma.kiosk.findUnique({ where: { id: kioskId } });
    if (!kiosk || kiosk.ownerId !== ownerId) {
      throw new ForbiddenException('No puedes editar este kiosco');
    }
    return this.prisma.kiosk.update({
      where: { id: kioskId },
      data: {
        name: dto.name,
        address: dto.address,
        city: dto.city,
        brand: dto.brand,
        lat: dto.lat,
        lng: dto.lng,
      },
    });
  }

  async getKioskStats(ownerId: string, kioskId: string) {
    const kiosk = await this.prisma.kiosk.findUnique({
      where: { id: kioskId },
      include: {
        reviews: {
          select: {
            attention: true,
            variety: true,
            cleanliness: true,
            prices: true,
            ambiance: true,
          },
        },
      },
    });

    if (!kiosk || kiosk.ownerId !== ownerId) {
      throw new ForbiddenException('No tienes acceso a este kiosco');
    }

    const visitors = await this.prisma.visit.groupBy({
      by: ['playerId'],
      where: { kioskId },
    });
    const uniqueVisitors = visitors.length;

    const redemptionCount = await this.prisma.redemption.count({
      where: {
        promotion: { kioskId },
        status: 'REDEEMED',
      },
    });

    return {
      kioskId,
      uniqueVisitors,
      avgRating: this.overall(kiosk.reviews),
      reviewCount: kiosk.reviews.length,
      redemptionCount,
    };
  }
}
