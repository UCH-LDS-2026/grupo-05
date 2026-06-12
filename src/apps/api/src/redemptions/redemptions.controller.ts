import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthPlayer, CurrentPlayer } from '../auth/current-player.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RedemptionsService } from './redemptions.service';

@Controller('kiosks/:kioskId/promotions')
@UseGuards(JwtAuthGuard)
export class RedemptionsController {
  constructor(private readonly redemptions: RedemptionsService) {}

  /** GET /kiosks/:kioskId/promotions — promos elegibles para el player */
  @Get()
  eligible(
    @Param('kioskId') kioskId: string,
    @CurrentPlayer() player: AuthPlayer,
  ) {
    return this.redemptions.eligibleForKiosk(kioskId, player.id);
  }

  /** POST /kiosks/:kioskId/promotions/:promotionId/redeem — inicia el canje */
  @Post(':promotionId/redeem')
  redeem(
    @Param('promotionId') promotionId: string,
    @CurrentPlayer() player: AuthPlayer,
  ) {
    return this.redemptions.startRedemption(promotionId, player.id);
  }
}
