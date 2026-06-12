import { Module } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { MockPurchaseService } from './mock-purchase.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PromotionsController],
  providers: [PromotionsService, MockPurchaseService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
