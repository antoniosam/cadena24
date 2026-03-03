import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';
import { RoleCode } from '@cadena24-wms/shared';

export class UserQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: number;

  @IsOptional()
  @IsNumberString()
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
