import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateLocationDto {
  @IsInt()
  @IsNotEmpty()
  warehouseId!: number;

  @IsString()
  @IsNotEmpty()
  zone!: string;

  @IsString()
  @IsNotEmpty()
  row!: string;

  @IsString()
  @IsNotEmpty()
  position!: string;

  @IsString()
  @IsNotEmpty()
  level!: string;

  @IsString()
  @IsNotEmpty()
  barcode!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['receiving', 'storage', 'picking', 'shipping'])
  type!: 'receiving' | 'storage' | 'picking' | 'shipping';

  @IsInt()
  @IsOptional()
  sequence?: number = 0;

  @IsNumber()
  @IsOptional()
  height?: number = 0;

  @IsNumber()
  @IsNotEmpty()
  capacity!: number;

  @IsNumber()
  @IsOptional()
  maxWeight?: number = 0;

  @IsBoolean()
  @IsOptional()
  allowMixedProducts?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsInt()
  @IsNotEmpty()
  classificationId!: number;
}
