import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../app/prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getStockReportData() {
    return this.prisma.inventory.findMany({
      include: {
        product: true,
        location: true,
        warehouse: true,
      },
    });
  }

  async exportStockToExcel(): Promise<Buffer> {
    const data = await this.getStockReportData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock Report');

    worksheet.columns = [
      { header: 'Product Code', key: 'code', width: 20 },
      { header: 'Product Name', key: 'name', width: 30 },
      { header: 'Warehouse', key: 'warehouse', width: 20 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Available Qty', key: 'qty', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    data.forEach((item) => {
      worksheet.addRow({
        code: item.product.code,
        name: item.product.name,
        warehouse: item.warehouse.name,
        location: item.location.name,
        qty: item.availableQuantity,
        status: item.status,
      });
    });

    // Formatting
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    return (await workbook.xlsx.writeBuffer()) as any;
  }
}
