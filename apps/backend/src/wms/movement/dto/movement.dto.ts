import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MovementType {
  PUTAWAY = 'PUTAWAY',
  REPLENISHMENT = 'REPLENISHMENT',
  CONSOLIDATION = 'CONSOLIDATION',
  RELOCATION = 'RELOCATION',
}

export class CreateMovementOrderLineDto {
  @IsInt()
  productId!: number;

  @IsInt()
  fromLocationId!: number;

  @IsInt()
  toLocationId!: number;

  @IsNumber()
  @Min(0.01)
  quantity!: number;
}

export class CreateMovementOrderDto {
  @IsInt()
  warehouseId!: number;

  @IsEnum(MovementType)
  movementType!: MovementType;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMovementOrderLineDto)
  lines!: CreateMovementOrderLineDto[];
}

export class ExecuteMovementLineDto {
  @IsInt()
  lineId!: number;

  @IsNumber()
  @Min(0.01)
  movedQuantity!: number;
}

export class ValidateMovementDto {
  @IsInt()
  productId!: number;

  @IsInt()
  fromLocationId!: number;

  @IsInt()
  toLocationId!: number;

  @IsNumber()
  @Min(0.01)
  quantity!: number;
}

export class SuggestLocationDto {
  @IsInt()
  productId!: number;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsString()
  @IsOptional()
  preferredType?: string;
}

export class QueryMovementOrderDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  warehouseId?: number;

  @IsEnum(MovementType)
  @IsOptional()
  movementType?: MovementType;

  @IsString()
  @IsOptional()
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
