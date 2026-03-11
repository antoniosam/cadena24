import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { ProvidersRepository } from './providers.repository';
import { CreateProviderDto, UpdateProviderDto, ProviderQueryDto } from './dto/providers.dto';

@Injectable()
export class ProvidersService {
  constructor(private repository: ProvidersRepository) {}

  async create(data: CreateProviderDto) {
    const existing = await this.repository.findByCode(data.code);
    if (existing) {
      throw new ConflictException(`Provider with code ${data.code} already exists`);
    }

    return this.repository.create(data);
  }

  async findAll(query: ProviderQueryDto) {
    return this.repository.findAll(query);
  }

  async findOne(id: number) {
    const provider = await this.repository.findOne(id);
    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }
    return provider;
  }

  async update(id: number, data: UpdateProviderDto) {
    await this.findOne(id);

    if (data.code) {
      const existing = await this.repository.findByCode(data.code);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Provider with code ${data.code} already exists`);
      }
    }

    return this.repository.update(id, data);
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.repository.delete(id);
  }
}
