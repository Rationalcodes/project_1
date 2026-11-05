import { Module, forwardRef } from '@nestjs/common';
import { SalonsController } from './salons.controller';
import { SalonsService } from './salons.service';
import { QueueEngineService } from './queue-engine.service';
import { QueueGateway } from './queue.gateway';
import { SalonOwnerGuard } from './guards/salon-owner.guard';
import { DiscoveryModule } from '../discovery/discovery.module';

@Module({
  imports: [forwardRef(() => DiscoveryModule)],
  controllers: [SalonsController],
  providers: [SalonsService, QueueEngineService, QueueGateway, SalonOwnerGuard],
  exports: [SalonsService, QueueEngineService, QueueGateway],
})
export class SalonsModule {}
