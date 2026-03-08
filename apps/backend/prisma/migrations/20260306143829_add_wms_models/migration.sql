-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(100) NULL,
    `uom` VARCHAR(20) NOT NULL,
    `minStock` DOUBLE NOT NULL DEFAULT 0,
    `maxStock` DOUBLE NOT NULL DEFAULT 0,
    `reorderPoint` DOUBLE NOT NULL DEFAULT 0,
    `reorderQuantity` DOUBLE NOT NULL DEFAULT 0,
    `weight` DOUBLE NULL DEFAULT 0,
    `width` DOUBLE NULL DEFAULT 0,
    `height` DOUBLE NULL DEFAULT 0,
    `depth` DOUBLE NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_barcodes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `barcode` VARCHAR(100) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `product_barcodes_barcode_key`(`barcode`),
    INDEX `product_barcodes_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warehouses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `zipCode` VARCHAR(20) NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `warehouses_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `locations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `warehouseId` INTEGER NOT NULL,
    `zone` VARCHAR(50) NOT NULL,
    `row` VARCHAR(50) NOT NULL,
    `position` VARCHAR(50) NOT NULL,
    `level` VARCHAR(50) NOT NULL,
    `barcode` VARCHAR(100) NOT NULL,
    `fullPath` VARCHAR(500) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `sequence` INTEGER NOT NULL DEFAULT 0,
    `height` DOUBLE NOT NULL DEFAULT 0,
    `capacity` DOUBLE NOT NULL DEFAULT 0,
    `maxWeight` DOUBLE NOT NULL DEFAULT 0,
    `allowMixedProducts` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `locations_barcode_key`(`barcode`),
    INDEX `locations_warehouseId_idx`(`warehouseId`),
    INDEX `locations_barcode_idx`(`barcode`),
    INDEX `locations_type_idx`(`type`),
    UNIQUE INDEX `locations_warehouseId_zone_row_position_level_key`(`warehouseId`, `zone`, `row`, `position`, `level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `locationId` INTEGER NOT NULL,
    `warehouseId` INTEGER NOT NULL,
    `quantity` DOUBLE NOT NULL DEFAULT 0,
    `availableQuantity` DOUBLE NOT NULL DEFAULT 0,
    `reservedQuantity` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'available',
    `lastCountDate` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `inventories_productId_idx`(`productId`),
    INDEX `inventories_locationId_idx`(`locationId`),
    INDEX `inventories_warehouseId_idx`(`warehouseId`),
    UNIQUE INDEX `inventories_productId_locationId_key`(`productId`, `locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `warehouseId` INTEGER NOT NULL,
    `fromLocationId` INTEGER NULL,
    `toLocationId` INTEGER NULL,
    `quantity` DOUBLE NOT NULL DEFAULT 0,
    `transactionType` VARCHAR(20) NOT NULL,
    `referenceType` VARCHAR(50) NOT NULL,
    `referenceId` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `userId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `inventory_transactions_productId_idx`(`productId`),
    INDEX `inventory_transactions_warehouseId_idx`(`warehouseId`),
    INDEX `inventory_transactions_referenceType_referenceId_idx`(`referenceType`, `referenceId`),
    INDEX `inventory_transactions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_adjustments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adjustmentNumber` VARCHAR(50) NOT NULL,
    `warehouseId` INTEGER NOT NULL,
    `reason` VARCHAR(50) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `notes` TEXT NULL,
    `approvedBy` INTEGER NULL,
    `createdBy` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedAt` DATETIME(3) NULL,

    UNIQUE INDEX `inventory_adjustments_adjustmentNumber_key`(`adjustmentNumber`),
    INDEX `inventory_adjustments_warehouseId_idx`(`warehouseId`),
    INDEX `inventory_adjustments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_adjustment_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adjustmentId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `locationId` INTEGER NOT NULL,
    `systemQuantity` DOUBLE NOT NULL DEFAULT 0,
    `physicalQuantity` DOUBLE NOT NULL DEFAULT 0,
    `difference` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `inventory_adjustment_lines_adjustmentId_idx`(`adjustmentId`),
    INDEX `inventory_adjustment_lines_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `receiving_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNumber` VARCHAR(50) NOT NULL,
    `warehouseId` INTEGER NOT NULL,
    `supplierName` VARCHAR(255) NOT NULL,
    `supplierCode` VARCHAR(50) NULL,
    `purchaseOrderNumber` VARCHAR(50) NULL,
    `expectedDate` DATETIME(3) NULL,
    `receivedDate` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `createdBy` INTEGER NULL,
    `receivedBy` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `receiving_orders_orderNumber_key`(`orderNumber`),
    INDEX `receiving_orders_warehouseId_idx`(`warehouseId`),
    INDEX `receiving_orders_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `receiving_order_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `receivingOrderId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `locationId` INTEGER NULL,
    `expectedQuantity` DOUBLE NOT NULL DEFAULT 0,
    `receivedQuantity` DOUBLE NOT NULL DEFAULT 0,
    `damageQuantity` DOUBLE NOT NULL DEFAULT 0,
    `unitCost` DOUBLE NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `receivedAt` DATETIME(3) NULL,

    INDEX `receiving_order_lines_receivingOrderId_idx`(`receivingOrderId`),
    INDEX `receiving_order_lines_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movement_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNumber` VARCHAR(50) NOT NULL,
    `warehouseId` INTEGER NOT NULL,
    `movementType` VARCHAR(20) NOT NULL,
    `reason` VARCHAR(255) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `createdBy` INTEGER NULL,
    `executedBy` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `movement_orders_orderNumber_key`(`orderNumber`),
    INDEX `movement_orders_warehouseId_idx`(`warehouseId`),
    INDEX `movement_orders_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movement_order_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `movementOrderId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `fromLocationId` INTEGER NOT NULL,
    `toLocationId` INTEGER NOT NULL,
    `quantity` DOUBLE NOT NULL DEFAULT 0,
    `movedQuantity` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `executedAt` DATETIME(3) NULL,

    INDEX `movement_order_lines_movementOrderId_idx`(`movementOrderId`),
    INDEX `movement_order_lines_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNumber` VARCHAR(50) NOT NULL,
    `warehouseId` INTEGER NOT NULL,
    `customerName` VARCHAR(255) NOT NULL,
    `customerCode` VARCHAR(50) NULL,
    `customerPhone` VARCHAR(50) NULL,
    `customerEmail` VARCHAR(100) NULL,
    `shippingAddress` VARCHAR(255) NULL,
    `shippingCity` VARCHAR(100) NULL,
    `shippingState` VARCHAR(100) NULL,
    `shippingZipCode` VARCHAR(20) NULL,
    `orderDate` DATETIME(3) NOT NULL,
    `requiredDate` DATETIME(3) NULL,
    `shippedDate` DATETIME(3) NULL,
    `priority` VARCHAR(20) NOT NULL DEFAULT 'normal',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `totalAmount` DOUBLE NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `createdBy` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sales_orders_orderNumber_key`(`orderNumber`),
    INDEX `sales_orders_warehouseId_idx`(`warehouseId`),
    INDEX `sales_orders_status_idx`(`status`),
    INDEX `sales_orders_priority_idx`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_order_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `salesOrderId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `orderedQuantity` DOUBLE NOT NULL DEFAULT 0,
    `pickedQuantity` DOUBLE NOT NULL DEFAULT 0,
    `shippedQuantity` DOUBLE NOT NULL DEFAULT 0,
    `unitPrice` DOUBLE NOT NULL DEFAULT 0,
    `subtotal` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `notes` TEXT NULL,

    INDEX `sales_order_lines_salesOrderId_idx`(`salesOrderId`),
    INDEX `sales_order_lines_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pick_lists` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pickListNumber` VARCHAR(50) NOT NULL,
    `salesOrderId` INTEGER NOT NULL,
    `warehouseId` INTEGER NOT NULL,
    `pickerId` INTEGER NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `totalLines` INTEGER NOT NULL DEFAULT 0,
    `pickedLines` INTEGER NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `pick_lists_pickListNumber_key`(`pickListNumber`),
    INDEX `pick_lists_salesOrderId_idx`(`salesOrderId`),
    INDEX `pick_lists_warehouseId_idx`(`warehouseId`),
    INDEX `pick_lists_pickerId_idx`(`pickerId`),
    INDEX `pick_lists_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pick_list_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pickListId` INTEGER NOT NULL,
    `salesOrderLineId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `locationId` INTEGER NOT NULL,
    `quantityToPick` DOUBLE NOT NULL DEFAULT 0,
    `quantityPicked` DOUBLE NOT NULL DEFAULT 0,
    `sequence` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `pickedAt` DATETIME(3) NULL,

    INDEX `pick_list_lines_pickListId_idx`(`pickListId`),
    INDEX `pick_list_lines_salesOrderLineId_idx`(`salesOrderLineId`),
    INDEX `pick_list_lines_productId_idx`(`productId`),
    INDEX `pick_list_lines_locationId_idx`(`locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_barcodes` ADD CONSTRAINT `product_barcodes_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `locations` ADD CONSTRAINT `locations_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventories` ADD CONSTRAINT `inventories_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventories` ADD CONSTRAINT `inventories_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventories` ADD CONSTRAINT `inventories_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_fromLocationId_fkey` FOREIGN KEY (`fromLocationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_toLocationId_fkey` FOREIGN KEY (`toLocationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_adjustments` ADD CONSTRAINT `inventory_adjustments_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_adjustments` ADD CONSTRAINT `inventory_adjustments_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_adjustments` ADD CONSTRAINT `inventory_adjustments_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_adjustment_lines` ADD CONSTRAINT `inventory_adjustment_lines_adjustmentId_fkey` FOREIGN KEY (`adjustmentId`) REFERENCES `inventory_adjustments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_adjustment_lines` ADD CONSTRAINT `inventory_adjustment_lines_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_adjustment_lines` ADD CONSTRAINT `inventory_adjustment_lines_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `receiving_orders` ADD CONSTRAINT `receiving_orders_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `receiving_orders` ADD CONSTRAINT `receiving_orders_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `receiving_orders` ADD CONSTRAINT `receiving_orders_receivedBy_fkey` FOREIGN KEY (`receivedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `receiving_order_lines` ADD CONSTRAINT `receiving_order_lines_receivingOrderId_fkey` FOREIGN KEY (`receivingOrderId`) REFERENCES `receiving_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `receiving_order_lines` ADD CONSTRAINT `receiving_order_lines_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `receiving_order_lines` ADD CONSTRAINT `receiving_order_lines_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movement_orders` ADD CONSTRAINT `movement_orders_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movement_orders` ADD CONSTRAINT `movement_orders_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movement_orders` ADD CONSTRAINT `movement_orders_executedBy_fkey` FOREIGN KEY (`executedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movement_order_lines` ADD CONSTRAINT `movement_order_lines_movementOrderId_fkey` FOREIGN KEY (`movementOrderId`) REFERENCES `movement_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movement_order_lines` ADD CONSTRAINT `movement_order_lines_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movement_order_lines` ADD CONSTRAINT `movement_order_lines_fromLocationId_fkey` FOREIGN KEY (`fromLocationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movement_order_lines` ADD CONSTRAINT `movement_order_lines_toLocationId_fkey` FOREIGN KEY (`toLocationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_orders` ADD CONSTRAINT `sales_orders_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_orders` ADD CONSTRAINT `sales_orders_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_order_lines` ADD CONSTRAINT `sales_order_lines_salesOrderId_fkey` FOREIGN KEY (`salesOrderId`) REFERENCES `sales_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_order_lines` ADD CONSTRAINT `sales_order_lines_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pick_lists` ADD CONSTRAINT `pick_lists_salesOrderId_fkey` FOREIGN KEY (`salesOrderId`) REFERENCES `sales_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pick_lists` ADD CONSTRAINT `pick_lists_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pick_lists` ADD CONSTRAINT `pick_lists_pickerId_fkey` FOREIGN KEY (`pickerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pick_list_lines` ADD CONSTRAINT `pick_list_lines_pickListId_fkey` FOREIGN KEY (`pickListId`) REFERENCES `pick_lists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pick_list_lines` ADD CONSTRAINT `pick_list_lines_salesOrderLineId_fkey` FOREIGN KEY (`salesOrderLineId`) REFERENCES `sales_order_lines`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pick_list_lines` ADD CONSTRAINT `pick_list_lines_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pick_list_lines` ADD CONSTRAINT `pick_list_lines_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
