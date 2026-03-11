import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { CreateProviderDto, UpdateProviderDto, ProviderQueryDto } from './dto/providers.dto';

@Controller('wms/providers')
export class ProvidersController {
  constructor(private readonly service: ProvidersService) {}

  @Post()
  create(@Body() data: CreateProviderDto) {
    return this.service.create(data);
  }

  @Get()
  findAll(@Query() query: ProviderQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateProviderDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
