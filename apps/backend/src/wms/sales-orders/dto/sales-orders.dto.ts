import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsInt,
  IsEmail,
  Min,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SalesOrderStatus {
  PENDING = 'pending',
  PICKING = 'picking',
  PICKED = 'picked',
  SHIPPED = 'shipped',
  CANCELLED = 'cancelled',
}

export enum SalesOrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

// ── Create ────────────────────────────────────────────────────────────────────

export class CreateSalesOrderLineDto {
  @IsInt()
  productId!: number;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateSalesOrderDto {
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsString()
  @IsOptional()
  customerCode?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @IsString()
  @IsOptional()
  shippingCity?: string;

  @IsString()
  @IsOptional()
  shippingState?: string;

  @IsString()
  @IsOptional()
  shippingZipCode?: string;

  @IsDateString()
  @IsOptional()
  requiredDate?: string;

  @IsEnum(SalesOrderPriority)
  @IsOptional()
  priority?: SalesOrderPriority;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderLineDto)
  lines!: CreateSalesOrderLineDto[];
}

// ── Update ────────────────────────────────────────────────────────────────────

export class UpdateSalesOrderDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerCode?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @IsString()
  @IsOptional()
  shippingCity?: string;

  @IsString()
  @IsOptional()
  shippingState?: string;

  @IsString()
  @IsOptional()
  shippingZipCode?: string;

  @IsDateString()
  @IsOptional()
  requiredDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateSalesOrderPriorityDto {
  @IsEnum(SalesOrderPriority)
  priority!: SalesOrderPriority;
}

// ── Query ─────────────────────────────────────────────────────────────────────

export class QuerySalesOrdersDto {
  @IsEnum(SalesOrderStatus)
  @IsOptional()
  status?: SalesOrderStatus;

  @IsEnum(SalesOrderPriority)
  @IsOptional()
  priority?: SalesOrderPriority;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

// ── Stock Validation ──────────────────────────────────────────────────────────

export class ValidateStockItemDto {
  @IsInt()
  productId!: number;

  @IsNumber()
  @Min(0.01)
  quantity!: number;
}

export class ValidateStockDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidateStockItemDto)
  items!: ValidateStockItemDto[];
}
