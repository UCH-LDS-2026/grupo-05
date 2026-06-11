import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type Role = 'PLAYER' | 'OWNER' | 'ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
}

/**
 * Inyecta el usuario autenticado (con su rol) en un controller.
 * Para PLAYER, `id` es el id del Player; para OWNER, del Owner; para ADMIN, del Admin.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);
