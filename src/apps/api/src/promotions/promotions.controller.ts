import {
  Body,
  Controller,
  Param,
  Post,
  Patch,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { TogglePromotionDto } from './dto/toggle-promotion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PromotionsController {
  constructor(
    private readonly promotions: PromotionsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles('OWNER')
  async create(
    @Body() dto: CreatePromotionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.promotions.createPromotion(user.id, dto);
  }

  @Get('kiosk/:kioskId')
  @Roles('OWNER')
  async listByKiosk(
    @Param('kioskId') kioskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const kiosk = await this.prisma.kiosk.findUnique({
      where: { id: kioskId },
    });

    if (!kiosk) {
      throw new NotFoundException('Kiosco no encontrado');
    }

    if (kiosk.ownerId !== user.id) {
      throw new ForbiddenException(
        'No tenés permisos para ver promociones de este kiosco',
      );
    }

    return this.promotions.listPromotionsByKiosk(kioskId);
  }

  @Patch(':id/toggle')
  @Roles('OWNER')
  async toggle(
    @Param('id') id: string,
    @Body() dto: TogglePromotionDto,
    @CurrentUser() user: AuthUser,
  ) {
    const promo = await this.prisma.promotion.findUnique({
      where: { id },
      include: { kiosk: true },
    });

    if (!promo) {
      throw new NotFoundException('Promoción no encontrada');
    }

    if (promo.kiosk.ownerId !== user.id) {
      throw new ForbiddenException('No tenés permisos sobre esta promoción');
    }

    return this.promotions.toggleActive(id, dto.active);
  }

  @Patch(':id')
  @Roles('OWNER')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePromotionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.promotions.updatePromotion(user.id, id, dto);
  }

  @Delete(':id')
  @Roles('OWNER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.promotions.deletePromotion(user.id, id);
  }
}
