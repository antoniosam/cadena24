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
import { PickingService } from './picking.service';
import { GeneratePickListDto, AssignPickerDto, PickLineDto, QueryPickListsDto } from './dto';
import { JwtAuthGuard } from '../../app/auth/guards/jwt-auth.guard';

@Controller('wms/pick-lists')
@UseGuards(JwtAuthGuard)
export class PickingController {
  constructor(private readonly pickingService: PickingService) {}

  // ── POST /wms/pick-lists/generate ────────────────────────────────────────
  @Post('generate')
  generate(@Body() dto: GeneratePickListDto) {
    return this.pickingService.generate(dto);
  }

  // ── GET /wms/pick-lists ──────────────────────────────────────────────────
  @Get()
  findAll(@Query() query: QueryPickListsDto) {
    return this.pickingService.findAll(query);
  }

  // ── GET /wms/pick-lists/:id ──────────────────────────────────────────────
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pickingService.findOne(id);
  }

  // ── GET /wms/pick-lists/:id/optimized-route ──────────────────────────────
  @Get(':id/optimized-route')
  getOptimizedRoute(@Param('id', ParseIntPipe) id: number) {
    return this.pickingService.getOptimizedRoute(id);
  }

  // ── PATCH /wms/pick-lists/:id/assign-picker ──────────────────────────────
  @Patch(':id/assign-picker')
  assignPicker(@Param('id', ParseIntPipe) id: number, @Body() dto: AssignPickerDto) {
    return this.pickingService.assignPicker(id, dto);
  }

  // ── PATCH /wms/pick-lists/:id/start ─────────────────────────────────────
  @Patch(':id/start')
  @HttpCode(HttpStatus.OK)
  start(@Param('id', ParseIntPipe) id: number) {
    return this.pickingService.start(id);
  }

  // ── POST /wms/pick-lists/:id/pick-line ───────────────────────────────────
  @Post(':id/pick-line')
  pickLine(@Param('id', ParseIntPipe) id: number, @Body() dto: PickLineDto) {
    return this.pickingService.pickLine(id, dto);
  }

  // ── POST /wms/pick-lists/:id/complete ───────────────────────────────────
  @Post(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number, @Request() req: { user?: { sub?: number } }) {
    const userId = req.user?.sub ?? 1;
    return this.pickingService.complete(id, userId);
  }

  // ── DELETE /wms/pick-lists/:id ───────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.pickingService.cancel(id);
  }
}
