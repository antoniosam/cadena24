import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  QueryInventoryDto,
  ReserveInventoryDto,
  ReleaseReservationDto,
  UpdateInventoryDto,
  CreateAdjustmentDto,
} from './dto';

@Controller('wms/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ==================== INVENTORY QUERIES ====================
  @Get()
  getInventory(@Query() query: QueryInventoryDto) {
    return this.inventoryService.getInventory(query);
  }

  @Get('available/:productId')
  getAvailableStock(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('warehouseId') warehouseId?: string
  ) {
    return this.inventoryService.getAvailableStock(
      productId,
      warehouseId ? parseInt(warehouseId, 10) : undefined
    );
  }

  @Get('product/:productId')
  getStockByProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.inventoryService.getStockByProduct(productId);
  }

  @Get('location/:locationId')
  getStockByLocation(@Param('locationId', ParseIntPipe) locationId: number) {
    return this.inventoryService.getStockByLocation(locationId);
  }

  // ==================== INVENTORY OPERATIONS ====================
  @Patch('update')
  updateInventory(@Body() dto: UpdateInventoryDto, @Request() req: { user?: { sub: number } }) {
    const userId = req.user?.sub;
    return this.inventoryService.updateInventory(dto, userId);
  }

  @Post('reserve')
  @HttpCode(HttpStatus.OK)
  reserveInventory(@Body() dto: ReserveInventoryDto) {
    return this.inventoryService.reserveInventory(dto);
  }

  @Post('release')
  @HttpCode(HttpStatus.OK)
  releaseReservation(@Body() dto: ReleaseReservationDto) {
    return this.inventoryService.releaseReservation(dto);
  }

  // ==================== TRANSACTIONS ====================
  @Get('transactions')
  getTransactionHistory(
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('limit') limit?: string
  ) {
    return this.inventoryService.getTransactionHistory({
      productId: productId ? parseInt(productId, 10) : undefined,
      warehouseId: warehouseId ? parseInt(warehouseId, 10) : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  // ==================== ADJUSTMENTS ====================
  @Post('adjustments')
  createAdjustment(@Body() dto: CreateAdjustmentDto, @Request() req: { user?: { sub: number } }) {
    const userId = req.user?.sub ?? 1;
    return this.inventoryService.createAdjustment(dto, userId);
  }

  @Get('adjustments')
  getAdjustments(@Query('warehouseId') warehouseId?: string, @Query('status') status?: string) {
    return this.inventoryService.getAdjustments(
      warehouseId ? parseInt(warehouseId, 10) : undefined,
      status
    );
  }

  @Get('adjustments/:id')
  getAdjustment(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.getAdjustment(id);
  }

  @Patch('adjustments/:id/approve')
  approveAdjustment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user?: { sub: number } }
  ) {
    const userId = req.user?.sub ?? 1;
    return this.inventoryService.approveAdjustment(id, userId);
  }

  @Patch('adjustments/:id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelAdjustment(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.cancelAdjustment(id);
  }
}
