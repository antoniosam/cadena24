import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { ClassificationsRepository } from './classifications.repository';
import {
  CreateClassificationDto,
  UpdateClassificationDto,
  ClassificationQueryDto,
} from './dto/classifications.dto';

@Injectable()
export class ClassificationsService {
  constructor(private repository: ClassificationsRepository) {}

  async create(data: CreateClassificationDto) {
    const existing = await this.repository.findByCode(data.code);
    if (existing) {
      throw new ConflictException(`Classification with code ${data.code} already exists`);
    }

    return this.repository.create(data);
  }

  async findAll(query: ClassificationQueryDto) {
    return this.repository.findAll(query);
  }

  async findOne(id: number) {
    const classification = await this.repository.findOne(id);
    if (!classification) {
      throw new NotFoundException(`Classification with ID ${id} not found`);
    }
    return classification;
  }

  async update(id: number, data: UpdateClassificationDto) {
    await this.findOne(id);

    if (data.code) {
      const existing = await this.repository.findByCode(data.code);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Classification with code ${data.code} already exists`);
      }
    }

    return this.repository.update(id, data);
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.repository.delete(id);
  }
}
