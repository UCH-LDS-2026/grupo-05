import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OwnerController } from './owner.controller';
import { OwnerService } from './owner.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [OwnerController],
  providers: [OwnerService],
})
export class OwnerModule {}
