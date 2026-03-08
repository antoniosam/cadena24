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
import { MovementService } from './movement.service';
import {
  CreateMovementOrderDto,
  ExecuteMovementLineDto,
  ValidateMovementDto,
  SuggestLocationDto,
  QueryMovementOrderDto,
} from './dto';
import { JwtAuthGuard } from '../../app/auth/guards/jwt-auth.guard';

@Controller('wms/movement-orders')
@UseGuards(JwtAuthGuard)
export class MovementController {
  constructor(private readonly movementService: MovementService) {}

  @Post()
  create(@Body() dto: CreateMovementOrderDto, @Request() req: any) {
    const userId: number = req.user?.sub ?? 1;
    return this.movementService.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: QueryMovementOrderDto) {
    return this.movementService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.movementService.findOne(id);
  }

  @Patch(':id/start')
  startExecution(@Param('id', ParseIntPipe) id: number) {
    return this.movementService.startExecution(id);
  }

  @Post(':id/execute-line')
  executeLine(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ExecuteMovementLineDto,
    @Request() req: any
  ) {
    const userId: number = req.user?.sub ?? 1;
    return this.movementService.executeLine(id, dto, userId);
  }

  @Patch(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId: number = req.user?.sub ?? 1;
    return this.movementService.complete(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(@Param('id', ParseIntPipe) id: number) {
    await this.movementService.cancel(id);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validateMovement(@Body() dto: ValidateMovementDto) {
    return this.movementService.validateMovement(dto);
  }

  @Post('suggest-location')
  @HttpCode(HttpStatus.OK)
  suggestLocation(@Body() dto: SuggestLocationDto) {
    return this.movementService.suggestOptimalLocation(dto);
  }
}
