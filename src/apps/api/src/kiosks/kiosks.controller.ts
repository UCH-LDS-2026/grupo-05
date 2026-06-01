import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { KiosksService } from './kiosks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentPlayer, AuthPlayer } from '../auth/current-player.decorator';

@Controller('kiosks')
@UseGuards(JwtAuthGuard)
export class KiosksController {
  constructor(private readonly kiosks: KiosksService) {}

  @Get()
  list() {
    return this.kiosks.list();
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentPlayer() player: AuthPlayer) {
    return this.kiosks.detail(id, player.id);
  }
}
