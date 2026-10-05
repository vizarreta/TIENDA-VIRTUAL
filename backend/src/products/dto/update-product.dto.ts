import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { MAX_DATABASE_INT } from '../../common/parse-database-id.pipe';

export class UpdateProductDto {
  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 200)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(MAX_DATABASE_INT / 100)
  price?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(MAX_DATABASE_INT)
  stock?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(MAX_DATABASE_INT)
  categoryId?: number;

  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;
}
