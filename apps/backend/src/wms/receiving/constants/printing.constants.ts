/**
 * Label Printing Constants for Receiving Module
 *
 * This file contains templates and configurations for printing
 * reception labels and documents.
 */

export const LABEL_TYPES = {
  PRODUCT_LABEL: 'PRODUCT_LABEL',
  LOCATION_LABEL: 'LOCATION_LABEL',
  RECEIVING_SUMMARY: 'RECEIVING_SUMMARY',
} as const;

export type LabelType = (typeof LABEL_TYPES)[keyof typeof LABEL_TYPES];

export interface LabelPrintData {
  type: LabelType;
  data: Record<string, any>;
}

/**
 * Product Label Template
 * Used when receiving products to identify them
 */
export const PRODUCT_LABEL_TEMPLATE = {
  width: '4in',
  height: '2in',
  fields: [
    { name: 'productCode', label: 'Product Code', x: 10, y: 10, fontSize: 14 },
    { name: 'productName', label: 'Product Name', x: 10, y: 30, fontSize: 12 },
    { name: 'barcode', label: 'Barcode', x: 10, y: 50, fontSize: 10 },
    { name: 'quantity', label: 'Quantity', x: 10, y: 70, fontSize: 12 },
    { name: 'location', label: 'Location', x: 10, y: 90, fontSize: 10 },
    { name: 'receivedDate', label: 'Received Date', x: 10, y: 110, fontSize: 10 },
  ],
};

/**
 * Location Label Template
 * Used to print location identifiers
 */
export const LOCATION_LABEL_TEMPLATE = {
  width: '3in',
  height: '2in',
  fields: [
    { name: 'locationBarcode', label: 'Location Barcode', x: 10, y: 10, fontSize: 12 },
    { name: 'locationName', label: 'Location Name', x: 10, y: 30, fontSize: 14 },
    { name: 'zone', label: 'Zone', x: 10, y: 50, fontSize: 10 },
    { name: 'capacity', label: 'Capacity', x: 10, y: 70, fontSize: 10 },
  ],
};

/**
 * Receiving Summary Template
 * Printed document showing all items in a receiving order
 */
export const RECEIVING_SUMMARY_TEMPLATE = {
  pageSize: 'letter',
  orientation: 'portrait',
  header: {
    title: 'Receiving Order Summary',
    fields: ['orderNumber', 'supplierName', 'receivedDate', 'warehouse'],
  },
  lineItems: {
    columns: [
      { name: 'productCode', label: 'Product Code', width: '15%' },
      { name: 'productName', label: 'Product Name', width: '30%' },
      { name: 'expectedQty', label: 'Expected', width: '10%', align: 'right' },
      { name: 'receivedQty', label: 'Received', width: '10%', align: 'right' },
      { name: 'damagedQty', label: 'Damaged', width: '10%', align: 'right' },
      { name: 'location', label: 'Location', width: '15%' },
      { name: 'notes', label: 'Notes', width: '10%' },
    ],
  },
  footer: {
    fields: ['totalLines', 'totalReceived', 'totalDamaged', 'receivedBy'],
  },
};

/**
 * Print Configuration
 */
export const PRINT_CONFIG = {
  dpi: 203, // Dots per inch for label printers
  encoding: 'UTF-8',
  barcodeType: 'CODE128', // Default barcode type
  barcodeHeight: 50, // Barcode height in pixels
  margins: {
    top: 5,
    right: 5,
    bottom: 5,
    left: 5,
  },
};

/**
 * Label Format Helpers
 */
export const formatProductLabel = (data: {
  productCode: string;
  productName: string;
  barcode: string;
  quantity: number;
  location: string;
  receivedDate: Date;
}): LabelPrintData => ({
  type: LABEL_TYPES.PRODUCT_LABEL,
  data: {
    productCode: data.productCode,
    productName: data.productName,
    barcode: data.barcode,
    quantity: data.quantity.toString(),
    location: data.location,
    receivedDate: data.receivedDate.toLocaleDateString(),
  },
});

export const formatLocationLabel = (data: {
  locationBarcode: string;
  locationName: string;
  zone: string;
  capacity: number;
}): LabelPrintData => ({
  type: LABEL_TYPES.LOCATION_LABEL,
  data: {
    locationBarcode: data.locationBarcode,
    locationName: data.locationName,
    zone: data.zone,
    capacity: data.capacity.toString(),
  },
});

export const formatReceivingSummary = (data: {
  orderNumber: string;
  supplierName: string;
  receivedDate: Date;
  warehouse: string;
  lines: Array<{
    productCode: string;
    productName: string;
    expectedQty: number;
    receivedQty: number;
    damagedQty: number;
    location: string;
    notes?: string;
  }>;
  receivedBy: string;
}): LabelPrintData => ({
  type: LABEL_TYPES.RECEIVING_SUMMARY,
  data: {
    orderNumber: data.orderNumber,
    supplierName: data.supplierName,
    receivedDate: data.receivedDate.toLocaleDateString(),
    warehouse: data.warehouse,
    lines: data.lines,
    totalLines: data.lines.length,
    totalReceived: data.lines.reduce((sum, line) => sum + line.receivedQty, 0),
    totalDamaged: data.lines.reduce((sum, line) => sum + line.damagedQty, 0),
    receivedBy: data.receivedBy,
  },
});
