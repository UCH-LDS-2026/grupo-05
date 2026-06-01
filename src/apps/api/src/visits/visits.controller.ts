import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentPlayer, AuthPlayer } from '../auth/current-player.decorator';

@Controller('kiosks/:kioskId/visits')
@UseGuards(JwtAuthGuard)
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @Post()
  create(
    @Param('kioskId') kioskId: string,
    @CurrentPlayer() player: AuthPlayer,
  ) {
    return this.visits.create(player.id, kioskId);
  }
}
