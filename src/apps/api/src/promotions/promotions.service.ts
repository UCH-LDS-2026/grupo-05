import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Promotion, RewardType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MockPurchaseService } from './mock-purchase.service';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

export interface PromotionRuleInput {
  type: 'FREQUENCY' | 'AMOUNT' | 'PRODUCTS';
  minVisits?: number;
  minAmount?: number;
  windowDays?: number;
  products?: string[];
}

export interface PromotionInput {
  kioskId: string;
  title: string;
  description?: string;
  active?: boolean;
  rewardType: RewardType;
  rewardValue?: number | null;
  rewardProduct?: string | null;
  audienceDays?: number[];
  audienceFromHour?: number | null;
  audienceToHour?: number | null;
  capPerPlayer?: number | null;
  capPerPeriod?: number | null;
  capTotal?: number | null;
  periodDays?: number | null;
  rules: PromotionRuleInput[];
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface ActivePromotion {
  promotionId: string;
  title: string;
  description: string | null;
  rewardType: RewardType;
  rewardValue: number | null;
  rewardProduct: string | null;
  eligible: boolean;
  // Detalle para guiar al usuario en la UI si no califica
  ruleProgress?: {
    type: 'FREQUENCY' | 'AMOUNT' | 'PRODUCTS';
    current: number | string[];
    required: number | string[];
    windowDays?: number;
  }[];
}

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mockPurchases: MockPurchaseService,
  ) {}

  /**
   * Evalúa las promociones de un kiosco para un player determinado y retorna cuáles son elegibles.
   */
  async evaluatePromotionsForPlayer(
    kioskId: string,
    playerId: string,
  ): Promise<ActivePromotion[]> {
    const promotions = await this.prisma.promotion.findMany({
      where: { kioskId, active: true },
      include: { rules: true },
    });

    const activePromotions: ActivePromotion[] = [];
    const now = new Date();

    for (const promo of promotions) {
      let eligible = true;
      const ruleProgress: ActivePromotion['ruleProgress'] = [];

      // 1. Vigencia (startsAt / endsAt)
      if (promo.startsAt && now < promo.startsAt) eligible = false;
      if (promo.endsAt && now > promo.endsAt) eligible = false;

      // 2. Audiencia (días de la semana y horas)
      if (eligible) {
        // audienceDays: [] significa todos los días.
        if (
          promo.audienceDays.length > 0 &&
          !promo.audienceDays.includes(now.getDay())
        ) {
          eligible = false;
        }

        const currentHour = now.getHours();
        if (
          promo.audienceFromHour !== null &&
          currentHour < promo.audienceFromHour
        ) {
          eligible = false;
        }
        if (
          promo.audienceToHour !== null &&
          currentHour > promo.audienceToHour
        ) {
          eligible = false;
        }
      }

      // 3. Caps (Límites de canje)
      if (eligible) {
        // capTotal: límite total de canjes
        if (promo.capTotal !== null) {
          const totalRedeemed = await this.prisma.redemption.count({
            where: {
              promotionId: promo.id,
              status: { in: ['PENDING', 'REDEEMED'] },
            },
          });
          if (totalRedeemed >= promo.capTotal) {
            eligible = false;
          }
        }

        // capPerPlayer: límite absoluto por jugador
        if (eligible && promo.capPerPlayer !== null) {
          const playerRedeemed = await this.prisma.redemption.count({
            where: {
              promotionId: promo.id,
              playerId,
              status: { in: ['PENDING', 'REDEEMED'] },
            },
          });
          if (playerRedeemed >= promo.capPerPlayer) {
            eligible = false;
          }
        }

        // capPerPeriod: límite periódico por jugador en un rango de periodDays
        if (
          eligible &&
          promo.capPerPeriod !== null &&
          promo.periodDays !== null
        ) {
          const periodStart = new Date(
            now.getTime() - promo.periodDays * 24 * 60 * 60 * 1000,
          );
          const playerPeriodRedeemed = await this.prisma.redemption.count({
            where: {
              promotionId: promo.id,
              playerId,
              status: { in: ['PENDING', 'REDEEMED'] },
              createdAt: { gte: periodStart },
            },
          });
          if (playerPeriodRedeemed >= promo.capPerPeriod) {
            eligible = false;
          }
        }
      }

      // 4. Reglas del motor (AND logic)
      if (eligible) {
        for (const rule of promo.rules) {
          const windowDays = rule.windowDays ?? 7; // por defecto 7 días si es null
          const ruleStart = new Date(
            now.getTime() - windowDays * 24 * 60 * 60 * 1000,
          );

          if (rule.type === 'FREQUENCY') {
            const requiredVisits = rule.minVisits ?? 1;
            const visitCount = await this.prisma.visit.count({
              where: {
                playerId,
                kioskId,
                createdAt: { gte: ruleStart },
              },
            });

            ruleProgress.push({
              type: 'FREQUENCY',
              current: visitCount,
              required: requiredVisits,
              windowDays,
            });

            if (visitCount < requiredVisits) {
              eligible = false;
            }
          } else if (rule.type === 'AMOUNT') {
            const requiredAmount = rule.minAmount ?? 0;
            const purchases = await this.mockPurchases.getPlayerPurchases(
              playerId,
              kioskId,
            );

            // Filtrar compras en la ventana de tiempo
            const periodPurchases = purchases.filter(
              (p) => p.createdAt >= ruleStart,
            );
            const totalSpent = periodPurchases.reduce(
              (acc, p) => acc + p.amount,
              0,
            );

            ruleProgress.push({
              type: 'AMOUNT',
              current: totalSpent,
              required: requiredAmount,
              windowDays,
            });

            if (totalSpent < requiredAmount) {
              eligible = false;
            }
          } else if (rule.type === 'PRODUCTS') {
            const requiredProducts = rule.products ?? [];
            const purchases = await this.mockPurchases.getPlayerPurchases(
              playerId,
              kioskId,
            );

            // Filtrar compras en la ventana de tiempo (si windowDays está configurado)
            const periodPurchases = rule.windowDays
              ? purchases.filter((p) => p.createdAt >= ruleStart)
              : purchases;

            const purchasedProducts = periodPurchases.flatMap((p) => p.products);
            const purchasedSet = new Set(
              purchasedProducts.map((p) => p.toLowerCase()),
            );

            // Todos los productos requeridos deben estar en los comprados
            const hasAll = requiredProducts.every((reqProd) =>
              purchasedSet.has(reqProd.toLowerCase()),
            );

            const matchingPurchased = requiredProducts.filter((reqProd) =>
              purchasedSet.has(reqProd.toLowerCase()),
            );

            ruleProgress.push({
              type: 'PRODUCTS',
              current: matchingPurchased,
              required: requiredProducts,
              windowDays: rule.windowDays ?? undefined,
            });

            if (!hasAll) {
              eligible = false;
            }
          }
        }
      }

      activePromotions.push({
        promotionId: promo.id,
        title: promo.title,
        description: promo.description,
        rewardType: promo.rewardType,
        rewardValue: promo.rewardValue,
        rewardProduct: promo.rewardProduct,
        eligible,
        ruleProgress,
      });
    }

    return activePromotions;
  }

  /**
   * Crea una nueva promoción con sus reglas. Valida que el kiosco pertenezca al owner.
   */
  async createPromotion(ownerId: string, data: PromotionInput): Promise<Promotion> {
    const kiosk = await this.prisma.kiosk.findUnique({
      where: { id: data.kioskId },
    });

    if (!kiosk) {
      throw new NotFoundException('Kiosco no encontrado');
    }

    if (kiosk.ownerId !== ownerId) {
      throw new ForbiddenException('No tenés permisos sobre este kiosco');
    }

    return this.prisma.promotion.create({
      data: {
        kioskId: data.kioskId,
        title: data.title,
        description: data.description,
        active: data.active ?? true,
        rewardType: data.rewardType,
        rewardValue: data.rewardValue,
        rewardProduct: data.rewardProduct,
        audienceDays: data.audienceDays ?? [],
        audienceFromHour: data.audienceFromHour,
        audienceToHour: data.audienceToHour,
        capPerPlayer: data.capPerPlayer,
        capPerPeriod: data.capPerPeriod,
        capTotal: data.capTotal,
        periodDays: data.periodDays,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        rules: {
          create: data.rules.map((rule) => ({
            type: rule.type,
            windowDays: rule.windowDays,
            minVisits: rule.minVisits,
            minAmount: rule.minAmount,
            products: rule.products ?? [],
          })),
        },
      },
      include: { rules: true },
    });
  }

  /**
   * Lista todas las promociones (activas e inactivas) de un kiosco.
   */
  async listPromotionsByKiosk(kioskId: string): Promise<Promotion[]> {
    return this.prisma.promotion.findMany({
      where: { kioskId },
      include: { rules: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cambia el estado activo/inactivo de una promoción.
   */
  async toggleActive(promotionId: string, active: boolean): Promise<Promotion> {
    const promo = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promo) {
      throw new NotFoundException('Promoción no encontrada');
    }

    return this.prisma.promotion.update({
      where: { id: promotionId },
      data: { active },
      include: { rules: true },
    });
  }

  /**
   * Actualiza una promoción existente. Valida que el kiosco pertenezca al owner.
   * Si se incluye `rules`, reemplaza TODAS las reglas existentes (delete + create).
   */
  async updatePromotion(
    ownerId: string,
    promotionId: string,
    data: UpdatePromotionDto,
  ): Promise<Promotion> {
    const promo = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
      include: { kiosk: true },
    });

    if (!promo) {
      throw new NotFoundException('Promoción no encontrada');
    }

    if (promo.kiosk.ownerId !== ownerId) {
      throw new ForbiddenException('No tenés permisos sobre esta promoción');
    }

    return this.prisma.$transaction(async (tx) => {
      // Si se envían reglas nuevas, se borran las anteriores y se crean las nuevas
      if (data.rules !== undefined) {
        await tx.promotionRule.deleteMany({ where: { promotionId } });
      }

      return tx.promotion.update({
        where: { id: promotionId },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.active !== undefined && { active: data.active }),
          ...(data.rewardType !== undefined && { rewardType: data.rewardType }),
          ...(data.rewardValue !== undefined && { rewardValue: data.rewardValue }),
          ...(data.rewardProduct !== undefined && { rewardProduct: data.rewardProduct }),
          ...(data.audienceDays !== undefined && { audienceDays: data.audienceDays }),
          ...(data.audienceFromHour !== undefined && { audienceFromHour: data.audienceFromHour }),
          ...(data.audienceToHour !== undefined && { audienceToHour: data.audienceToHour }),
          ...(data.capPerPlayer !== undefined && { capPerPlayer: data.capPerPlayer }),
          ...(data.capPerPeriod !== undefined && { capPerPeriod: data.capPerPeriod }),
          ...(data.capTotal !== undefined && { capTotal: data.capTotal }),
          ...(data.periodDays !== undefined && { periodDays: data.periodDays }),
          ...(data.startsAt !== undefined && { startsAt: data.startsAt ? new Date(data.startsAt) : null }),
          ...(data.endsAt !== undefined && { endsAt: data.endsAt ? new Date(data.endsAt) : null }),
          ...(data.rules !== undefined && {
            rules: {
              create: data.rules.map((rule) => ({
                type: rule.type,
                windowDays: rule.windowDays,
                minVisits: rule.minVisits,
                minAmount: rule.minAmount,
                products: rule.products ?? [],
              })),
            },
          }),
        },
        include: { rules: true },
      });
    });
  }

  /**
   * Elimina una promoción. Valida que el kiosco pertenezca al owner.
   * Las reglas y canjes PENDING se eliminan en cascada (definido en el schema).
   */
  async deletePromotion(ownerId: string, promotionId: string): Promise<void> {
    const promo = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
      include: { kiosk: true },
    });

    if (!promo) {
      throw new NotFoundException('Promoción no encontrada');
    }

    if (promo.kiosk.ownerId !== ownerId) {
      throw new ForbiddenException('No tenés permisos sobre esta promoción');
    }

    await this.prisma.promotion.delete({ where: { id: promotionId } });
  }
}
