import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductDto {
  @IsOptional()
  @IsString()
  search?: string; // Búsqueda por código, nombre o barcode

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  lowStock?: boolean; // Filtrar productos bajo mínimo

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
