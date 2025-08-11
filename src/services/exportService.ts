import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import html2canvas from 'html2canvas';
import { Product } from '../types';
import { formatIndianNumber } from '../utils/helpers';

// Note: Using function-style API of jspdf-autotable v5 (autoTable(doc, options))

export interface ExportOptions {
  title: string;
  reportType: string;
  dateRange: { start: string; end: string };
  includeCharts: boolean;
  includeDetails: boolean;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

class ExportService {
  private defaultCompanyInfo = {
    name: 'SmartStock Enterprise',
    address: '123 Business District, Tech City - 500001',
    phone: '+91 98765 43210',
    email: 'info@smartstock.com'
  };

  // Export to PDF with professional formatting
  async exportToPDF(
    data: any, 
    products: Product[], 
    options: ExportOptions,
    chartElements?: HTMLElement[]
  ): Promise<void> {
    try {
      console.log('Starting PDF export with:', { 
        dataExists: !!data, 
        productsCount: products.length, 
        options: options.title,
        chartsCount: chartElements?.length || 0
      });

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

    // Company Header
    const companyInfo = options.companyInfo || this.defaultCompanyInfo;
    
    // Company Logo placeholder
    doc.setFillColor(102, 126, 234);
    doc.rect(20, 15, 15, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SS', 27.5, 25);
    
    // Company Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyInfo.name, 40, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(companyInfo.address, 40, 26);
  doc.text(`${companyInfo.phone} | ${companyInfo.email}`, 40, 31);

    // Report Title
    yPosition = 45;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, yPosition - 5, pageWidth, 15, 'F');
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text(options.title, 20, yPosition + 5);
    
    // Report Info
    yPosition += 20;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Type: ${options.reportType}`, 20, yPosition);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 20, yPosition + 5);
    doc.text(`Period: ${options.dateRange.start} to ${options.dateRange.end}`, 20, yPosition + 10);
    
    yPosition += 25;

    // Include charts if available and requested
    if (options.includeCharts && chartElements && chartElements.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
  doc.text('Visual Analytics', 20, yPosition);
      yPosition += 10;

      for (const chartElement of chartElements) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        try {
          const canvas = await html2canvas(chartElement, {
            scale: 1,
            logging: false,
            useCORS: true,
            allowTaint: true
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = Math.min(170, canvas.width * 0.4);
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          doc.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (error) {
          console.warn('Could not capture chart:', error);
        }
      }
    }

    // Product Details Table
    if (options.includeDetails && products.length > 0) {
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
  doc.text('Product Details', 20, yPosition);
      yPosition += 10;

  const tableData = products.map((product, index) => [
        index + 1,
        product.name || 'N/A',
        product.category || 'N/A',
        product.quantity?.toString() || '0',
        `₹${formatIndianNumber(product.price || 0)}`,
        `₹${formatIndianNumber((product.quantity || 0) * (product.price || 0))}`,
        this.getStockStatus(product)
      ]);

  autoTable(doc as any, {
        head: [['#', 'Product Name', 'Category', 'Stock', 'Price', 'Value', 'Status']],
        body: tableData,
        startY: yPosition,
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 45 },
          2: { cellWidth: 30 },
          3: { halign: 'center', cellWidth: 20 },
          4: { halign: 'right', cellWidth: 25 },
          5: { halign: 'right', cellWidth: 30 },
          6: { halign: 'center', cellWidth: 25 }
        }
      });
    }

    // Summary Statistics
    if (data) {
      const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 20;
      
      if (finalY > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      } else {
        yPosition = finalY + 15;
      }

      doc.setFillColor(67, 233, 123);
      doc.rect(20, yPosition, pageWidth - 40, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', 25, yPosition + 10);
      
      doc.setFontSize(10);
      doc.text(`Total Products: ${products.length}`, 25, yPosition + 18);
      
      const totalValue = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
      doc.text(`Total Inventory Value: ₹${formatIndianNumber(totalValue)}`, 25, yPosition + 25);
      
      const lowStock = products.filter(p => (p.quantity || 0) < 10).length;
      doc.text(`Low Stock Items: ${lowStock}`, 25, yPosition + 32);
    }

    // Footer
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text('Generated by SmartStock Enterprise - Advanced Inventory Management System', 
             pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save the PDF
    const fileName = `${options.reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    console.log('PDF export completed successfully:', fileName);
    } catch (error) {
      console.error('Error during PDF export:', error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Export to Excel with multiple sheets using secure ExcelJS
  async exportToExcel(
    data: any,
    products: Product[],
    options: ExportOptions
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'SmartStock Enterprise';
    workbook.lastModifiedBy = 'SmartStock Enterprise';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Sheet 1: Product Details
    if (products.length > 0) {
      const productSheet = workbook.addWorksheet('Product Details');
      
      // Add headers with styling
      const headers = [
        '#', 'Product Name', 'Barcode', 'Category', 'Supplier', 'Location',
        'Quantity', 'Unit', 'Unit Price', 'Total Value', 'Min Stock Level', 
        'Stock Status', 'Last Updated'
      ];
      
      const headerRow = productSheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF667EEA' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Add product data
      products.forEach((product, index) => {
        const row = productSheet.addRow([
          index + 1,
          product.name || 'N/A',
          product.barcode || 'N/A',
          product.category || 'N/A',
          product.supplier || 'N/A',
          product.location || 'N/A',
          product.quantity || 0,
          product.unit || 'pcs',
          product.price || 0,
          (product.quantity || 0) * (product.price || 0),
          product.minStockLevel || 0,
          this.getStockStatus(product),
          product.updatedAt ? new Date(product.updatedAt).toLocaleString('en-IN') : 'N/A'
        ]);

        // Add alternating row colors
        if (index % 2 === 1) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' }
            };
          });
        }
      });

      // Set column widths
      const columnWidths = [5, 25, 15, 15, 20, 15, 10, 8, 12, 15, 12, 12, 18];
      columnWidths.forEach((width, index) => {
        productSheet.getColumn(index + 1).width = width;
      });
    }

    // Sheet 2: Summary Statistics
    const summarySheet = workbook.addWorksheet('Summary');
    
    const summaryData = [
      ['Report Type', options.reportType],
      ['Generated Date', new Date().toLocaleString('en-IN')],
      ['Report Period', `${options.dateRange.start} to ${options.dateRange.end}`],
      ['Total Products', products.length],
      ['Total Inventory Value', products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0)],
      ['Low Stock Items', products.filter(p => (p.quantity || 0) < (p.minStockLevel || 10)).length],
      ['Out of Stock Items', products.filter(p => (p.quantity || 0) === 0).length],
      ['Categories', new Set(products.map(p => p.category)).size],
      ['Suppliers', new Set(products.map(p => p.supplier)).size]
    ];

