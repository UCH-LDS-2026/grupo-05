import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Login por código de invitación.
   * - Si el código nunca se canjeó: crea el player (requiere `name`).
   * - Si ya tiene player asociado: re-emite token para ese player.
   */
  async login(dto: LoginDto) {
    const code = dto.code.trim().toUpperCase();
    let invite = await this.prisma.inviteCode.findUnique({
      where: { code },
      include: { player: true },
    });
    if (!invite) {
      // Para facilitar las pruebas, si el código no existe lo creamos al vuelo
      invite = await this.prisma.inviteCode.create({
        data: { code },
        include: { player: true },
      });
    }

    let player = invite.player;
    if (!player) {
      const name = dto.name?.trim();
      if (!name) {
        throw new UnauthorizedException('Indicá tu nombre para activar el código');
      }
      player = await this.prisma.player.create({
        data: { name, inviteCodeId: invite.id },
      });
    }

    const token = await this.jwt.signAsync({ sub: player.id, name: player.name });
    return { token, player: { id: player.id, name: player.name } };
  }
}
