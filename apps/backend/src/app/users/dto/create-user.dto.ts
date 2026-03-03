import { IsEmail, IsEnum, IsISO8601, IsOptional, IsString, Length } from 'class-validator';
import { ICreateUser, RoleCode } from '@cadena24-wms/shared';

export class CreateUserDto implements ICreateUser {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email!: string;

  @IsString({ message: 'El nombre es requerido' })
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
  firstName!: string;

  @IsString({ message: 'El apellido es requerido' })
  @Length(2, 100, { message: 'El apellido debe tener entre 2 y 100 caracteres' })
  lastName!: string;

  @IsString()
  @Length(8, 100, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de nacimiento debe ser una fecha válida' })
  birthday?: string;

  @IsOptional()
  @IsEnum(RoleCode, { message: 'El rol no es válido' })
  role?: RoleCode;
}
