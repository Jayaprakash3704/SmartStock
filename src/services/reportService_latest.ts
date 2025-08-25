import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { 
  ReportConfig, 
  Product, 
  SalesData, 
  ChartData, 
  GSTReport,
  InventoryReportData
} from '../types';
import { formatCurrency, formatIndianNumber, calculateGST } from '../utils/helpers';
import { productsAPI } from './api';
import { getDbInstance } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';

interface ReportHistory {
  id?: string;
  reportType: string;
  generatedAt: Timestamp;
  generatedBy: string;
  config: ReportConfig;
  fileName: string;
  status: 'completed' | 'failed';
}

// Clean currency formatter for PDF
const formatCurrencyForPDF = (amount: number): string => {
  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return 'Rs. ' + formatted;
  } catch (error) {
    return 'Rs. ' + amount.toFixed(2);
  }
};

// Get current user ID for Firebase operations
const getCurrentUserId = (): string => {
  return localStorage.getItem('currentUserId') || 'system';
};

class ReportService {
  // Save report history to Firebase
  private async saveReportHistory(reportType: string, config: ReportConfig, fileName: string, status: 'completed' | 'failed'): Promise<void> {
    try {
      const db = getDbInstance();
      if (!db) {
        console.warn('Firebase not available, skipping report history save');
        return;
      }

      const reportHistory: ReportHistory = {
        reportType,
        generatedAt: Timestamp.now(),
        generatedBy: getCurrentUserId(),
        config,
        fileName,
        status
      };

      await addDoc(collection(db, 'reportHistory'), reportHistory);
    } catch (error) {
      console.error('Error saving report history:', error);
      // Continue with report generation even if history save fails
    }
  }

  // Get report history from Firebase
  async getReportHistory(limit: number = 50): Promise<ReportHistory[]> {
    try {
      const db = getDbInstance();
      if (!db) {
        console.warn('Firebase not available, returning empty report history');
        return [];
      }

      const reportsRef = collection(db, 'reportHistory');
      const q = query(
        reportsRef,
        orderBy('generatedAt', 'desc'),
        where('generatedBy', '==', getCurrentUserId())
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReportHistory[];
    } catch (error) {
      console.error('Error fetching report history:', error);
      return [];
    }
  }
  private addHeader(pdf: jsPDF, title: string): number {
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Company header
    pdf.setFillColor(37, 99, 235); // Blue header
    pdf.rect(0, 0, pageWidth, 25, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SmartStock Analytics', 20, 16);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Professional Business Intelligence', pageWidth - 20, 16, { align: 'right' });
    
    // Report title with better spacing
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, 20, 40);
    
    // Report date and time
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    const now = new Date();
    pdf.text(`Generated on: ${now.toLocaleDateString('en-IN')} at ${now.toLocaleTimeString('en-IN')}`, 20, 50);
    
    return 65;
  }

  private addFooter(pdf: jsPDF, pageNumber: number): void {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    pdf.setDrawColor(229, 231, 235);
    pdf.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    
    pdf.text(`Page ${pageNumber}`, 20, pageHeight - 15);
    pdf.text('SmartStock Enterprise Solution', pageWidth - 20, pageHeight - 15, { align: 'right' });
    pdf.text('Confidential Business Document', pageWidth / 2, pageHeight - 15, { align: 'center' });
  }

