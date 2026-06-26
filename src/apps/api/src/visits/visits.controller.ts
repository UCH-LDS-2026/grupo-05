import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AuthPlayer, CurrentPlayer } from '../auth/current-player.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VisitsService } from './visits.service';

@Controller('kiosks/:kioskId/visits')
@UseGuards(JwtAuthGuard)
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @Post()
  create(
    @Param('kioskId') kioskId: string,
    @Body('visitToken') visitToken: string,
    @CurrentPlayer() player: AuthPlayer,
  ) {
    return this.visits.create(player.id, kioskId, visitToken);
  }
}
