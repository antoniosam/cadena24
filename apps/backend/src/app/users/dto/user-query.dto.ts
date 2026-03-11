import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { RoleCode } from '@cadena24-wms/shared';

export class UserQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsEnum(RoleCode, { message: 'El rol no es válido' })
  role?: RoleCode;

  @IsOptional()
  @IsString()
  search?: string;
}
