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

  @Get()
  eligible(
    @Param('kioskId') kioskId: string,
    @CurrentPlayer() player: AuthPlayer,
  ) {
    return this.redemptions.eligibleForKiosk(kioskId, player.id);
  }

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

  @Post('validate')
  validate(@Body('code') code: string, @CurrentUser() owner: AuthUser) {
    return this.redemptions.validateByOwner(code ?? '', owner.id);
  }

  @Post('redeem')
  redeemByCode(@Body('code') code: string, @CurrentUser() owner: AuthUser) {
    return this.redemptions.validateByOwner(code ?? '', owner.id);
  }
}
