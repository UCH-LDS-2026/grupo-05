import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { KiosksModule } from './kiosks/kiosks.module';
import { OwnerModule } from './owner/owner.module';
import { PrismaModule } from './prisma/prisma.module';
import { PromotionsModule } from './promotions/promotions.module';
import { RedemptionsModule } from './redemptions/redemptions.module';
import { ReviewsModule } from './reviews/reviews.module';
import { VisitsModule } from './visits/visits.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    KiosksModule,
    VisitsModule,
    ReviewsModule,
    RedemptionsModule,
    PromotionsModule,
    OwnerModule,
    AdminModule,
  ],
})
export class AppModule {}
