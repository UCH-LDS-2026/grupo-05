import { SetMetadata } from '@nestjs/common';
import { Role } from './current-user.decorator';

export const ROLES_KEY = 'roles';

/**
 * Restringe un endpoint a uno o más roles. Usar junto con `JwtAuthGuard` y
 * `RolesGuard`:
 *
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('OWNER')
 *   @Post('promotions')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
