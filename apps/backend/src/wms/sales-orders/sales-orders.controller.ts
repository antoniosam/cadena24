import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { SalesOrdersService } from './sales-orders.service';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  UpdateSalesOrderPriorityDto,
  QuerySalesOrdersDto,
  ValidateStockDto,
} from './dto';
import { JwtAuthGuard } from '../../app/auth/guards/jwt-auth.guard';

@Controller('wms/sales-orders')
@UseGuards(JwtAuthGuard)
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  // ── POST /wms/sales-orders ────────────────────────────────────────────────
  @Post()
  create(@Body() dto: CreateSalesOrderDto, @Request() req: { user?: { sub?: number } }) {
    const userId = req.user?.sub ?? 1;
    return this.salesOrdersService.create(dto, userId);
  }

  // ── GET /wms/sales-orders ─────────────────────────────────────────────────
  @Get()
  findAll(@Query() query: QuerySalesOrdersDto) {
    return this.salesOrdersService.findAll(query);
  }

  // ── POST /wms/sales-orders/validate-stock ─────────────────────────────────
  @Post('validate-stock')
  validateStock(@Body() dto: ValidateStockDto) {
    return this.salesOrdersService.validateStock(dto);
  }

  // ── GET /wms/sales-orders/:id ─────────────────────────────────────────────
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesOrdersService.findOne(id);
  }

  // ── GET /wms/sales-orders/:id/can-pick ───────────────────────────────────
  @Get(':id/can-pick')
  canPick(@Param('id', ParseIntPipe) id: number) {
    return this.salesOrdersService.canPick(id);
  }

  // ── PATCH /wms/sales-orders/:id ──────────────────────────────────────────
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSalesOrderDto) {
    return this.salesOrdersService.update(id, dto);
  }

  // ── PATCH /wms/sales-orders/:id/priority ─────────────────────────────────
  @Patch(':id/priority')
  updatePriority(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSalesOrderPriorityDto) {
    return this.salesOrdersService.updatePriority(id, dto.priority);
  }

  // ── POST /wms/sales-orders/:id/reserve-inventory ─────────────────────────
  @Post(':id/reserve-inventory')
  reserveInventory(@Param('id', ParseIntPipe) id: number) {
    return this.salesOrdersService.reserveInventory(id);
  }

  // ── POST /wms/sales-orders/:id/release-inventory ─────────────────────────
  @Post(':id/release-inventory')
  releaseInventory(@Param('id', ParseIntPipe) id: number) {
    return this.salesOrdersService.releaseInventory(id);
  }

  // ── DELETE /wms/sales-orders/:id ─────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.salesOrdersService.cancel(id);
  }
}
