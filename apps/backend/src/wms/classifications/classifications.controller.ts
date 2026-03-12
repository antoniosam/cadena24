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
import { ClassificationsService } from './classifications.service';
import {
  CreateClassificationDto,
  UpdateClassificationDto,
  ClassificationQueryDto,
} from './dto/classifications.dto';

@Controller('wms/classifications')
export class ClassificationsController {
  constructor(private readonly service: ClassificationsService) {}

  @Post()
  create(@Body() data: CreateClassificationDto) {
    return this.service.create(data);
  }

  @Get()
  findAll(@Query() query: ClassificationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateClassificationDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
