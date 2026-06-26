import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RedemptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const CODE_TTL_MS = 10 * 60 * 1000;

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function requiredVisits(rules: { type: string; minVisits: number | null }[]): number {
  return rules
    .filter((r) => r.type === 'FREQUENCY' && r.minVisits != null)
    .reduce((max, r) => Math.max(max, r.minVisits ?? 0), 0);
}

@Injectable()
export class RedemptionsService {
  constructor(private readonly prisma: PrismaService) {}

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
      .map((promo) => ({ promo, minVisits: requiredVisits(promo.rules) }))
      .filter(({ minVisits }) => myVisits >= minVisits)
      .map(({ promo, minVisits }) => ({
        id: promo.id,
        title: promo.title,
        description: promo.description,
        minVisits,
        eligible: true,
      }));
  }

  async startRedemption(promotionId: string, playerId: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
      include: { kiosk: true, rules: true },
    });
    if (!promotion || !promotion.active) {
      throw new NotFoundException('Promoción no encontrada o inactiva');
    }

    const minVisits = requiredVisits(promotion.rules);
    const myVisits = await this.prisma.visit.count({
      where: { kioskId: promotion.kioskId, playerId },
    });
    if (myVisits < minVisits) {
      throw new BadRequestException(
        `Necesitás al menos ${minVisits} visita(s) para canjear esta promo`,
      );
    }

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

  async validateByOwner(rawCode: string, ownerId: string) {
    const code = rawCode.trim().toUpperCase().replace(/\s+/g, '');
    if (!code) throw new BadRequestException('Ingresá un código de canje');

    const owner = await this.prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException('Owner no encontrado');
    if (owner.status !== 'VALIDADO') {
      throw new ForbiddenException('La cuenta de Owner está PENDIENTE_VALIDACION');
    }

    const redemption = await this.prisma.redemption.findUnique({
      where: { code },
      include: {
        player: { select: { id: true, name: true } },
        promotion: { include: { kiosk: true } },
      },
    });
    if (!redemption) throw new NotFoundException('Código de canje no encontrado');
    if (redemption.promotion.kiosk.ownerId !== ownerId) {
      throw new ForbiddenException('Este canje pertenece a otro kiosco');
    }
    if (redemption.status === RedemptionStatus.REDEEMED || redemption.redeemedAt) {
      throw new BadRequestException('Este código ya fue usado');
    }

    const now = new Date();
    if (redemption.status === RedemptionStatus.EXPIRED || redemption.expiresAt <= now) {
      if (redemption.status !== RedemptionStatus.EXPIRED) {
        await this.prisma.redemption.update({
          where: { id: redemption.id },
          data: { status: RedemptionStatus.EXPIRED },
        });
      }
      throw new BadRequestException('Este código está vencido');
    }

    const update = await this.prisma.redemption.updateMany({
      where: {
        id: redemption.id,
        status: RedemptionStatus.PENDING,
        redeemedAt: null,
        expiresAt: { gt: now },
      },
      data: { status: RedemptionStatus.REDEEMED, redeemedAt: now },
    });
    if (update.count !== 1) {
      throw new BadRequestException('Este código ya fue usado');
    }

    const updated = await this.prisma.redemption.findUnique({
      where: { id: redemption.id },
      include: {
        player: { select: { id: true, name: true } },
        promotion: { include: { kiosk: true } },
      },
    });
    if (!updated) throw new NotFoundException('Código de canje no encontrado');

    return this.formatOwnerValidation(updated);
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

  private formatOwnerValidation(r: {
    id: string;
    code: string;
    status: string;
    expiresAt: Date;
    redeemedAt: Date | null;
    player: { id: string; name: string };
    promotion: {
      id: string;
      title: string;
      description: string | null;
      rewardType: string;
      rewardValue: number | null;
      rewardProduct: string | null;
      kiosk: { id: string; name: string };
    };
  }) {
    return {
      redemptionId: r.id,
      code: r.code,
      status: r.status,
      expiresAt: r.expiresAt.toISOString(),
      redeemedAt: r.redeemedAt?.toISOString() ?? null,
      player: r.player,
      promotion: {
        id: r.promotion.id,
        title: r.promotion.title,
        description: r.promotion.description,
        rewardType: r.promotion.rewardType,
        rewardValue: r.promotion.rewardValue,
        rewardProduct: r.promotion.rewardProduct,
        kioskId: r.promotion.kiosk.id,
        kioskName: r.promotion.kiosk.name,
      },
    };
  }
}
