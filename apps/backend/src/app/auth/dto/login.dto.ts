import { IsEmail, IsString, Length } from 'class-validator';
import { ILoginRequest } from '@cadena24-wms/shared';

export class LoginDto implements ILoginRequest {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string = '';

  @IsString({ message: 'La contraseña es requerida' })
  @Length(1, 100)
  password: string = '';
}
