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
  UseGuards,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { QueryLocationDto } from './dto/query-location.dto';
import { JwtAuthGuard } from '../../app/auth/guards/jwt-auth.guard';

@Controller('wms/locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationsService.create(createLocationDto);
  }

  @Get()
  findAll(@Query() query: QueryLocationDto) {
    return this.locationsService.findAll(query);
  }

  @Get('by-product/:productId')
  findByProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('warehouseId') warehouseId?: string
  ) {
    const warehouseIdNum = warehouseId ? Number(warehouseId) : undefined;
    return this.locationsService.findByProduct(productId, warehouseIdNum);
  }

  @Get('barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string) {
    return this.locationsService.findByBarcode(barcode);
  }

  @Get('warehouse/:warehouseId/tree')
  findByWarehouseTree(@Param('warehouseId', ParseIntPipe) warehouseId: number) {
    return this.locationsService.findByWarehouseTree(warehouseId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateLocationDto: UpdateLocationDto) {
    return this.locationsService.update(id, updateLocationDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.remove(id);
  }
}
