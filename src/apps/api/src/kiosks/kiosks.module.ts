import { Module } from '@nestjs/common';
import { KiosksService } from './kiosks.service';
import { KiosksController } from './kiosks.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [KiosksController],
  providers: [KiosksService],
})
export class KiosksModule {}
