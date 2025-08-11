import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product } from '../types';
import { productsAPI } from './api';

// Enhanced PDF Generator with better error handling
export class PDFGenerator {
  
  // Test if jsPDF is working properly
  static testPDFGeneration(): boolean {
    try {
      const testPdf = new jsPDF('p', 'pt', 'a4');
      testPdf.text('Test PDF Generation', 50, 50);
      return true;
    } catch (error) {
      console.error('PDF Library Test Failed:', error);
      return false;
    }
  }

  // Simple PDF generation for testing
  static async generateSimplePDF(): Promise<void> {
    try {
      console.log('Starting simple PDF generation...');
      
      // Test PDF library first
      if (!PDFGenerator.testPDFGeneration()) {
        throw new Error('PDF library initialization failed');
      }

      const pdf = new jsPDF('p', 'pt', 'a4');
      
      // Add title
      pdf.setFontSize(18);
      pdf.text('SmartStock Test Report', 50, 50);
      
      // Add current date
      pdf.setFontSize(12);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
      
      // Add some sample data
      pdf.text('This is a test PDF to verify PDF generation is working.', 50, 110);
      
      // Save the PDF
      const filename = `SmartStock_Test_${Date.now()}.pdf`;
      pdf.save(filename);
      
      console.log('Simple PDF generated successfully:', filename);
      
    } catch (error) {
      console.error('Simple PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate inventory PDF with enhanced error handling
  static async generateInventoryPDF(): Promise<void> {
    try {
      console.log('Starting inventory PDF generation...');
      
      // Get products data
      const response = await productsAPI.getAll();
      const products = response.data;
      
      if (!products || products.length === 0) {
        throw new Error('No product data available');
      }

      console.log(`Found ${products.length} products for report`);

      const pdf = new jsPDF('p', 'pt', 'a4');
      let yPosition = 50;
      
      // Header
      pdf.setFontSize(20);
      pdf.text('SmartStock Inventory Report', 50, yPosition);
      yPosition += 40;
      
      // Date
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 50, yPosition);
      yPosition += 30;
      
      // Summary stats
      const totalProducts = products.length;
      const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const lowStockItems = products.filter(p => p.minStockLevel && p.quantity <= p.minStockLevel).length;
      
      pdf.setFontSize(14);
      pdf.text('Summary:', 50, yPosition);
      yPosition += 25;
      
      pdf.setFontSize(12);
      pdf.text(`Total Products: ${totalProducts}`, 70, yPosition);
      yPosition += 20;
      pdf.text(`Total Value: Rs. ${totalValue.toFixed(2)}`, 70, yPosition);
      yPosition += 20;
      pdf.text(`Low Stock Items: ${lowStockItems}`, 70, yPosition);
      yPosition += 40;
      
      // Products table
      if (yPosition > 700) {
        pdf.addPage();
        yPosition = 50;
      }
      
      pdf.setFontSize(14);
      pdf.text('Product Details:', 50, yPosition);
      yPosition += 30;
      
      // Create table data
      const tableData = products.slice(0, 20).map(product => [
        product.name,
        product.category,
        product.quantity.toString(),
        `Rs. ${product.price.toFixed(2)}`,
        `Rs. ${(product.price * product.quantity).toFixed(2)}`,
        product.quantity <= (product.minStockLevel || 0) ? 'Low Stock' : 'Good'
      ]);
      
      // Add table using autoTable
      autoTable(pdf, {
        head: [['Product Name', 'Category', 'Quantity', 'Price', 'Value', 'Status']],
        body: tableData,
        startY: yPosition,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      // Save the PDF
      const filename = `SmartStock_Inventory_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      console.log('Inventory PDF generated successfully:', filename);
      
    } catch (error) {
      console.error('Inventory PDF generation failed:', error);
      throw new Error(`Inventory PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate sales PDF
  static async generateSalesPDF(): Promise<void> {
    try {
      console.log('Starting sales PDF generation...');
      
      const pdf = new jsPDF('p', 'pt', 'a4');
      let yPosition = 50;
      
      // Header
      pdf.setFontSize(20);
      pdf.text('SmartStock Sales Report', 50, yPosition);
      yPosition += 40;
      
      // Date
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 50, yPosition);
      yPosition += 30;
      
      // Mock sales data for demo
      const salesData = [
        { product: 'Samsung Galaxy S24', quantity: 5, amount: 50000 },
        { product: 'Apple iPhone 15', quantity: 3, amount: 45000 },
        { product: 'OnePlus 12', quantity: 7, amount: 35000 },
        { product: 'Xiaomi 14', quantity: 10, amount: 25000 }
      ];
      
      // Summary
      const totalSales = salesData.reduce((sum, sale) => sum + sale.amount, 0);
      const totalUnits = salesData.reduce((sum, sale) => sum + sale.quantity, 0);
      
      pdf.setFontSize(14);
      pdf.text('Sales Summary:', 50, yPosition);
      yPosition += 25;
      
      pdf.setFontSize(12);
      pdf.text(`Total Sales: Rs. ${totalSales.toFixed(2)}`, 70, yPosition);
      yPosition += 20;
      pdf.text(`Units Sold: ${totalUnits}`, 70, yPosition);
      yPosition += 40;
      
      // Sales table
      pdf.setFontSize(14);
      pdf.text('Sales Details:', 50, yPosition);
      yPosition += 30;
      
      const tableData = salesData.map(sale => [
        sale.product,
        sale.quantity.toString(),
        `Rs. ${sale.amount.toFixed(2)}`,
        `Rs. ${(sale.amount / sale.quantity).toFixed(2)}`
      ]);
      
      autoTable(pdf, {
        head: [['Product', 'Quantity Sold', 'Total Amount', 'Unit Price']],
        body: tableData,
        startY: yPosition,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [46, 204, 113], textColor: [255, 255, 255] }
      });
      
      // Save the PDF
      const filename = `SmartStock_Sales_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      console.log('Sales PDF generated successfully:', filename);
      
    } catch (error) {
      console.error('Sales PDF generation failed:', error);
      throw new Error(`Sales PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default PDFGenerator;
