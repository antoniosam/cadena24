import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignUserDto {
  @IsInt()
  @IsNotEmpty()
  userId!: number;
}
