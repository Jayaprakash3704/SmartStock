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
  // Remove non-ASCII to avoid PDF font encoding issues
  private sanitize(text: any): string {
    return String(text ?? '').replace(/[^\x00-\x7F]/g, '');
  }

  private toRs(amount: number): string {
    return `Rs. ${formatIndianNumber(amount || 0)}`;
  }
  private defaultCompanyInfo = {
    name: 'SmartStock Enterprise',
    address: '123 Business District, Tech City - 500001',
    phone: '+91 98765 43210',
    email: 'info@smartstock.com'
  };

  // Build dynamic insights per report type based on products and date range
  private buildInsights(reportType: string, products: Product[], dateRange: { start: string; end: string }): string[] {
    const insights: string[] = [];
    const totalProducts = products.length;
    const totalValue = products.reduce((s, p) => s + (p.price || 0) * (p.quantity || 0), 0);
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const suppliers = Array.from(new Set(products.map(p => p.supplier).filter(Boolean)));
  const avgPrice = totalProducts > 0 ? Math.round((products.reduce((s,p)=> s + (p.price||0), 0) / totalProducts) * 100) / 100 : 0;
  const avgQty = totalProducts > 0 ? Math.round((products.reduce((s,p)=> s + (p.quantity||0), 0) / totalProducts) * 100) / 100 : 0;
    if (totalProducts === 0) {
      return [
        `No data available for ${reportType} between ${dateRange.start} and ${dateRange.end}. Please adjust filters or time range.`,
      ];
    }

    if (reportType === 'inventory') {
      const byCategory: Record<string, { qty: number; value: number }> = {};
      let topProductName = 'N/A';
      let topProductValue = 0;
      products.forEach(p => {
        const k = p.category || 'Uncategorized';
        byCategory[k] = byCategory[k] || { qty: 0, value: 0 };
        byCategory[k].qty += p.quantity || 0;
        const v = (p.quantity || 0) * (p.price || 0);
        byCategory[k].value += v;
        if (v > topProductValue) { topProductValue = v; topProductName = p.name || 'Unnamed'; }
      });
      const entries = Object.entries(byCategory).sort((a,b)=> b[1].value - a[1].value);
      const topCat = entries[0];
      const topCatShare = topCat ? Math.round((topCat[1].value / Math.max(1,totalValue)) * 100) : 0;
      const lowStockCount = products.filter(p => (p.quantity || 0) < (p.minStockLevel || 10) && (p.quantity || 0) > 0).length;
      const outOfStock = products.filter(p => (p.quantity || 0) === 0).length;

      insights.push(
        `Inventory spans ${new Set(products.map(p=>p.category).filter(Boolean)).size} categories with a total value of ${this.toRs(totalValue)}.`,
        topCat ? `Category '${this.sanitize(topCat[0])}' leads with ${this.toRs(topCat[1].value)} (${topCatShare}% of inventory value).` : 'Category distribution not available.',
        `Top product by value is '${this.sanitize(topProductName)}' (${this.toRs(topProductValue)}).`,
        `Stock risks: ${lowStockCount} low-stock and ${outOfStock} out-of-stock items detected. Consider reordering high-value movers first.`,
        `Average unit price ${this.toRs(avgPrice)} and average on-hand quantity ${avgQty}.`,
        categories.length > 1 ? `Top 3 categories account for ~${Math.min(100, Math.round(entries.slice(0,3).reduce((s,[,v])=> s+v.value,0)/Math.max(1,totalValue)*100))}% of value.` : 'Single category concentration detected.'
      );
    }

    if (reportType === 'sales') {
      // Synthetic monthly sales based on products as in UI
      const totalRevenue = products.reduce((s, p) => s + (p.price || 0) * (p.quantity || 0) * 0.6, 0);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const monthlySales = months.map((m, idx) => {
        const base = totalRevenue / months.length; const sales = Math.round(base * (0.9 + idx * 0.05));
        return { month: m, sales, target: Math.round(sales * 1.1) };
      });
      const first = monthlySales[0]?.sales || 0;
      const last = monthlySales[monthlySales.length-1]?.sales || 0;
      const growth = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
      const aboveTargetMonths = monthlySales.filter(m => m.sales >= m.target).length;
      const productPerformance = [...products]
        .map(p => ({ name: p.name || 'Unnamed', revenue: Math.round((p.price || 0) * (p.quantity || 0) * 0.6) }))
        .sort((a,b)=> b.revenue - a.revenue);
      const bestProduct = productPerformance[0];
      const customerSegments = [
        { name: 'Retail', share: 45 }, { name: 'Wholesale', share: 35 }, { name: 'Online', share: 20 }
      ];
      const topSegment = customerSegments[0];

      insights.push(
        `Estimated revenue for the period is ${this.toRs(totalRevenue)} with a ${growth}% trend from start to end of the series.`,
        `${aboveTargetMonths} of ${monthlySales.length} months meet or beat target.`,
        bestProduct ? `Top-performing product: '${this.sanitize(bestProduct.name)}' contributing ~${this.toRs(bestProduct.revenue)}.` : 'No top product identified.',
        `Customer mix skews towards ${topSegment.name} (~${topSegment.share}%), followed by Wholesale and Online.`,
        `Seasonality: last month vs first month delta ${growth}% indicates ${growth>=0?'upward':'downward'} momentum.`,
        `Avg monthly sales ~${this.toRs(Math.round(totalRevenue/6))}; targets set ~10% above observed levels.`
      );
    }

    if (reportType === 'financial') {
      const totalRevenue = products.reduce((s, p) => s + (p.price || 0) * (p.quantity || 0) * 0.7, 0);
      const expenses = Math.round(totalRevenue * 0.65);
      const profit = totalRevenue - expenses;
      const margin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;
      const expenseCategories = [
        { k: 'COGS', v: Math.round(totalRevenue * 0.455) },
        { k: 'Operations', v: Math.round(totalRevenue * 0.15) },
        { k: 'Marketing', v: Math.round(totalRevenue * 0.065) },
        { k: 'Administration', v: Math.round(totalRevenue * 0.065) }
      ].sort((a,b)=> b.v - a.v);
      insights.push(
        `Estimated revenue ${this.toRs(totalRevenue)}, expenses ${this.toRs(expenses)}, profit ${this.toRs(profit)} (margin ~${margin}%).`,
        `Largest cost center: ${expenseCategories[0].k} at ${this.toRs(expenseCategories[0].v)}.`,
        `Focus on cost control in top categories to lift margins while preserving revenue growth.`,
        `Working estimate suggests breakeven at ~${this.toRs(Math.round(expenses))}.`,
        `Revenue quality: average unit price ${this.toRs(avgPrice)} across ${categories.length} categories and ${suppliers.length} suppliers.`
      );
    }

    if (reportType === 'gst') {
      const sales = products.reduce((s, p) => s + (p.price || 0) * (p.quantity || 0) * 0.6, 0);
      const collected = sales * 0.18;
      const avgMonthly = Math.round(collected / 6);
      const rateSplit = [
        { rate: '18%', amount: Math.round(collected * 0.7) },
        { rate: '12%', amount: Math.round(collected * 0.2) },
        { rate: '5%', amount: Math.round(collected * 0.1) }
      ];
      const topRate = rateSplit.sort((a,b)=> b.amount - a.amount)[0];
      insights.push(
        `Estimated GST collected: ${this.toRs(collected)} (~${this.toRs(avgMonthly)}/month).`,
        `${topRate.rate} slab dominates collections (${this.toRs(topRate.amount)}).`,
        `Maintain timely filings and reconcile ITC to sustain high compliance scores.`,
        `Effective tax ratio vs sales ~18% (assumes standard rate on eligible supplies).`,
        `Monitor rate mix changes; a shift towards lower slabs will impact net liability.`
      );
    }

    return insights;
  }

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

  // Use standard Helvetica to avoid glyph/encoding issues and define margins
  const doc = new jsPDF('p', 'mm', 'a4', true);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin + 5;

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
  // Remove non-ASCII characters to avoid PDF encoding issues
  const safeTitle = String(options.title).replace(/[^\x00-\x7F]/g, '');
  doc.text(safeTitle, margin, yPosition + 5);
    
    // Report Info
    yPosition += 20;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
  doc.text(`Report Type: ${String(options.reportType)}`, margin, yPosition);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, yPosition + 5);
  doc.text(`Period: ${options.dateRange.start} to ${options.dateRange.end}`, margin, yPosition + 10);
    
    yPosition += 25;

    // Include charts if available and requested
    if (options.includeCharts && chartElements && chartElements.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
  doc.text('Visual Analytics', margin, yPosition);
      yPosition += 10;

      for (const chartElement of chartElements) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        try {
          const canvas = await html2canvas(chartElement, {
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            removeContainer: true,
            foreignObjectRendering: true,
            imageTimeout: 15000,
            onclone: (clonedDoc) => {
              // Force light theme colors for PDF export
              const clonedCharts = clonedDoc.querySelectorAll('.recharts-wrapper');
              clonedCharts.forEach(chart => {
                (chart as HTMLElement).style.backgroundColor = '#ffffff';
              });
            }
          });
          
          const imgData = canvas.toDataURL('image/png', 1.0);
          const imgWidth = Math.min(pageWidth - margin * 2, canvas.width * 0.3);
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          doc.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 15;
        } catch (error) {
          console.warn('Could not capture chart:', error);
          // Add fallback text when chart capture fails
          doc.setFontSize(10);
          doc.text('Chart could not be rendered in PDF', margin, yPosition);
          yPosition += 20;
        }
      }
    }

  // Product Details Table (include for all report types when requested)
  const shouldIncludeDetails = options.includeDetails;
  if (shouldIncludeDetails && products.length > 0) {
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
  doc.text('Product Details', margin, yPosition);
      yPosition += 10;

  const tableData = products.map((product, index) => [
        index + 1,
        this.sanitize(product.name || 'N/A'),
        this.sanitize(product.category || 'N/A'),
        String(product.quantity ?? 0),
        this.toRs(product.price || 0),
        this.toRs((product.quantity || 0) * (product.price || 0)),
        this.sanitize(this.getStockStatus(product))
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
        },
        margin: { left: margin, right: margin }
      });
    }

    // Insights for all reports
    {
      const insights = this.buildInsights(options.reportType, products, options.dateRange);
      if (yPosition > pageHeight - 80) { doc.addPage(); yPosition = 20; }
      doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(55,65,81);
  doc.text('Insights', margin, yPosition);
      yPosition += 8;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(31,41,55);
      const maxWidth = pageWidth - margin * 2;
      insights.forEach((line) => {
        const safe = this.sanitize(line);
        const split = doc.splitTextToSize(`- ${safe}`, maxWidth);
        if (yPosition + split.length * 5 > pageHeight - 20) { doc.addPage(); yPosition = 20; }
        doc.text(split, margin, yPosition);
        yPosition += split.length * 5 + 2;
      });
      yPosition += 4;
    }

    // Summary & KPIs (compact table to reduce whitespace)
    if (data) {
      const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 10;
      
      if (finalY > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      } else {
        yPosition = finalY + 10;
      }

      // Section header
  doc.setFillColor(67, 233, 123);
  doc.rect(margin, yPosition, pageWidth - margin * 2, 16, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
  doc.text('Summary & KPIs', margin, yPosition + 11);
      yPosition += 22;

      // Compute KPIs
      const totalValueKP = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
      const lowStockKP = products.filter(p => (p.quantity || 0) < (p.minStockLevel || 10) && (p.quantity || 0) > 0).length;
      const outOfStockKP = products.filter(p => (p.quantity || 0) === 0).length;
      const categoriesCountKP = new Set(products.map(p => p.category).filter(Boolean)).size;
      const suppliersCountKP = new Set(products.map(p => p.supplier).filter(Boolean)).size;

      // Build a two-column table of KPIs
      const productCount = products.length;
      const avgUnitPriceKP = productCount > 0 ? products.reduce((s,p)=> s + (p.price||0), 0) / productCount : 0;
      const avgQuantityKP = productCount > 0 ? Math.round(products.reduce((s,p)=> s + (p.quantity||0), 0) / productCount) : 0;

      const kpiRows = [
        ['Total Products', String(products.length)],
        ['Total Inventory Value', this.toRs(totalValueKP)],
        ['Low Stock Items', String(lowStockKP)],
        ['Out of Stock Items', String(outOfStockKP)],
        ['Categories', String(categoriesCountKP)],
        ['Suppliers', String(suppliersCountKP)],
        ['Avg Unit Price', this.toRs(avgUnitPriceKP)],
        ['Avg Quantity', String(avgQuantityKP)]
      ];

      autoTable(doc as any, {
        head: [['Metric', 'Value']],
        body: kpiRows,
        startY: yPosition,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 90 } },
        margin: { left: margin, right: margin }
      });
    }

    // Footer
  doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
  doc.text('Generated by SmartStock Enterprise - Advanced Inventory Management System', 
       pageWidth / 2, pageHeight - 8, { align: 'center' });

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

    // Extra sheets for Detailed (combined) report
    if (options.reportType === 'detailed') {
      // Inventory Summary
      const invSheet = workbook.addWorksheet('Inventory Summary');
      const categoryAgg: Record<string, { qty: number; value: number }> = {};
      products.forEach(p => {
        const k = p.category || 'Uncategorized';
        categoryAgg[k] = categoryAgg[k] || { qty: 0, value: 0 };
        categoryAgg[k].qty += p.quantity || 0;
        categoryAgg[k].value += (p.quantity || 0) * (p.price || 0);
      });
      invSheet.addRow(['Category', 'Total Qty', 'Total Value']).eachCell(c => {
        c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
        c.alignment = { horizontal: 'center' };
      });
      Object.entries(categoryAgg).forEach(([name, v], i) => {
        const r = invSheet.addRow([name, v.qty, v.value]);
        if (i % 2 === 1) r.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } });
      });
      invSheet.getColumn(1).width = 25; invSheet.getColumn(2).width = 12; invSheet.getColumn(3).width = 18;

      // Sales Summary
      const salesSheet = workbook.addWorksheet('Sales Summary');
      const totalRevenue = products.reduce((s, p) => s + (p.price || 0) * (p.quantity || 0) * 0.6, 0);
      const months = ['Jan','Feb','Mar','Apr','May','Jun'];
      salesSheet.addRow(['Month','Sales','Target']).eachCell(c => { c.font={bold:true,color:{argb:'FFFFFFFF'}}; c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF97316'}}; c.alignment={horizontal:'center'}; });
      months.forEach((m, idx) => {
        const base = totalRevenue / months.length; const sales = Math.round(base * (0.9 + idx*0.05));
        const row = salesSheet.addRow([m, sales, Math.round(sales*1.1)]);
        if (idx % 2 === 1) row.eachCell(c => c.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFFFF7ED'} });
      });
      salesSheet.getColumn(1).width=10; salesSheet.getColumn(2).width=14; salesSheet.getColumn(3).width=14;

      // Financial Summary
      const finSheet = workbook.addWorksheet('Financial Summary');
      const finRows = [['Metric','Value'], ['Total Revenue', totalRevenue/0.6*0.7], ['Expenses (est.)', (totalRevenue/0.6*0.7)*0.65]]; // rough but consistent with UI
      finRows.forEach((r,i)=>{
        const row = finSheet.addRow(r);
        if(i===0){ row.eachCell(c=>{c.font={bold:true,color:{argb:'FFFFFFFF'}}; c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF10B981'}}; c.alignment={horizontal:'center'};}); }
        else if(i%2===1){ row.eachCell(c=> c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF8FAFC'}}); }
      });
      finSheet.getColumn(1).width=22; finSheet.getColumn(2).width=22;

      // GST Summary
      const gstSheet = workbook.addWorksheet('GST Summary');
      const collected = totalRevenue * 0.18;
      const headers = gstSheet.addRow(['Rate','Amount']);
      headers.eachCell(c=>{c.font={bold:true,color:{argb:'FFFFFFFF'}}; c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFEF4444'}}; c.alignment={horizontal:'center'};});
      const dist = [
        ['18%', Math.round(collected*0.7)],
        ['12%', Math.round(collected*0.2)],
        ['5%', Math.round(collected*0.1)]
      ];
      dist.forEach((r,i)=>{ const row=gstSheet.addRow(r); if(i%2===1) row.eachCell(c=> c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF5F5'}}); });
      gstSheet.getColumn(1).width=10; gstSheet.getColumn(2).width=16;
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
    const rows: any[] = [];
    const productRows = products.map((product, index) => ({
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
    rows.push(...productRows);

    // For detailed report, append section summaries
    if (options.reportType === 'detailed') {
      rows.push({});
      rows.push({ Section: 'Sales Summary', Metric: 'Total Records', Value: products.length });
      const totalRevenue = products.reduce((s,p)=> s + (p.price||0)*(p.quantity||0)*0.6, 0);
      rows.push({ Section: 'Sales Summary', Metric: 'Estimated Sales', Value: totalRevenue });
      rows.push({});
      const invValue = products.reduce((s,p)=> s + (p.price||0)*(p.quantity||0), 0);
      rows.push({ Section: 'Inventory Summary', Metric: 'Inventory Value', Value: invValue });
      rows.push({});
      rows.push({ Section: 'Financial Summary', Metric: 'Revenue (est.)', Value: totalRevenue/0.6*0.7 });
      rows.push({ Section: 'GST Summary', Metric: 'GST Collected (18%)', Value: totalRevenue*0.18 });
    }

    const csv = Papa.unparse(rows);
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

  // Utility: for 'detailed' report, collect chart containers from all sections
  getChartContainerIdsForReport(reportType: string): string[] {
    if (reportType === 'detailed') {
      return ['inventory-charts', 'sales-charts', 'financial-charts', 'gst-charts'];
    }
    return [`${reportType}-charts`];
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
