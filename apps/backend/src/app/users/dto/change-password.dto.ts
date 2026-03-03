import { IsString, Length, Matches } from 'class-validator';
import { IChangePassword } from '@cadena24-wms/shared';

export class ChangePasswordDto implements IChangePassword {
  @IsString({ message: 'La contraseña actual es requerida' })
  currentPassword!: string;

  @IsString()
  @Length(8, 100, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  newPassword!: string;

  @IsString({ message: 'La confirmación de contraseña es requerida' })
  confirmPassword!: string;
}
