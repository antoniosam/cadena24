import { IsInt, IsNumber, IsOptional, IsString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum PickListStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// ── Generate ──────────────────────────────────────────────────────────────────

export class GeneratePickListDto {
  @IsInt()
  salesOrderId!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

// ── Assign Picker ─────────────────────────────────────────────────────────────

export class AssignPickerDto {
  @IsInt()
  pickerId!: number;
}

// ── Pick Line ─────────────────────────────────────────────────────────────────

export class PickLineDto {
  @IsInt()
  lineId!: number;

  @IsNumber()
  @Min(0)
  quantityPicked!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

// ── Query ─────────────────────────────────────────────────────────────────────

export class QueryPickListsDto {
  @IsEnum(PickListStatus)
  @IsOptional()
  status?: PickListStatus;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  salesOrderId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pickerId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  warehouseId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
