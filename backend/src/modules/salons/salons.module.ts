import { Module, forwardRef } from '@nestjs/common';
import { SalonsController } from './salons.controller';
import { SalonsService } from './salons.service';
import { SalonOwnerGuard } from './guards/salon-owner.guard';
import { DiscoveryModule } from '../discovery/discovery.module';

@Module({
  imports: [forwardRef(() => DiscoveryModule)],
  controllers: [SalonsController],
  providers: [SalonsService, SalonOwnerGuard],
  exports: [SalonsService],
})
export class SalonsModule {}
