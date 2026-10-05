import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, ValidateIf } from 'class-validator';
import { MAX_DATABASE_INT } from '../common/parse-database-id.pipe';

export class AddToCartDto {
  @ApiProperty({ example: 1, description: 'ID del producto' })
  @IsInt()
  @Min(1)
  @Max(MAX_DATABASE_INT)
  productId: number;

  @ApiProperty({ example: 1, description: 'Cantidad', required: false })
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(MAX_DATABASE_INT)
  quantity?: number = 1;
}

export class UpdateQuantityDto {
  @ApiProperty({ example: 3, description: 'Nueva cantidad' })
  @IsInt()
  @Min(1)
  @Max(MAX_DATABASE_INT)
  quantity: number;
}
