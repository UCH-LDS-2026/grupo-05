import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthPlayer, CurrentPlayer } from '../auth/current-player.decorator';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RedemptionsService } from './redemptions.service';

@Controller('kiosks/:kioskId/promotions')
@UseGuards(JwtAuthGuard)
export class RedemptionsController {
  constructor(private readonly redemptions: RedemptionsService) {}

  /** GET /kiosks/:kioskId/promotions - promos elegibles para el player */
  @Get()
  eligible(
    @Param('kioskId') kioskId: string,
    @CurrentPlayer() player: AuthPlayer,
  ) {
    return this.redemptions.eligibleForKiosk(kioskId, player.id);
  }

  /** POST /kiosks/:kioskId/promotions/:promotionId/redeem - inicia el canje */
  @Post(':promotionId/redeem')
  redeem(
    @Param('promotionId') promotionId: string,
    @CurrentPlayer() player: AuthPlayer,
  ) {
    return this.redemptions.startRedemption(promotionId, player.id);
  }
}

@Controller('owner/redemptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
export class OwnerRedemptionsController {
  constructor(private readonly redemptions: RedemptionsService) {}

  /** POST /owner/redemptions/validate - owner valida un codigo en mostrador */
  @Post('validate')
  validate(@Body('code') code: string, @CurrentUser() owner: AuthUser) {
    return this.redemptions.validateByOwner(code ?? '', owner.id);
  }
}
