import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CreateProductDto, UpdateProductDto, QueryProductDto } from './dto';
import { generateBarcode, isValidCode128 } from './utils/barcode-generator';

@Injectable()
export class ProductsService {
  constructor(private repository: ProductsRepository) {}

  async create(createProductDto: CreateProductDto) {
    const code = createProductDto.code.trim();
    createProductDto.code = code;

    // Auto-generate barcode if not provided
    if (!createProductDto.barcode || createProductDto.barcode.trim() === '') {
      createProductDto.barcode = generateBarcode();
    } else {
      createProductDto.barcode = createProductDto.barcode.trim();
    }

    // Validate CODE128 format
    if (!isValidCode128(createProductDto.barcode)) {
      throw new BadRequestException(
        'Código de barras inválido. Debe contener solo caracteres ASCII (máx. 48 caracteres)'
      );
    }

    // Validar que el código del producto no exista
    const existingProduct = await this.repository.findByCode(code);
    if (existingProduct) {
      throw new ConflictException(`Producto con código "${code}" ya existe`);
    }

    // Validar que el código de barras no exista
    const existingBarcode = await this.repository.findByBarcode(createProductDto.barcode);
    if (existingBarcode) {
      throw new ConflictException(
        `El código de barras "${createProductDto.barcode}" ya está en uso`
      );
    }

    // Validar niveles de stock
    this.validateStockLevels(createProductDto);

    return this.repository.create(createProductDto);
  }

  async findAll(query: QueryProductDto) {
    return this.repository.findAll(query);
  }

  async findOne(id: number) {
    const product = await this.repository.findOne(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findByBarcode(barcode: string) {
    const product = await this.repository.findByBarcode(barcode);
    if (!product) {
      throw new NotFoundException(`Product with barcode ${barcode} not found`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.findOne(id); // Validar que existe

    // Validar que el código del producto no exista si se está actualizando
    if (updateProductDto.code) {
      const code = updateProductDto.code.trim();
      updateProductDto.code = code;
      const existingProduct = await this.repository.findByCode(code);
      if (existingProduct && existingProduct.id !== id) {
        throw new ConflictException(`Producto con código "${code}" ya existe`);
      }
    }

    // Validar y actualizar código de barras si se proporciona
    if (updateProductDto.barcode !== undefined) {
      updateProductDto.barcode = updateProductDto.barcode.trim();

      // Validate CODE128 format
      if (!isValidCode128(updateProductDto.barcode)) {
        throw new BadRequestException(
          'Código de barras inválido. Debe contener solo caracteres ASCII (máx. 48 caracteres)'
        );
      }

      // Validar que el código de barras no esté en uso por otro producto
      const existingBarcode = await this.repository.findByBarcode(updateProductDto.barcode);
      if (existingBarcode && existingBarcode.id !== id) {
        throw new ConflictException(
          `El código de barras "${updateProductDto.barcode}" ya está en uso`
        );
      }
    }

    this.validateStockLevels(updateProductDto);

    return this.repository.update(id, updateProductDto);
  }

  async remove(id: number) {
    await this.findOne(id); // Validar que existe
    return this.repository.delete(id);
  }

  async addBarcode(productId: number, barcode: string, type: string, isPrimary: boolean = false) {
    await this.findOne(productId); // Validar que el producto existe

    // Validar que el código de barras no exista
    const existing = await this.repository.findByBarcode(barcode);
    if (existing) {
      throw new ConflictException(`El código de barras "${barcode}" ya está en uso`);
    }

    return this.repository.addBarcode(productId, barcode, type, isPrimary);
  }

  async removeBarcode(productId: number, barcodeId: number) {
    await this.findOne(productId); // Validar que el producto existe
    return this.repository.removeBarcode(barcodeId);
  }

  async getLowStockProducts() {
    return this.repository.getLowStockProducts();
  }

  async validateProductCode(code: string) {
    const product = await this.repository.findByCode(code);
    return {
      exists: !!product,
      productId: product?.id || null,
      code,
    };
  }

  private validateStockLevels(data: any) {
    const { minStock, maxStock, reorderPoint } = data;

    if (maxStock !== undefined && minStock !== undefined && maxStock < minStock) {
      throw new BadRequestException('maxStock must be greater than or equal to minStock');
    }

    if (reorderPoint !== undefined && minStock !== undefined && reorderPoint < minStock) {
      throw new BadRequestException('reorderPoint must be greater than or equal to minStock');
    }

    if (reorderPoint !== undefined && maxStock !== undefined && reorderPoint > maxStock) {
      throw new BadRequestException('reorderPoint must be less than or equal to maxStock');
    }
  }
}
