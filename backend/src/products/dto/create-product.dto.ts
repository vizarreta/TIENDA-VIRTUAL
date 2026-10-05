import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  IsInt,
  IsBoolean,
  Length,
  Max,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { MAX_DATABASE_INT } from '../../common/parse-database-id.pipe';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Zapatos Deportivos' })
  @IsString()
  @Length(1, 200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiPropertyOptional({ example: 'Zapatos ligeros para correr' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 89.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(MAX_DATABASE_INT / 100)
  price: number;

  @ApiPropertyOptional({ example: '/images/products/deportivos.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(0)
  @Max(MAX_DATABASE_INT)
  stock: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(MAX_DATABASE_INT)
  categoryId?: number;

  @ApiPropertyOptional({ example: true })
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;
}
