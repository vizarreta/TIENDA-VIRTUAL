import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderInventoryService } from './order-inventory.service';
import { OrdersController } from './orders.controller';

@Module({
  providers: [OrdersService, OrderInventoryService],
  controllers: [OrdersController],
})
export class OrdersModule {}
