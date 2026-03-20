import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { DocsService } from './docs.service';
import { Public } from '../app/auth/decorators/public.decorator';

@Controller('docs')
@Public()
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  // ── GET /api/docs ─────────────────────────────────────────────────────────
  // Lista todos los módulos que tienen documentación disponible
  @Get()
  listDocs() {
    const docs = this.docsService.listDocs();
    return {
      success: true,
      data: docs.map((d) => ({
        module: d.module,
        url: `/api/docs/${encodeURIComponent(d.module)}`,
      })),
    };
  }

  // ── GET /api/docs/:module ──────────────────────────────────────────────────
  // Sirve el contenido del .doc.txt del módulo como text/plain
  // Ejemplo: GET /api/docs/wms%2Fpicking
  @Get('*')
  getDoc(@Param('0') module: string, @Res() res: Response): void {
    const content = this.docsService.getDoc(module);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(content);
  }
}
