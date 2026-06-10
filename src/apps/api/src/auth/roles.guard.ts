import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from './current-user.decorator';

/**
 * Verifica el rol del usuario autenticado contra los roles permitidos del
 * endpoint (`@Roles(...)`). Debe ir DESPUÉS de `JwtAuthGuard` en `@UseGuards`,
 * que es quien adjunta `req.user`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!allowed || allowed.length === 0) return true; // sin @Roles → solo requiere estar logueado

    const user = ctx.switchToHttp().getRequest().user;
    if (!user || !allowed.includes(user.role)) {
      throw new ForbiddenException('No tenés permisos para esta acción');
    }
    return true;
  }
}
