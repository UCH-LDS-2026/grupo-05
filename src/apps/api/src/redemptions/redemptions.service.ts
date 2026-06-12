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

/**
 * Visitas mínimas que exige una promo, derivadas de sus reglas de FRECUENCIA.
 * En el modelo de dominio las visitas viven en una `PromotionRule` de tipo
 * FREQUENCY (no en la promo). El motor completo (monto, productos, audiencia,
 * caps) llega con `feature/motor-promociones`; acá sólo cubrimos la frecuencia,
 * que es lo que el canje necesita para decidir elegibilidad.
 */
function requiredVisits(
  rules: { type: string; minVisits: number | null }[],
): number {
  return rules
    .filter((r) => r.type === 'FREQUENCY' && r.minVisits != null)
    .reduce((max, r) => Math.max(max, r.minVisits ?? 0), 0);
}

@Injectable()
export class RedemptionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Promos activas del kiosco para las que el player califica (visitas >= requeridas). */
  async eligibleForKiosk(kioskId: string, playerId: string) {
    const kiosk = await this.prisma.kiosk.findUnique({ where: { id: kioskId } });
    if (!kiosk) throw new NotFoundException('Kiosco no encontrado');

    const myVisits = await this.prisma.visit.count({
      where: { kioskId, playerId },
    });

    const promotions = await this.prisma.promotion.findMany({
      where: { kioskId, active: true },
      include: { rules: true },
      orderBy: { createdAt: 'asc' },
    });

    return promotions
      .map((p) => ({ promo: p, minVisits: requiredVisits(p.rules) }))
      .filter(({ minVisits }) => myVisits >= minVisits)
      .map(({ promo, minVisits }) => ({
        id: promo.id,
        title: promo.title,
        description: promo.description,
        minVisits,
        eligible: true,
      }));
  }

  /** Inicia un canje: genera código de 6 chars que expira en 10 min. Contrato: RedemptionStart */
  async startRedemption(promotionId: string, playerId: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
      include: { kiosk: true, rules: true },
    });
    if (!promotion || !promotion.active) {
      throw new NotFoundException('Promoción no encontrada o inactiva');
    }

    // Verificar visitas mínimas (derivadas de las reglas de frecuencia)
    const minVisits = requiredVisits(promotion.rules);
    const myVisits = await this.prisma.visit.count({
      where: { kioskId: promotion.kioskId, playerId },
    });
    if (myVisits < minVisits) {
      throw new BadRequestException(
        `Necesitás al menos ${minVisits} visita(s) para canjear esta promo`,
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
