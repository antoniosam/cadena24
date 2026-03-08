import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsDate,
  IsInt,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ReceivingOrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ReceivingLineStatus {
  PENDING = 'pending',
  RECEIVED = 'received',
  PARTIAL = 'partial',
}

export class CreateReceivingOrderLineDto {
  @IsInt()
  @IsNotEmpty()
  productId!: number;

  @IsNumber()
  @Min(0)
  expectedQuantity!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unitCost?: number;
}

export class CreateReceivingOrderDto {
  @IsInt()
  @IsNotEmpty()
  warehouseId!: number;

  @IsString()
  @IsNotEmpty()
  supplierName!: string;

  @IsString()
  @IsOptional()
  supplierCode?: string;

  @IsString()
  @IsOptional()
  purchaseOrderNumber?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expectedDate?: Date;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReceivingOrderLineDto)
  lines!: CreateReceivingOrderLineDto[];
}

export class ReceiveLineDto {
  @IsInt()
  @IsNotEmpty()
  lineId!: number;

  @IsNumber()
  @Min(0)
  receivedQuantity!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  damageQuantity?: number;

  @IsInt()
  @IsNotEmpty()
  locationId!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class QueryReceivingOrderDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  warehouseId?: number;

  @IsEnum(ReceivingOrderStatus)
  @IsOptional()
  status?: ReceivingOrderStatus;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fromDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  toDate?: Date;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class QueryDamagedItemsDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  warehouseId?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fromDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  toDate?: Date;
}
