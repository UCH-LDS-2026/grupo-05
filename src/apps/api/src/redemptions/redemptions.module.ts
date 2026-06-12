import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedemptionsController } from './redemptions.controller';
import { RedemptionsService } from './redemptions.service';

@Module({
  imports: [PrismaModule],
  controllers: [RedemptionsController],
  providers: [RedemptionsService],
})
export class RedemptionsModule {}
