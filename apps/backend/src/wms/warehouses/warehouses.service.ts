import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { WarehousesRepository } from './warehouses.repository';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { QueryWarehouseDto } from './dto/query-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly repository: WarehousesRepository) {}

  async create(createWarehouseDto: CreateWarehouseDto) {
    const code = createWarehouseDto.code.trim();
    createWarehouseDto.code = code;

    // Check for duplicate code
    const existing = await this.repository.findByCode(code);
    if (existing) {
      throw new ConflictException(`Almacén con código "${code}" ya existe`);
    }

    // If this is marked as primary, ensure no other warehouse is primary
    if (createWarehouseDto.isPrimary) {
      const primary = await this.repository.findPrimary();
      if (primary) {
        throw new ConflictException(
          `El almacén "${primary.code}" ya está configurado como principal`
        );
      }
    }

    return this.repository.create(createWarehouseDto);
  }

  async findAll(query: QueryWarehouseDto) {
    return this.repository.findAll(query);
  }

  async findOne(id: number) {
    const warehouse = await this.repository.findOne(id);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    return warehouse;
  }

  async findPrimary() {
    const primary = await this.repository.findPrimary();
    if (!primary) {
      throw new NotFoundException('No primary warehouse found');
    }
    return primary;
  }

  async update(id: number, updateWarehouseDto: UpdateWarehouseDto) {
    const warehouse = await this.findOne(id); // Validate exists

    // Check for duplicate code if updating
    if (updateWarehouseDto.code) {
      const code = updateWarehouseDto.code.trim();
      updateWarehouseDto.code = code;
      const existing = await this.repository.findByCode(code);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Almacén con código "${code}" ya existe`);
      }
    }

    // If setting as primary, no need to check others because repository.update unsets them
    // but better check if we are disabling the ONLY primary warehouse
    if (updateWarehouseDto.isPrimary === false && warehouse.isPrimary) {
      // Logic depends on whether the system MUST have a primary warehouse
    }

    return this.repository.update(id, updateWarehouseDto);
  }

  async remove(id: number) {
    const warehouse = await this.findOne(id);

    // Prevent deletion of primary warehouse
    if (warehouse.isPrimary) {
      throw new BadRequestException('Cannot delete primary warehouse');
    }

    return this.repository.remove(id);
  }
}
