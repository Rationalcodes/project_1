import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { SalonsModule } from './modules/salons/salons.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../.env.local', '../.env'],
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    SalonsModule,
    DiscoveryModule,
  ],
})
export class AppModule {}
