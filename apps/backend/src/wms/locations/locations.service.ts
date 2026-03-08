import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { LocationsRepository } from './locations.repository';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { QueryLocationDto } from './dto/query-location.dto';
import { PrismaService } from '../../app/prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(
    private readonly repository: LocationsRepository,
    private readonly prisma: PrismaService
  ) {}

  async create(createLocationDto: CreateLocationDto) {
    // Validate barcode uniqueness
    const existingBarcode = await this.repository.findByBarcode(createLocationDto.barcode);
    if (existingBarcode) {
      throw new BadRequestException(
        `Location with barcode ${createLocationDto.barcode} already exists`
      );
    }

    // Validate warehouse exists
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: createLocationDto.warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${createLocationDto.warehouseId} not found`);
    }

    if (!warehouse.isActive) {
      throw new BadRequestException('Cannot create location in inactive warehouse');
    }

    // Validate capacity constraints
    if (createLocationDto.capacity <= 0) {
      throw new BadRequestException('Capacity must be greater than 0');
    }

    if (createLocationDto.maxWeight && createLocationDto.maxWeight < 0) {
      throw new BadRequestException('Max weight cannot be negative');
    }

    return this.repository.create(createLocationDto);
  }

  async findAll(query: QueryLocationDto) {
    return this.repository.findAll(query);
  }

  async findOne(id: number) {
    const location = await this.repository.findOne(id);
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return location;
  }

  async findByBarcode(barcode: string) {
    const location = await this.repository.findByBarcode(barcode);
    if (!location) {
      throw new NotFoundException(`Location with barcode ${barcode} not found`);
    }
    return location;
  }

  async findByWarehouseTree(warehouseId: number) {
    // Validate warehouse exists
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }

    return this.repository.findByWarehouse(warehouseId);
  }

  async update(id: number, updateLocationDto: UpdateLocationDto) {
    await this.findOne(id); // Validate exists

    // Validate barcode uniqueness if updating
    if (updateLocationDto.barcode) {
      const existingBarcode = await this.repository.findByBarcode(updateLocationDto.barcode);
      if (existingBarcode && existingBarcode.id !== id) {
        throw new BadRequestException(
          `Location with barcode ${updateLocationDto.barcode} already exists`
        );
      }
    }

    // Validate capacity constraints
    if (updateLocationDto.capacity !== undefined && updateLocationDto.capacity <= 0) {
      throw new BadRequestException('Capacity must be greater than 0');
    }

    if (updateLocationDto.maxWeight !== undefined && updateLocationDto.maxWeight < 0) {
      throw new BadRequestException('Max weight cannot be negative');
    }

    // Validate warehouse exists if changing
    if (updateLocationDto.warehouseId) {
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: updateLocationDto.warehouseId },
      });

      if (!warehouse) {
        throw new NotFoundException(`Warehouse with ID ${updateLocationDto.warehouseId} not found`);
      }

      if (!warehouse.isActive) {
        throw new BadRequestException('Cannot move location to inactive warehouse');
      }
    }

    return this.repository.update(id, updateLocationDto);
  }

  async remove(id: number) {
    const location = await this.findOne(id);

    // Check if location has inventory
    if (location._count && location._count.inventories > 0) {
      throw new BadRequestException(
        `Cannot delete location with existing inventory (${location._count.inventories} items)`
      );
    }

    return this.repository.remove(id);
  }
}
