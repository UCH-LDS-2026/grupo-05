import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { dayRange, todayKey, verifyVisitQrToken } from './visit-qr';

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(playerId: string, kioskId: string, visitToken = '') {
    const kiosk = await this.prisma.kiosk.findUnique({ where: { id: kioskId } });
    if (!kiosk) throw new NotFoundException('Kiosco no encontrado');

    const payload = verifyVisitQrToken(visitToken, this.qrSecret());
    if (!payload || payload.kioskId !== kioskId || payload.date !== todayKey()) {
      throw new BadRequestException('QR de visita inválido o vencido');
    }

    const { from, to } = dayRange(payload.date);
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
