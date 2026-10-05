import { Controller, Get, Post, Delete, Patch, Body, Param, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiHeader } from '@nestjs/swagger';
import { AddToCartDto, UpdateQuantityDto } from './cart.dto';
import { CartService } from './cart.service';
import { getSessionId } from './session';
import { ParseDatabaseIdPipe } from '../common/parse-database-id.pipe';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener carrito de compras' })
  @ApiHeader({ name: 'x-session-id', required: true, description: 'UUID de la sesión del carrito' })
  @ApiResponse({ status: 200, description: 'Carrito obtenido' })
  async getCart(@Headers() headers: Record<string, string>) {
    const sessionId = getSessionId(headers);
    const items = await this.cartService.getCart(sessionId);
    return { items };
  }

  @Post()
  @ApiOperation({ summary: 'Agregar producto al carrito' })
  @ApiHeader({ name: 'x-session-id', required: true, description: 'UUID de la sesión del carrito' })
  @ApiBody({ type: AddToCartDto })
  @ApiResponse({ status: 201, description: 'Producto agregado al carrito' })
  addToCart(@Headers() headers: Record<string, string>, @Body() body: AddToCartDto) {
    const sessionId = getSessionId(headers);
    return this.cartService.addToCart(sessionId, body.productId, body.quantity);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Vaciar carrito' })
  @ApiHeader({ name: 'x-session-id', required: true, description: 'UUID de la sesión del carrito' })
  @ApiResponse({ status: 200, description: 'Carrito vaciado' })
  clearCart(@Headers() headers: Record<string, string>) {
    const sessionId = getSessionId(headers);
    return this.cartService.clearCart(sessionId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar item del carrito' })
  @ApiHeader({ name: 'x-session-id', required: true, description: 'UUID de la sesión del carrito' })
  @ApiParam({ name: 'id', description: 'ID del item en el carrito' })
  @ApiResponse({ status: 200, description: 'Item eliminado' })
  removeFromCart(
    @Headers() headers: Record<string, string>,
    @Param('id', ParseDatabaseIdPipe) id: number
  ) {
    const sessionId = getSessionId(headers);
    return this.cartService.removeFromCart(sessionId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cantidad de un item' })
  @ApiHeader({ name: 'x-session-id', required: true, description: 'UUID de la sesión del carrito' })
  @ApiParam({ name: 'id', description: 'ID del item en el carrito' })
  @ApiBody({ type: UpdateQuantityDto })
  @ApiResponse({ status: 200, description: 'Cantidad actualizada' })
  updateQuantity(
    @Headers() headers: Record<string, string>,
    @Param('id', ParseDatabaseIdPipe) id: number,
    @Body() body: UpdateQuantityDto
  ) {
    const sessionId = getSessionId(headers);
    return this.cartService.updateQuantity(sessionId, id, body.quantity);
  }
}
