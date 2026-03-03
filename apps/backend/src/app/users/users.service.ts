import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiResponse,
  IUser,
  IUserSummary,
  PaginatedApiResponse,
  PaginationMeta,
} from '@cadena24-wms/shared';
import { UsersRepository } from './users.repository';
import { PasswordService } from './password.service';
import { ChangePasswordDto, CreateUserDto, UpdateUserDto, UserQueryDto } from './dto';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '@cadena24-wms/shared';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService
  ) {}

  async findAll(query: UserQueryDto): Promise<PaginatedApiResponse<IUserSummary>> {
    const page = Number(query.page ?? DEFAULT_PAGE);
    const limit = Math.min(Number(query.limit ?? DEFAULT_LIMIT), 100);

    const { data, total } = await this.usersRepository.findAll(query);
    const totalPages = Math.ceil(total / limit);

    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return {
      success: true,
      message: 'Usuarios obtenidos correctamente',
      data,
      pagination,
      timestamp: new Date().toISOString(),
    };
  }

  async findOne(id: number): Promise<ApiResponse<IUser>> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return {
      success: true,
      message: 'Usuario obtenido correctamente',
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  async create(dto: CreateUserDto): Promise<ApiResponse<IUser>> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

    const hashed = await this.passwordService.hash(dto.password);
    const user = await this.usersRepository.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: hashed,
      birthday: dto.birthday ? new Date(dto.birthday) : null,
      role: dto.role,
    });

    return {
      success: true,
      message: 'Usuario creado correctamente',
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  async update(id: number, dto: UpdateUserDto): Promise<ApiResponse<IUser>> {
    const exists = await this.usersRepository.existsById(id);
    if (!exists) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.email) {
      const other = await this.usersRepository.findByEmail(dto.email);
      if (other && other.id !== id) {
        throw new ConflictException('El correo electrónico ya está en uso');
      }
    }

    const user = await this.usersRepository.update(id, {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      birthday:
        dto.birthday !== undefined
          ? dto.birthday === null
            ? null
            : new Date(dto.birthday)
          : undefined,
    });

    return {
      success: true,
      message: 'Usuario actualizado correctamente',
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  async toggleStatus(id: number): Promise<ApiResponse<IUser>> {
    const exists = await this.usersRepository.existsById(id);
    if (!exists) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const user = await this.usersRepository.toggleStatus(id);
    return {
      success: true,
      message: `Usuario ${user.active ? 'activado' : 'desactivado'} correctamente`,
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  async changePassword(id: number, dto: ChangePasswordDto): Promise<ApiResponse<null>> {
    this.passwordService.validate(dto);

    const raw = await this.usersRepository.findRawById(id);
    if (!raw) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const matches = await this.passwordService.compare(dto.currentPassword, raw.password);
    if (!matches) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const hashed = await this.passwordService.hash(dto.newPassword);
    await this.usersRepository.updatePassword(id, hashed);

    return {
      success: true,
      message: 'Contraseña actualizada correctamente',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  async remove(id: number): Promise<ApiResponse<null>> {
    const exists = await this.usersRepository.existsById(id);
    if (!exists) {
      throw new NotFoundException('Usuario no encontrado');
    }
    await this.usersRepository.delete(id);
    return {
      success: true,
      message: 'Usuario eliminado correctamente',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
