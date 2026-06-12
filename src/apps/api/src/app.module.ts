import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { KiosksModule } from './kiosks/kiosks.module';
import { VisitsModule } from './visits/visits.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RedemptionsModule } from './redemptions/redemptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    KiosksModule,
    VisitsModule,
    ReviewsModule,
    RedemptionsModule,
  ],
})
export class AppModule {}
