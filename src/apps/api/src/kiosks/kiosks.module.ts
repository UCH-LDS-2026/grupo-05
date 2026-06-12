import { Module } from '@nestjs/common';
import { KiosksService } from './kiosks.service';
import { KiosksController } from './kiosks.controller';
import { AuthModule } from '../auth/auth.module';
import { PromotionsModule } from '../promotions/promotions.module';

@Module({
  imports: [AuthModule, PromotionsModule],
  controllers: [KiosksController],
  providers: [KiosksService],
})
export class KiosksModule {}
