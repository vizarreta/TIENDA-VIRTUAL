import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { getSessionId } from '../cart/session';
import { CreateOrderDto } from './orders.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Get()
  list(@Request() req: { user: { id: string } }) {
    return this.orders.list(req.user.id);
  }

  @Post()
  create(
    @Request() req: { user: { id: string } },
    @Headers() headers: Record<string, string>,
    @Body() dto: CreateOrderDto
  ) {
    return this.orders.create(req.user.id, getSessionId(headers), dto);
  }

  @Post(':id/cancel')
  cancel(@Request() req: { user: { id: string } }, @Param('id', ParseUUIDPipe) id: string) {
    return this.orders.cancel(req.user.id, id);
  }
}
