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
import { ReceivingService } from './receiving.service';
import {
  CreateReceivingOrderDto,
  ReceiveLineDto,
  QueryReceivingOrderDto,
  QueryDamagedItemsDto,
} from './dto';
import { JwtAuthGuard } from '../../app/auth/guards/jwt-auth.guard';

@Controller('wms/receiving-orders')
@UseGuards(JwtAuthGuard)
export class ReceivingController {
  constructor(private readonly receivingService: ReceivingService) {}

  @Get('generate-purchase-order-number')
  generatePurchaseOrderNumber() {
    return this.receivingService.generatePurchaseOrderNumber();
  }

  @Post()
  create(@Body() dto: CreateReceivingOrderDto, @Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      console.log(req.user);
      //throw new Error('User not authenticated');
    }
    return this.receivingService.create(dto, 1);
  }

  @Get()
  findAll(@Query() query: QueryReceivingOrderDto) {
    return this.receivingService.findAll(query);
  }

  @Get('damaged-items')
  getDamagedItems(@Query() query: QueryDamagedItemsDto) {
    return this.receivingService.getDamagedItems(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.receivingService.findOne(id);
  }

  @Get(':id/receiving-locations')
  async getReceivingLocations(@Param('id', ParseIntPipe) id: number) {
    const order = await this.receivingService.findOne(id);
    return this.receivingService.getReceivingLocations(order.warehouseId);
  }

  @Patch(':id/start')
  startReceiving(@Param('id', ParseIntPipe) id: number) {
    return this.receivingService.startReceiving(id);
  }

  @Post(':id/receive-line')
  receiveLine(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReceiveLineDto,
    @Request() req: any
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.receivingService.receiveLine(id, dto, userId);
  }

  @Patch(':id/complete')
  completeReceiving(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.receivingService.completeReceiving(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(@Param('id', ParseIntPipe) id: number) {
    await this.receivingService.cancel(id);
  }
}
