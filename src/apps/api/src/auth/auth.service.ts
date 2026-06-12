import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { OwnerRegisterDto } from './dto/owner-register.dto';
import { EmailLoginDto } from './dto/email-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Firma el JWT con el rol del sujeto. `sub` es el id de la subclase concreta. */
  private sign(sub: string, name: string, role: 'PLAYER' | 'OWNER' | 'ADMIN') {
    return this.jwt.signAsync({ sub, name, role });
  }

  /**
   * Login del PLAYER por código de invitación.
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

    const token = await this.sign(player.id, player.name, 'PLAYER');
    return {
      token,
      role: 'PLAYER' as const,
      player: { id: player.id, name: player.name },
    };
  }

  /**
   * Registro de OWNER (email + password). Queda en PENDIENTE_VALIDACION hasta
   * que un Admin lo valide; puede loguearse, pero las acciones de owner se
   * gatean por estado más adelante.
   */
  async registerOwner(dto: OwnerRegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.prisma.owner.findUnique({ where: { email } });
    if (exists) {
      throw new ConflictException('Ya existe un owner con ese email');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const owner = await this.prisma.owner.create({
      data: { name: dto.name.trim(), email, passwordHash },
    });
    const token = await this.sign(owner.id, owner.name, 'OWNER');
    return {
      token,
      role: 'OWNER' as const,
      owner: { id: owner.id, name: owner.name, status: owner.status },
    };
  }

  /** Login de OWNER por email + password. */
  async loginOwner(dto: EmailLoginDto) {
    const email = dto.email.trim().toLowerCase();
    const owner = await this.prisma.owner.findUnique({ where: { email } });
    if (!owner || !(await bcrypt.compare(dto.password, owner.passwordHash))) {
      throw new UnauthorizedException('Email o contraseña inválidos');
    }
    const token = await this.sign(owner.id, owner.name, 'OWNER');
    return {
      token,
      role: 'OWNER' as const,
      owner: { id: owner.id, name: owner.name, status: owner.status },
    };
  }

  /** Login de ADMIN por email + password (los admins se crean por seed). */
  async loginAdmin(dto: EmailLoginDto) {
    const email = dto.email.trim().toLowerCase();
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin || !(await bcrypt.compare(dto.password, admin.passwordHash))) {
      throw new UnauthorizedException('Email o contraseña inválidos');
    }
    const token = await this.sign(admin.id, admin.name, 'ADMIN');
    return {
      token,
      role: 'ADMIN' as const,
      admin: { id: admin.id, name: admin.name },
    };
  }
}
