import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(playerId: string, kioskId: string) {
    const kiosk = await this.prisma.kiosk.findUnique({ where: { id: kioskId } });
    if (!kiosk) throw new NotFoundException('Kiosco no encontrado');

    const visit = await this.prisma.visit.create({
      data: { playerId, kioskId },
    });
    const totalVisits = await this.prisma.visit.count({
      where: { playerId, kioskId },
    });
    return { id: visit.id, createdAt: visit.createdAt, totalVisits };
  }
}