  private addCategoryPerformance(pdf: jsPDF, data: InventoryReportData, startY: number): number {
    let yPos = startY;
    
    // Header Section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(37, 99, 235);
    pdf.text('CATEGORY PERFORMANCE INSIGHTS', 20, yPos);
    yPos += 25;

    if (data.chartData?.categoryDistribution && data.chartData.categoryDistribution.length > 0) {
      data.chartData.categoryDistribution.forEach((category) => {
        // Category header with colon
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${category.name}:`, 30, yPos);

        // Category details in three columns
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        // First row
        pdf.text(`Category Value: ${formatCurrencyForPDF(category.value)}`, 200, yPos);
        pdf.text(`Performance Score: ${Math.floor(category.percentage)}/100`, 450, yPos);
        
        // Second row
        pdf.text(`Total Products: ${category.count}`, 30, yPos + 15);
        pdf.text(`Avg Stock Level: ${(category.value / category.count).toFixed(1)}`, 200, yPos + 15);
        pdf.text(`Growth Trend: ${category.trend}`, 450, yPos + 15);

        yPos += 35;
      });
    } else {
      pdf.setTextColor(120, 120, 120);
      pdf.text('No category performance data available', 30, yPos + 20);
      pdf.setTextColor(0, 0, 0);
      yPos += 35;
    }

    return yPos;
  }

  private addInventoryReport(pdf: jsPDF, data: InventoryReportData, currentY: number): number {
    let yPos = currentY;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Add Category Performance Insights first
    yPos = this.addCategoryPerformance(pdf, data, yPos);

    // Add spacing before Overview section
    yPos += 20;

    // Check if we need a new page
    if (yPos > pageHeight - 150) {
      pdf.addPage();
      yPos = 40;
    }

    // Summary cards with better spacing
    pdf.setFillColor(248, 250, 252);
    pdf.rect(20, yPos, pageWidth - 40, 45, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(20, yPos, pageWidth - 40, 45, 'S');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INVENTORY OVERVIEW', 30, yPos + 18);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Products: ${data.totalProducts}`, 30, yPos + 30);
    pdf.text(`Total Value: ${formatCurrencyForPDF(data.totalValue)}`, 30, yPos + 40);
    pdf.text(`Low Stock Items: ${data.lowStockItems}`, 200, yPos + 30);
    pdf.text(`Categories: ${data.categories}`, 200, yPos + 40);

    return yPos + 60;
  }

  private generateInventoryData(products: Product[]): InventoryReportData {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const lowStockItems = products.filter(p => p.quantity < 10).length;
    const categories = Array.from(new Set(products.map(p => p.category))).length;

    // Calculate category-wise metrics
    const categoryGroups = products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = { 
          count: 0, 
          value: 0,
          prevCount: 0, // Simulated previous count for trend
          items: []
        };
      }
      acc[product.category].count++;
      acc[product.category].value += product.price * product.quantity;
      acc[product.category].items.push(product);
      return acc;
    }, {} as Record<string, { 
      count: number; 
      value: number; 
      prevCount: number;
      items: Product[];
    }>);

    // Generate category distribution with performance analysis
    const categoryDistribution = Object.entries(categoryGroups).map(([name, data]) => {
      // Calculate performance metrics
      const avgValue = data.value / data.count;
      const performanceScore = Math.min(100, Math.round((avgValue / 1000) * data.count));
      
      // Determine trend based on stock levels and movement
      const lowStockItems = data.items.filter(p => p.quantity < 10).length;
      const trend = lowStockItems > data.count / 2 ? 'Declining' 
                   : data.count > 3 ? 'Growing' 
                   : 'Stable';

      return {
        name,
        value: data.value,
        count: data.count,
        percentage: performanceScore,
        trend: trend as 'Growing' | 'Declining' | 'Stable'
      };
    });

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      categories,
      avgProductValue: totalValue / totalProducts || 0,
      stockHealthScore: Math.max(0, 100 - (lowStockItems / totalProducts) * 100),
      topProducts: products
        .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
        .slice(0, 10)
        .map(p => ({
          name: p.name,
          stock: p.quantity,
          value: p.price * p.quantity,
          category: p.category,
          status: p.quantity < 5 ? 'Low Stock' : p.quantity > 50 ? 'Overstocked' : 'Good Stock' as 'Low Stock' | 'Good Stock' | 'Overstocked'
        })),
      stockAnalysis: products.map(p => ({
        name: p.name,
        current: p.quantity,
        minimum: 10,
        status: p.quantity < 5 ? 'Critical' : p.quantity < 10 ? 'Low' : 'Good',
        action: p.quantity < 5 ? 'Urgent Reorder' : p.quantity < 10 ? 'Plan Reorder' : 'Monitor'
      })),
      chartData: {
        categoryDistribution,
        stockLevels: products.map(p => ({
          name: p.name,
          stock: p.quantity,
          status: p.quantity < 5 ? 'Critical' : p.quantity < 10 ? 'Low' : 'Good'
        })),
        monthlyMovement: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => ({
          month,
          inward: Math.floor(Math.random() * 100),
          outward: Math.floor(Math.random() * 80),
          closing: Math.floor(Math.random() * 200)
        }))
      }
    };
  }

  async generatePDF(reportType: 'inventory' | 'sales' | 'financial' | 'gst'): Promise<void> {
    try {
      console.log(`Starting PDF generation for ${reportType} report...`);
      
      const response = await productsAPI.getAll();
      const products = response.data;
      
      if (!products || products.length === 0) {
        throw new Error('No product data available for report generation');
      }

      const pdf = new jsPDF('p', 'pt', 'a4');
      
      // Generate report data
      const reportData = this.generateInventoryData(products);
      const title = 'Inventory Management Report';

      // Add header
      let currentY = this.addHeader(pdf, title);
      
      // Add report content
      currentY = this.addInventoryReport(pdf, reportData, currentY);

      // Add footer
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        this.addFooter(pdf, i);
      }

      // Save the PDF
      const filename = `SmartStock_${reportType.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      console.log(`PDF generated successfully: ${filename}`);

    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error(`Failed to generate ${reportType} report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const reportService = new ReportService();
export default reportService;
