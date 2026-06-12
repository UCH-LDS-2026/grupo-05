import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutos

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I ambiguos
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

@Injectable()
export class RedemptionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Promos activas del kiosco para las que el player califica (visitas >= minVisits). */
  async eligibleForKiosk(kioskId: string, playerId: string) {
    const kiosk = await this.prisma.kiosk.findUnique({ where: { id: kioskId } });
    if (!kiosk) throw new NotFoundException('Kiosco no encontrado');

    const myVisits = await this.prisma.visit.count({
      where: { kioskId, playerId },
    });

    const promotions = await this.prisma.promotion.findMany({
      where: { kioskId, active: true, minVisits: { lte: myVisits } },
      orderBy: { createdAt: 'asc' },
    });

    return promotions.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      minVisits: p.minVisits,
      eligible: true,
    }));
  }

  /** Inicia un canje: genera código de 6 chars que expira en 10 min. Contrato: RedemptionStart */
  async startRedemption(promotionId: string, playerId: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
      include: { kiosk: true },
    });
    if (!promotion || !promotion.active) {
      throw new NotFoundException('Promoción no encontrada o inactiva');
    }

    // Verificar visitas mínimas
    const myVisits = await this.prisma.visit.count({
      where: { kioskId: promotion.kioskId, playerId },
    });
    if (myVisits < promotion.minVisits) {
      throw new BadRequestException(
        `Necesitás al menos ${promotion.minVisits} visita(s) para canjear esta promo`,
      );
    }

    // Si ya hay un canje activo (no expirado, no usado), devolverlo
    const existing = await this.prisma.redemption.findFirst({
      where: {
        promotionId,
        playerId,
        redeemedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (existing) {
      return this.formatRedemption(existing, promotion);
    }

    // Generar código único
    let code: string;
    let attempts = 0;
    do {
      code = randomCode();
      attempts++;
      if (attempts > 10) throw new Error('No se pudo generar un código único');
    } while (await this.prisma.redemption.findUnique({ where: { code } }));

    const expiresAt = new Date(Date.now() + CODE_TTL_MS);
    const redemption = await this.prisma.redemption.create({
      data: { promotionId, playerId, code, expiresAt },
    });

    return this.formatRedemption(redemption, promotion);
  }

  private formatRedemption(
    r: { id: string; code: string; expiresAt: Date; redeemedAt: Date | null; createdAt: Date },
    promotion: { id: string; title: string; description: string | null; kiosk: { name: string } },
  ) {
    return {
      redemptionId: r.id,
      code: r.code,
      expiresAt: r.expiresAt.toISOString(),
      redeemedAt: r.redeemedAt?.toISOString() ?? null,
      promotion: {
        id: promotion.id,
        title: promotion.title,
        description: promotion.description,
        kioskName: promotion.kiosk.name,
      },
    };
  }
}