    // Add summary header
    const summaryHeaderRow = summarySheet.addRow(['Metric', 'Value']);
    summaryHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Add summary data
    summaryData.forEach((rowData, index) => {
      const row = summarySheet.addRow(rowData);
      if (index % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }
          };
        });
      }
    });

    // Set column widths for summary
    summarySheet.getColumn(1).width = 20;
    summarySheet.getColumn(2).width = 30;

    // Sheet 3: Category Breakdown (if data available)
    if (data?.inventory?.categories) {
      const categorySheet = workbook.addWorksheet('Category Breakdown');
      
      const categoryHeaders = ['Category', 'Value'];
      const categoryHeaderRow = categorySheet.addRow(categoryHeaders);
      categoryHeaderRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF59E0B' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      data.inventory.categories.forEach((category: any, index: number) => {
        const row = categorySheet.addRow([category.name, category.value]);
        if (index % 2 === 1) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' }
            };
          });
        }
      });

      categorySheet.getColumn(1).width = 25;
      categorySheet.getColumn(2).width = 15;
    }

    // Generate and save the file
    const fileName = `${options.reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    // Apply number formats for readability
    const currencyCols = [9, 10]; // Unit Price, Total Value
    currencyCols.forEach((col) => {
      const column = workbook.getWorksheet('Product Details')?.getColumn(col);
      if (column) {
        column.numFmt = '₹#,##0.00';
      }
    });
    const quantityCols = [7, 11]; // Quantity, Min Stock Level
    quantityCols.forEach((col) => {
      const column = workbook.getWorksheet('Product Details')?.getColumn(col);
      if (column) {
        column.numFmt = '#,##0';
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  }

  // Export to CSV
  exportToCSV(products: Product[], options: ExportOptions): void {
    const csvData = products.map((product, index) => ({
      '#': index + 1,
      'Product Name': product.name || 'N/A',
      'Barcode': product.barcode || 'N/A',
      'Category': product.category || 'N/A',
      'Supplier': product.supplier || 'N/A',
      'Location': product.location || 'N/A',
      'Quantity': product.quantity || 0,
      'Unit': product.unit || 'pcs',
      'Unit Price': product.price || 0,
      'Total Value': (product.quantity || 0) * (product.price || 0),
      'Min Stock Level': product.minStockLevel || 0,
      'Stock Status': this.getStockStatus(product),
      'Last Updated': product.updatedAt ? new Date(product.updatedAt).toLocaleString('en-IN') : 'N/A'
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const fileName = `${options.reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);
  }

  // Export all formats (creates a ZIP-like experience)
  async exportAll(
    data: any, 
    products: Product[], 
    options: ExportOptions,
    chartElements?: HTMLElement[]
  ): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    const baseName = `${options.reportType}_report_${timestamp}`;
    
    // Export all formats
    await this.exportToPDF(data, products, { ...options, title: `${options.title} (PDF Export)` }, chartElements);
    await this.exportToExcel(data, products, { ...options, title: `${options.title} (Excel Export)` });
    this.exportToCSV(products, { ...options, title: `${options.title} (CSV Export)` });
    
    // Show success notification
    console.log(`Exported ${baseName} in PDF, Excel, and CSV formats`);
  }

  // Helper method to determine stock status
  private getStockStatus(product: Product): string {
    const quantity = product.quantity || 0;
    const minStockLevel = product.minStockLevel || 10;
    
    if (quantity === 0) return '🔴 Out of Stock';
    if (quantity < minStockLevel) return '🟡 Low Stock';
    if (quantity < minStockLevel * 2) return '🟠 Medium Stock';
    return '🟢 In Stock';
  }

  // Method to capture chart images for PDF
  async captureChartImages(chartContainerIds: string[]): Promise<HTMLElement[]> {
    const chartElements: HTMLElement[] = [];
    
    try {
      for (const id of chartContainerIds) {
        const element = document.getElementById(id);
        if (element) {
          // Wait a moment for charts to render
          await new Promise(resolve => setTimeout(resolve, 100));
          chartElements.push(element);
        } else {
          console.warn(`Chart element with ID '${id}' not found`);
        }
      }
    } catch (error) {
      console.error('Error capturing chart images:', error);
    }
    
    return chartElements;
  }

  // Generate export preview data
  generateExportPreview(products: Product[], options: ExportOptions) {
    return {
      totalRecords: products.length,
      estimatedSize: {
        pdf: `${Math.max(1, Math.ceil(products.length / 50))} pages`,
        excel: `${Math.ceil((products.length + 100) / 1000)} KB`,
        csv: `${Math.ceil(products.length * 0.1)} KB`
      },
      includedFields: [
        'Product Name', 'SKU', 'Category', 'Supplier', 'Location',
        'Quantity', 'Unit Price', 'Total Value', 'Stock Status'
      ],
      summary: {
        totalValue: products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0),
        categories: new Set(products.map(p => p.category)).size,
        suppliers: new Set(products.map(p => p.supplier)).size
      }
    };
  }
}

export default new ExportService();
