import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { KioskUpsertDto } from './dto/kiosk.dto';

@Controller('owner/kiosks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.ownerService.getKiosks(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: KioskUpsertDto) {
    return this.ownerService.createKiosk(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: KioskUpsertDto,
  ) {
    return this.ownerService.updateKiosk(user.id, id, dto);
  }

  @Get(':id/stats')
  stats(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ownerService.getKioskStats(user.id, id);
  }
}
