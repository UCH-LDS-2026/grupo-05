import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OwnerRedemptionsController, RedemptionsController } from './redemptions.controller';
import { RedemptionsService } from './redemptions.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RedemptionsController, OwnerRedemptionsController],
  providers: [RedemptionsService],
})
export class RedemptionsModule {}
