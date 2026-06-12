import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MockPurchase {
  createdAt: Date;
  amount: number;
  products: string[];
}

@Injectable()
export class MockPurchaseService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna una lista simulada de compras para un player en un kiosco específico.
   * Si el player es el de demo (Sofi), devuelve un historial predefinido para cumplir las reglas.
   */
  async getPlayerPurchases(
    playerId: string,
    kioskId: string,
  ): Promise<MockPurchase[]> {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return [];
    }

    // Si la jugadora es "Sofi" (jugadora de demo de la base de datos)
    if (player.name.toLowerCase() === 'sofi') {
      const now = new Date();
      return [
        {
          // Compra de hace 5 días
          createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          amount: 1500,
          products: ['Coca-Cola 237ml', 'Papas Lay\'s 150g'],
        },
        {
          // Compra de hace 2 días
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          amount: 3200,
          products: ['Alfajor Milka', 'Café Cabrales Espresso', 'Coca-Cola 237ml'],
        },
        {
          // Compra de hace 12 días (fuera de la ventana típica de 7 días)
          createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
          amount: 800,
          products: ['Chicles Beldent'],
        },
      ];
    }

    // Para cualquier otro player (por ejemplo, Bautista testeando en vivo),
    // generamos un historial por defecto con montos menores y una sola Coca para probar,
    // que se puede modificar dinámicamente si es necesario.
    const now = new Date();
    return [
      {
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        amount: 500,
        products: ['Coca-Cola 237ml'],
      },
    ];
  }
}
