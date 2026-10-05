import { Transform } from 'class-transformer';
import { IsString, Length, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto, PaginatedResult } from './pagination.dto';

export class SearchProductsDto extends PaginationDto {
  @ApiProperty({ example: 'camiseta' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 200)
  q: string;

  @ApiPropertyOptional({ enum: ['name', 'price', 'createdAt', 'id'], default: 'id' })
  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'price' | 'createdAt' | 'id' = 'id';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class ProductsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID de categoría' })
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Precio mínimo' })
  @Transform(({ value }) => parseFloat(value as string))
  @IsOptional()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Precio máximo' })
  @Transform(({ value }) => parseFloat(value as string))
  @IsOptional()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Solo productos en stock' })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  inStock?: boolean;

  @ApiPropertyOptional({ enum: ['name', 'price', 'createdAt'], default: 'id' })
  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'price' | 'createdAt' | 'id' = 'id';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export { PaginatedResult } from './pagination.dto';
