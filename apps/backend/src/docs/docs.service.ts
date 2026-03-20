import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface DocEntry {
  module: string;
  path: string;
}

@Injectable()
export class DocsService {
  // ── Raíz donde viven los .doc.txt ─────────────────────────────────────────
  private readonly srcRoot = path.resolve(__dirname, '..');

  // ── Lista todos los archivos .doc.txt disponibles ─────────────────────────
  listDocs(): DocEntry[] {
    const results: DocEntry[] = [];
    this.scanDir(this.srcRoot, results);
    return results.sort((a, b) => a.module.localeCompare(b.module));
  }

  // ── Devuelve el contenido de un .doc.txt por nombre de módulo ──────────────
  getDoc(module: string): string {
    const all = this.listDocs();
    const entry = all.find((e) => e.module === module);

    if (!entry) {
      const available = all.map((e) => e.module).join(', ');
      throw new NotFoundException(
        `No documentation found for module "${module}". Available: ${available}`
      );
    }

    return fs.readFileSync(entry.path, 'utf-8');
  }

  // ── Escaneo recursivo buscando archivos *.doc.txt ─────────────────────────
  private scanDir(dir: string, results: DocEntry[]): void {
    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        this.scanDir(fullPath, results);
      } else if (entry.isFile() && entry.name.endsWith('.doc.txt')) {
        results.push({
          module: this.resolveModuleName(fullPath, entry.name),
          path: fullPath,
        });
      }
    }
  }

  // ── Deriva un nombre de módulo legible a partir de la ruta del archivo ─────
  // Ejemplo: wms/picking/picking.controller.doc.txt  →  wms/picking
  //          wms/warehouses/warehouses.doc.txt       →  wms/warehouses
  //          .doc.txt (raíz)                         →  root
  private resolveModuleName(fullPath: string, fileName: string): string {
    const relative = path.relative(this.srcRoot, fullPath);
    const dir = path.dirname(relative);

    if (dir === '.') {
      // archivo en la raíz de src (o justo fuera de ella)
      return 'root';
    }

    // Normalizar separadores a slash
    return dir.replace(/\\/g, '/');
  }
}
