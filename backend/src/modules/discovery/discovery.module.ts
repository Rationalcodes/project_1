import { Module, forwardRef } from '@nestjs/common';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import { SalonsModule } from '../salons/salons.module';

@Module({
  imports: [forwardRef(() => SalonsModule)],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
