import { Injectable } from '@nestjs/common';
import { ApiResponse } from '@cadena24-wms/shared';

@Injectable()
export class AppService {
  getHealth(): ApiResponse<{ status: string; version: string }> {
    return {
      success: true,
      message: 'Cadena24 WMS API is running',
      data: {
        status: 'healthy',
        version: '1.0.0',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
