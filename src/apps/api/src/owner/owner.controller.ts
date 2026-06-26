import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { KioskUpsertDto } from './dto/kiosk.dto';
import { OwnerService } from './owner.service';

@Controller('owner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  @Get('kiosks')
  list(@CurrentUser() user: AuthUser) {
    return this.ownerService.getKiosks(user.id);
  }

  @Post('kiosks')
  create(@CurrentUser() user: AuthUser, @Body() dto: KioskUpsertDto) {
    return this.ownerService.createKiosk(user.id, dto);
  }

  @Patch('kiosks/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: KioskUpsertDto,
  ) {
    return this.ownerService.updateKiosk(user.id, id, dto);
  }

  @Get('kiosks/:id/stats')
  stats(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ownerService.getKioskStats(user.id, id);
  }

  @Get('reviews')
  reviews(@CurrentUser() user: AuthUser) {
    return this.ownerService.reviews(user.id);
  }

  @Get('visit-qrs')
  visitQrs(@CurrentUser() user: AuthUser) {
    return this.ownerService.visitQrs(user.id);
  }
}
