import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, QueryProductDto } from './dto';

@Controller('wms/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Get('low-stock')
  getLowStock() {
    return this.productsService.getLowStockProducts();
  }

  @Get('search/barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(barcode);
  }

  @Get('validate/code/:code')
  validateProductCode(@Param('code') code: string) {
    return this.productsService.validateProductCode(code);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  // Gestión de códigos de barras
  @Post(':id/barcodes')
  addBarcode(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { barcode: string; type: string; isPrimary?: boolean }
  ) {
    return this.productsService.addBarcode(id, body.barcode, body.type, body.isPrimary);
  }

  @Delete(':id/barcodes/:barcodeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeBarcode(
    @Param('id', ParseIntPipe) id: number,
    @Param('barcodeId', ParseIntPipe) barcodeId: number
  ) {
    return this.productsService.removeBarcode(id, barcodeId);
  }
}
