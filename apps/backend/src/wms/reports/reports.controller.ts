import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('inventory/stock/excel')
  async exportStockExcel(@Res() res: Response) {
    const buffer = await this.reportsService.exportStockToExcel();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="stock-report.xlsx"',
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
