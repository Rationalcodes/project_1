import { Module } from '@nestjs/common';
import { AdminSalonsController } from './admin.controller';
import { SalonsModule } from '../salons/salons.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [SalonsModule, AuthModule, PrismaModule],
  controllers: [AdminSalonsController],
})
export class AdminModule {}
