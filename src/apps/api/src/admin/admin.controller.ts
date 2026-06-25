import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('owners')
  listOwners() {
    return this.adminService.getOwners();
  }

  @Patch('owners/:id/validate')
  validateOwner(@Param('id') id: string) {
    return this.adminService.validateOwner(id);
  }
}
