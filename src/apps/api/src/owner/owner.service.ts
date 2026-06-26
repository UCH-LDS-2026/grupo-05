import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Review } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { createVisitQrToken, todayKey } from '../visits/visit-qr';
import { KioskUpsertDto } from './dto/kiosk.dto';

type RatingCats = Pick<
  Review,
  'attention' | 'variety' | 'cleanliness' | 'prices' | 'ambiance'
>;

@Injectable()
export class OwnerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private ratingValue(r: RatingCats): number {
    return (
      r.attention + r.variety + r.cleanliness + r.prices + r.ambiance
    ) / 5;
  }

  private overall(reviews: RatingCats[]): number | null {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, review) => acc + this.ratingValue(review), 0);
    return this.rounded(sum / reviews.length);
  }

  private rounded(value: number): number {
    return Math.round(value * 10) / 10;
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
      throw new ForbiddenException('No podés editar este kiosco');
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
      throw new ForbiddenException('No tenés acceso a este kiosco');
    }

    const visitors = await this.prisma.visit.groupBy({
      by: ['playerId'],
      where: { kioskId },
    });

    const redemptionCount = await this.prisma.redemption.count({
      where: {
        promotion: { kioskId },
        status: 'REDEEMED',
      },
    });

    return {
      kioskId,
      uniqueVisitors: visitors.length,
      avgRating: this.overall(kiosk.reviews),
      reviewCount: kiosk.reviews.length,
      redemptionCount,
    };
  }

  async reviews(ownerId: string) {
    const kiosks = await this.prisma.kiosk.findMany({
      where: { ownerId },
      orderBy: { name: 'asc' },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: { player: { select: { id: true, name: true } } },
        },
      },
    });

    const flatReviews = kiosks.flatMap((kiosk) => kiosk.reviews);
    const avgRating =
      flatReviews.length === 0
        ? null
        : this.rounded(
            flatReviews.reduce((sum, review) => sum + this.ratingValue(review), 0) /
              flatReviews.length,
          );

    return {
      summary: {
        kioskCount: kiosks.length,
        reviewCount: flatReviews.length,
        avgRating,
      },
      kiosks: kiosks.map((kiosk) => ({
        id: kiosk.id,
        name: kiosk.name,
        address: kiosk.address,
        city: kiosk.city,
        brand: kiosk.brand,
        reviewCount: kiosk.reviews.length,
        avgRating: this.overall(kiosk.reviews),
        reviews: kiosk.reviews.map((review) => ({
          id: review.id,
          author: review.player.name,
          playerId: review.player.id,
          attention: review.attention,
          variety: review.variety,
          cleanliness: review.cleanliness,
          prices: review.prices,
          ambiance: review.ambiance,
          comment: review.comment,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        })),
      })),
    };
  }

  async visitQrs(ownerId: string) {
    const kiosks = await this.prisma.kiosk.findMany({
      where: { ownerId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        brand: true,
      },
    });

    const secret = this.qrSecret();
    return {
      date: todayKey(),
      kiosks: kiosks.map((kiosk) => ({
        ...kiosk,
        visitToken: createVisitQrToken(kiosk.id, secret),
      })),
    };
  }

  private qrSecret() {
    return this.config.get<string>('VISIT_QR_SECRET') ?? this.config.get<string>('JWT_SECRET') ?? 'dev-secret';
  }
}
