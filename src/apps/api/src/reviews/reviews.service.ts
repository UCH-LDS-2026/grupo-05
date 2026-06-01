import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Crea o actualiza la reseña del player para ese kiosco (1 por player/kiosco). */
  async upsert(playerId: string, kioskId: string, dto: CreateReviewDto) {
    const kiosk = await this.prisma.kiosk.findUnique({ where: { id: kioskId } });
    if (!kiosk) throw new NotFoundException('Kiosco no encontrado');

    const data = {
      attention: dto.attention,
      variety: dto.variety,
      cleanliness: dto.cleanliness,
      prices: dto.prices,
      ambiance: dto.ambiance,
      comment: dto.comment ?? null,
    };

    return this.prisma.review.upsert({
      where: { playerId_kioskId: { playerId, kioskId } },
      update: data,
      create: { ...data, playerId, kioskId },
    });
  }
}
