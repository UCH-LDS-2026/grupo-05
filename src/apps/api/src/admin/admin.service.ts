import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOwners() {
    return this.prisma.owner.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async validateOwner(id: string) {
    const owner = await this.prisma.owner.findUnique({ where: { id } });
    if (!owner) throw new NotFoundException('Owner no encontrado');

    return this.prisma.owner.update({
      where: { id },
      data: { status: 'VALIDADO' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });
  }
}
