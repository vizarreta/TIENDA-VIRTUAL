import { IsString, IsUUID, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateOrderDto {
  @IsUUID()
  requestId: string;

  @IsString()
  @Length(2, 120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  customerName: string;

  @IsString()
  @Length(10, 500)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  shippingAddress: string;
}
