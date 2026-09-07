import { Controller, Get, Post, Delete, Patch, Body, Param, Headers } from '@nestjs/common';
import { CartService } from './cart.service';

function getSessionId(headers: any): string {
  let sessionId = headers['x-session-id'];
  if (!sessionId) {
    sessionId = 'temp-session-' + Math.random().toString(36).substring(2, 15);
  }
  return sessionId;
}

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Headers() headers: any) {
    const sessionId = getSessionId(headers);
    const items = await this.cartService.getCart(sessionId);
    return { items };
  }

  @Post()
  addToCart(@Headers() headers: any, @Body() body: { productId: number; quantity: number }) {
    const sessionId = getSessionId(headers);
    return this.cartService.addToCart(sessionId, +body.productId, +body.quantity);
  }

  @Delete('clear')
  clearCart(@Headers() headers: any) {
    const sessionId = getSessionId(headers);
    return this.cartService.clearCart(sessionId);
  }

  @Delete(':id')
  removeFromCart(@Headers() headers: any, @Param('id') id: string) {
    const sessionId = getSessionId(headers);
    return this.cartService.removeFromCart(sessionId, +id);
  }

  @Patch(':id')
  updateQuantity(@Headers() headers: any, @Param('id') id: string, @Body() body: { quantity: number }) {
    const sessionId = getSessionId(headers);
    return this.cartService.updateQuantity(sessionId, +id, +body.quantity);
  }
}
