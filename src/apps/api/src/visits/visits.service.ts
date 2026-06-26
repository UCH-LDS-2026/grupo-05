import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { dayRange, todayKey, verifyVisitCode, verifyVisitQrToken } from './visit-qr';

type VisitProof = {
  visitToken?: string;
  visitCode?: string;
};

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(playerId: string, kioskId: string, proof: VisitProof | string = {}) {
    const kiosk = await this.prisma.kiosk.findUnique({ where: { id: kioskId } });
    if (!kiosk) throw new NotFoundException('Kiosco no encontrado');

    const secret = this.qrSecret();
    const visitToken = typeof proof === 'string' ? proof : proof.visitToken;
    const visitCode = typeof proof === 'string' ? undefined : proof.visitCode;
    const payload = visitToken ? verifyVisitQrToken(visitToken, secret) : null;
    const date = todayKey();
    const validToken = payload?.kioskId === kioskId && payload.date === date;
    const validCode = visitCode ? verifyVisitCode(visitCode, kioskId, secret) : false;

    if (!validToken && !validCode) {
      throw new BadRequestException('QR o código de visita inválido o vencido');
    }

    const { from, to } = dayRange(date);
    const existingToday = await this.prisma.visit.findFirst({
      where: {
        playerId,
        kioskId,
        createdAt: { gte: from, lt: to },
      },
    });
    if (existingToday) {
      throw new BadRequestException('Ya registraste una visita en este kiosco hoy');
    }

    const visit = await this.prisma.visit.create({
      data: { playerId, kioskId },
    });
    const totalVisits = await this.prisma.visit.count({
      where: { playerId, kioskId },
    });
    return { id: visit.id, createdAt: visit.createdAt, totalVisits };
  }

  private qrSecret() {
    return this.config.get<string>('VISIT_QR_SECRET') ?? this.config.get<string>('JWT_SECRET') ?? 'dev-secret';
  }
}
