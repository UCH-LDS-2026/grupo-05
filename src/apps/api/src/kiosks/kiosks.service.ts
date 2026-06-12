import { Injectable, NotFoundException } from '@nestjs/common';
import { Review } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type RatingCats = Pick<
  Review,
  'attention' | 'variety' | 'cleanliness' | 'prices' | 'ambiance'
>;

@Injectable()
export class KiosksService {
  constructor(private readonly prisma: PrismaService) {}

  /** Promedio general (1-5) del puntaje por categorías. Null si no hay reseñas. */
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

  async list() {
    const kiosks = await this.prisma.kiosk.findMany({
      orderBy: { name: 'asc' },
      include: {
        tags: { include: { tag: true } },
        reviews: {
          select: {
            attention: true,
            variety: true,
            cleanliness: true,
            prices: true,
            ambiance: true,
          },
        },
        _count: { select: { visits: true, reviews: true } },
      },
    });

    return kiosks.map((k) => ({
      id: k.id,
      name: k.name,
      address: k.address,
      city: k.city,
      brand: k.brand,
      lat: k.lat,
      lng: k.lng,
      tags: k.tags.map((kt) => kt.tag.name),
      visitCount: k._count.visits,
      reviewCount: k._count.reviews,
      avgRating: this.overall(k.reviews),
    }));
  }

  async detail(id: string, playerId: string) {
    const k = await this.prisma.kiosk.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: { player: { select: { name: true } } },
        },
        promotions: {
          where: { active: true },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { visits: true } },
      },
    });
    if (!k) throw new NotFoundException('Kiosco no encontrado');

    const myVisits = await this.prisma.visit.count({
      where: { kioskId: id, playerId },
    });
    const myReview = await this.prisma.review.findUnique({
      where: { playerId_kioskId: { playerId, kioskId: id } },
    });

    // Promos para las que el player ya califica
    const promotions = k.promotions
      .filter((p) => myVisits >= p.minVisits)
      .map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        minVisits: p.minVisits,
        eligible: true,
      }));

    return {
      id: k.id,
      name: k.name,
      address: k.address,
      city: k.city,
      brand: k.brand,
      lat: k.lat,
      lng: k.lng,
      tags: k.tags.map((kt) => kt.tag.name),
      visitCount: k._count.visits,
      reviewCount: k.reviews.length,
      avgRating: this.overall(k.reviews),
      myVisits,
      myReview,
      promotions,
      reviews: k.reviews.map((r) => ({
        id: r.id,
        author: r.player.name,
        attention: r.attention,
        variety: r.variety,
        cleanliness: r.cleanliness,
        prices: r.prices,
        ambiance: r.ambiance,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
    };
  }
}
