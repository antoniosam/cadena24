import { IsEmail, IsISO8601, IsOptional, IsString, Length, IsNumber } from 'class-validator';
import { IUpdateUser } from '@cadena24-wms/shared';

export class UpdateUserDto implements IUpdateUser {
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'El apellido debe tener entre 2 y 100 caracteres' })
  lastName?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de nacimiento debe ser una fecha válida' })
  birthday?: string | null;

  @IsOptional()
  @IsNumber({}, { message: 'La clasificación debe ser un número válido' })
  classificationId?: number | null;
}
