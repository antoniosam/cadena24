import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Matches,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsNotEmpty()
  uom!: string; // Unidad de medida

  // Single barcode (CODE128) - required, auto-generated if not provided
  @IsString()
  @IsNotEmpty()
  @Matches(/^[\x00-\x7F]{1,48}$/, {
    message: 'Barcode must contain only ASCII characters (max 48 chars)',
  })
  barcode!: string;

  // Niveles de inventario
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxStock?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderPoint?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderQuantity?: number = 0;

  // Atributos físicos
  @IsNumber()
  @Min(0)
  @IsOptional()
  weight?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  width?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  height?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  depth?: number = 0;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsNumber()
  @IsNotEmpty()
  classificationId!: number;
}
