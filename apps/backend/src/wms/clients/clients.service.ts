import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { ClientsRepository } from './clients.repository';
import { CreateClientDto, UpdateClientDto, QueryClientsDto } from './dto/clients.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly clientsRepository: ClientsRepository) {}

  async create(dto: CreateClientDto) {
    const existing = await this.clientsRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Client with code ${dto.code} already exists`);
    }
    return this.clientsRepository.create(dto);
  }

  async findAll(query: QueryClientsDto) {
    return this.clientsRepository.findAll(query);
  }

  async findOne(id: number) {
    const client = await this.clientsRepository.findOne(id);
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    return client;
  }

  async update(id: number, dto: UpdateClientDto) {
    await this.findOne(id); // Ensure it exists
    return this.clientsRepository.update(id, dto);
  }

  async setStatus(id: number, isActive: boolean) {
    await this.findOne(id);
    return this.clientsRepository.update(id, { isActive });
  }
}
