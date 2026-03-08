import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum InventoryStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  DAMAGED = 'damaged',
  QUARANTINE = 'quarantine',
}

export enum TransactionType {
  RECEIVE = 'RECEIVE',
  MOVE = 'MOVE',
  PICK = 'PICK',
  ADJUST = 'ADJUST',
  DAMAGE = 'DAMAGE',
}

export enum AdjustmentReason {
  PHYSICAL_COUNT = 'PHYSICAL_COUNT',
  DAMAGE = 'DAMAGE',
  FOUND = 'FOUND',
  LOST = 'LOST',
  CORRECTION = 'CORRECTION',
}

export class ReserveInventoryDto {
  @IsInt()
  productId!: number;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  referenceType!: string;

  @IsString()
  @IsNotEmpty()
  referenceId!: string;
}

export class ReleaseReservationDto {
  @IsInt()
  productId!: number;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  referenceId!: string;
}

export class UpdateInventoryDto {
  @IsInt()
  productId!: number;

  @IsInt()
  locationId!: number;

  @IsNumber()
  quantity!: number;

  @IsEnum(['ADD', 'SUBTRACT', 'SET'])
  operation!: 'ADD' | 'SUBTRACT' | 'SET';
}

export class CreateInventoryTransactionDto {
  @IsInt()
  productId!: number;

  @IsInt()
  warehouseId!: number;

  @IsInt()
  @IsOptional()
  fromLocationId?: number;

  @IsInt()
  @IsOptional()
  toLocationId?: number;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsEnum(TransactionType)
  transactionType!: TransactionType;

  @IsString()
  @IsNotEmpty()
  referenceType!: string;

  @IsString()
  @IsOptional()
  referenceId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsInt()
  @IsOptional()
  userId?: number;
}

export class CreateAdjustmentLineDto {
  @IsInt()
  productId!: number;

  @IsInt()
  locationId!: number;

  @IsNumber()
  @Min(0)
  systemQuantity!: number;

  @IsNumber()
  @Min(0)
  physicalQuantity!: number;
}

export class CreateAdjustmentDto {
  @IsInt()
  warehouseId!: number;

  @IsEnum(AdjustmentReason)
  reason!: AdjustmentReason;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAdjustmentLineDto)
  lines!: CreateAdjustmentLineDto[];
}

export class QueryInventoryDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  productId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  locationId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  warehouseId?: number;

  @IsEnum(InventoryStatus)
  @IsOptional()
  status?: InventoryStatus;
}
