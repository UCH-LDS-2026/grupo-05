import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta token de autenticación');
    }
    try {
      const payload = this.jwt.verify(header.slice(7));
      // `req.user` es el sujeto autenticado con su rol (player/owner/admin).
      req.user = { id: payload.sub, name: payload.name, role: payload.role };
      // `req.player` se mantiene por compatibilidad con los endpoints del player:
      // para un PLAYER, `sub` es el id del Player.
      req.player = { id: payload.sub, name: payload.name };
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
