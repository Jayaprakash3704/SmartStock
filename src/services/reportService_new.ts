import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { 
  ReportConfig, 
  Product, 
  SalesData, 
  ChartData, 
  GSTReport 
} from '../types';
import { formatCurrency, formatIndianNumber, calculateGST } from '../utils/helpers';
import { productsAPI } from './api';

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

// Report-specific data interfaces
export interface InventoryReportData {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  categories: number;
  topProducts: Array<{
    name: string;
    stock: number;
    value: number;
    category: string;
    status: 'Low Stock' | 'Good Stock' | 'Overstocked';
  }>;
  stockAnalysis: Array<{
    name: string;
    current: number;
    minimum: number;
    status: string;
    action: string;
  }>;
  chartData: {
    categoryDistribution: Array<{
      name: string;
      value: number;
      percentage: number;
      count: number;
      trend: 'Growing' | 'Declining' | 'Stable';
    }>;
    stockLevels: Array<{ name: string; stock: number; status: string }>;
    monthlyMovement: Array<{ month: string; inward: number; outward: number; closing: number }>;
  };
}

export interface SalesReportData {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  topSellingProducts: Array<{
    name: string;
    unitsSold: number;
    revenue: number;
    margin: number;
  }>;
  salesTrends: Array<{
    month: string;
    sales: number;
    orders: number;
    growth: number;
  }>;
  chartData: {
    monthlySales: Array<{ month: string; sales: number; target: number }>;
    productPerformance: Array<{ name: string; sales: number; margin: number }>;
    customerSegments: Array<{ segment: string; revenue: number; percentage: number }>;
  };
}

export interface FinancialReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  cashFlow: number;
  expenseBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    trend: string;
  }>;
  chartData: {
    monthlyProfitLoss: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
    expenseCategories: Array<{ category: string; amount: number; percentage: number }>;
    cashFlowTrend: Array<{ month: string; inflow: number; outflow: number; net: number }>;
  };
}

export interface GSTReportData {
  totalGSTCollected: number;
  inputTaxCredit: number;
  netGSTLiability: number;
  complianceScore: number;
  gstTransactions: Array<{
    date: string;
    invoiceNo: string;
    customerName: string;
    amount: number;
    gstRate: number;
    gstAmount: number;
    type: 'B2B' | 'B2C' | 'Export';
  }>;
  chartData: {
    monthlyGSTTrend: Array<{ month: string; collected: number; paid: number; liability: number }>;
    gstRateDistribution: Array<{ rate: string; amount: number; percentage: number }>;
    complianceMetrics: Array<{ metric: string; score: number; target: number }>;
  };
}

class ReportService {
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
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${category.name}:`, 30, yPos);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        pdf.text(`Category Value: ${formatCurrencyForPDF(category.value)}`, 200, yPos);
        pdf.text(`Performance Score: ${Math.floor(category.percentage)}/100`, 450, yPos);
        
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

  private addHeader(pdf: jsPDF, title: string): number {
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Company header
    pdf.setFillColor(37, 99, 235); // Blue background
    pdf.rect(0, 0, pageWidth, 25, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SmartStock Analytics', 20, 16);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Professional Business Intelligence', pageWidth - 20, 16, { align: 'right' });
    
    // Report title
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
    
    return 65; // Return Y position for next content
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

  private generateInventoryData(products: Product[]): InventoryReportData {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const lowStockItems = products.filter(p => p.quantity < 10).length;
    const categories = Array.from(new Set(products.map(p => p.category))).length;

    const topProducts = products
      .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
      .slice(0, 10)
      .map(p => ({
        name: p.name,
        stock: p.quantity,
        value: p.price * p.quantity,
        category: p.category,
        status: p.quantity < 5 ? 'Low Stock' : p.quantity > 50 ? 'Overstocked' : 'Good Stock' as 'Low Stock' | 'Good Stock' | 'Overstocked'
      }));

    const stockAnalysis = products.slice(0, 15).map(p => ({
      name: p.name,
      current: p.quantity,
      minimum: 10,
      status: p.quantity < 10 ? 'Reorder Required' : 'Adequate',
      action: p.quantity < 5 ? 'Urgent Reorder' : p.quantity < 10 ? 'Plan Reorder' : 'Monitor'
    }));

    // Chart data specific to inventory
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

    const stockLevels = products.slice(0, 12).map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      stock: p.quantity,
      status: p.quantity < 5 ? 'Critical' : p.quantity < 10 ? 'Low' : 'Good'
    }));

    // Generate monthly movement data (simulated)
    const monthlyMovement = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => ({
      month,
      inward: Math.floor(totalProducts * 0.15) + Math.floor(Math.random() * 50),
      outward: Math.floor(totalProducts * 0.12) + Math.floor(Math.random() * 40),
      closing: Math.floor(totalProducts * 0.8) + Math.floor(Math.random() * 100)
    }));

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      categories,
      topProducts,
      stockAnalysis,
      chartData: {
        categoryDistribution,
        stockLevels,
        monthlyMovement
      }
    };
  }

  private generateSalesData(products: Product[]): SalesReportData {
    const baseRevenue = products.reduce((sum, p) => sum + (p.price * p.quantity * 0.6), 0);
    const totalSales = Math.floor(baseRevenue);
    const totalOrders = Math.floor(products.length * 2.5);
    const avgOrderValue = totalSales / totalOrders;

    const topSellingProducts = products
      .sort((a, b) => b.price - a.price)
      .slice(0, 8)
      .map(p => ({
        name: p.name,
        unitsSold: Math.floor(p.quantity * 0.4) + Math.floor(Math.random() * 20),
        revenue: Math.floor(p.price * p.quantity * 0.6),
        margin: Math.floor(20 + Math.random() * 15) // 20-35% margin
      }));

    // Sales trends for past 6 months
    const salesTrends = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
      const baseSales = totalSales * (0.8 + index * 0.04); // Growth trend
      return {
        month,
        sales: Math.floor(baseSales + (Math.random() * baseSales * 0.1)),
        orders: Math.floor(totalOrders * (0.8 + index * 0.04)),
        growth: index === 0 ? 0 : Math.floor(5 + Math.random() * 10) // 5-15% growth
      };
    });

    // Chart data specific to sales
    const monthlySales = salesTrends.map(trend => ({
      month: trend.month,
      sales: trend.sales,
      target: Math.floor(trend.sales * 1.1) // 10% higher target
    }));

    const productPerformance = topSellingProducts.slice(0, 6).map(p => ({
      name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
      sales: p.revenue,
      margin: p.margin
    }));

    const customerSegments = [
      { segment: 'Retail', revenue: Math.floor(totalSales * 0.45), percentage: 45 },
      { segment: 'Wholesale', revenue: Math.floor(totalSales * 0.35), percentage: 35 },
      { segment: 'Online', revenue: Math.floor(totalSales * 0.20), percentage: 20 }
    ];

    return {
      totalSales,
      totalOrders,
      avgOrderValue,
      topSellingProducts,
      salesTrends,
      chartData: {
        monthlySales,
        productPerformance,
        customerSegments
      }
    };
  }

  private generateFinancialData(products: Product[]): FinancialReportData {
    const totalRevenue = products.reduce((sum, p) => sum + (p.price * p.quantity * 0.7), 0);
    const totalExpenses = totalRevenue * 0.65; // 65% expense ratio
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = (netProfit / totalRevenue) * 100;
    const roi = (netProfit / totalExpenses) * 100;
    const cashFlow = netProfit * 1.2; // Positive cash flow

    const expenseBreakdown = [
      { category: 'Cost of Goods', amount: totalExpenses * 0.6, percentage: 60, trend: 'Stable' },
      { category: 'Operations', amount: totalExpenses * 0.2, percentage: 20, trend: 'Increasing' },
      { category: 'Marketing', amount: totalExpenses * 0.1, percentage: 10, trend: 'Decreasing' },
      { category: 'Administration', amount: totalExpenses * 0.1, percentage: 10, trend: 'Stable' }
    ];

    // Chart data specific to financial
    const monthlyProfitLoss = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
      const monthRevenue = totalRevenue * (0.15 + index * 0.02);
      const monthExpenses = monthRevenue * 0.65;
      return {
        month,
        revenue: Math.floor(monthRevenue),
        expenses: Math.floor(monthExpenses),
        profit: Math.floor(monthRevenue - monthExpenses)
      };
    });

    const expenseCategories = expenseBreakdown.map(exp => ({
      category: exp.category,
      amount: Math.floor(exp.amount),
      percentage: exp.percentage
    }));

    const cashFlowTrend = monthlyProfitLoss.map(month => ({
      month: month.month,
      inflow: month.revenue,
      outflow: month.expenses,
      net: month.profit
    }));

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      roi,
      cashFlow,
      expenseBreakdown,
      chartData: {
        monthlyProfitLoss,
        expenseCategories,
        cashFlowTrend
      }
    };
  }

  private generateGSTData(products: Product[]): GSTReportData {
    const totalSales = products.reduce((sum, p) => sum + (p.price * p.quantity * 0.6), 0);
    const totalGSTCollected = totalSales * 0.18; // 18% GST
    const inputTaxCredit = totalGSTCollected * 0.7; // 70% ITC available
    const netGSTLiability = totalGSTCollected - inputTaxCredit;
    const complianceScore = 95; // 95% compliance

    const gstTransactions = products.slice(0, 12).map((p, index) => ({
      date: new Date(2025, 6 - index % 6, Math.floor(Math.random() * 28) + 1).toLocaleDateString('en-IN'),
      invoiceNo: `INV-${(1000 + index).toString()}`,
      customerName: `Customer ${String.fromCharCode(65 + index)}`,
      amount: Math.floor(p.price * p.quantity * 0.6),
      gstRate: 18,
      gstAmount: Math.floor(p.price * p.quantity * 0.6 * 0.18),
      type: index % 3 === 0 ? 'B2B' : index % 3 === 1 ? 'B2C' : 'Export' as 'B2B' | 'B2C' | 'Export'
    }));

    // Chart data specific to GST
    const monthlyGSTTrend = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => {
      const monthlyCollected = totalGSTCollected / 6;
      return {
        month,
        collected: Math.floor(monthlyCollected + (Math.random() * monthlyCollected * 0.2)),
        paid: Math.floor(monthlyCollected * 0.7),
        liability: Math.floor(monthlyCollected * 0.3)
      };
    });

    const gstRateDistribution = [
      { rate: '18%', amount: Math.floor(totalGSTCollected * 0.7), percentage: 70 },
      { rate: '12%', amount: Math.floor(totalGSTCollected * 0.2), percentage: 20 },
      { rate: '5%', amount: Math.floor(totalGSTCollected * 0.1), percentage: 10 }
    ];

    const complianceMetrics = [
      { metric: 'Timely Filing', score: 98, target: 100 },
      { metric: 'Accurate Returns', score: 95, target: 100 },
      { metric: 'ITC Reconciliation', score: 92, target: 95 },
      { metric: 'Documentation', score: 96, target: 100 }
    ];

    return {
      totalGSTCollected,
      inputTaxCredit,
      netGSTLiability,
      complianceScore,
      gstTransactions,
      chartData: {
        monthlyGSTTrend,
        gstRateDistribution,
        complianceMetrics
      }
    };
  }

  private addInventoryReport(pdf: jsPDF, data: InventoryReportData, currentY: number): number {
    let yPos = currentY;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Add Category Performance Insights using the dedicated method
    yPos = this.addCategoryPerformance(pdf, data, yPos);

    // Add spacing before Overview section
    yPos += 20;

    // Check if we need a new page for Overview
    if (yPos > pageHeight - 150) {
      pdf.addPage();
      yPos = 40;
    }

    // Overview Summary Card
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

    yPos += 60;

    // Check page space for table
    if (yPos > pageHeight - 200) {
      pdf.addPage();
      yPos = 40;
    }

    // Top Products Table
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(37, 99, 235);
    pdf.text('TOP PERFORMING PRODUCTS', 20, yPos);
    yPos += 15;

    const productTableData = data.topProducts.map(product => [
      product.name.length > 25 ? product.name.substring(0, 25) + '...' : product.name,
      product.stock.toString(),
      formatCurrencyForPDF(product.value),
      product.category,
      product.status
    ]);

  autoTable(pdf as any, {
      head: [['Product Name', 'Stock', 'Value', 'Category', 'Status']],
      body: productTableData,
      startY: yPos,
      theme: 'grid',
      headStyles: { 
        fillColor: [37, 99, 235],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 8,
        textColor: 0
      },
      alternateRowStyles: { 
        fillColor: [248, 250, 252] 
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35 },
        4: { cellWidth: 35, halign: 'center' }
      },
      margin: { left: 20, right: 20 }
    });

    yPos = (pdf as any).lastAutoTable.finalY + 25;

    // Check page space for next table  
    if (yPos > pageHeight - 200) {
      pdf.addPage();
      yPos = 40;
    }

    // Stock Analysis
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(16, 185, 129);
    pdf.text('STOCK ANALYSIS', 20, yPos);
    yPos += 15;

    const stockTableData = data.stockAnalysis.slice(0, 10).map(item => [
      item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name,
      item.current.toString(),
      item.minimum.toString(),
      item.status,
      item.action
    ]);

  autoTable(pdf as any, {
      head: [['Product', 'Current', 'Minimum', 'Status', 'Action Required']],
      body: stockTableData,
      startY: yPos,
      theme: 'grid',
      headStyles: { 
        fillColor: [16, 185, 129],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 8,
        textColor: 0
      },
      alternateRowStyles: { 
        fillColor: [240, 253, 250] 
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 40, halign: 'center' },
        4: { cellWidth: 50 }
      },
      margin: { left: 20, right: 20 }
    });

    yPos = (pdf as any).lastAutoTable.finalY + 30;

    // Check if we need a new page for insights section
    if (yPos > pageHeight - 250) {
      pdf.addPage();
      yPos = 40;
    }

    // Product Insights Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(37, 99, 235);
    pdf.text('PRODUCT INSIGHTS & ANALYTICS', 20, yPos);
    yPos += 25;

    // Best Performers
    pdf.setFillColor(240, 253, 250);
    pdf.rect(20, yPos, pageWidth - 40, 35, 'F');
    pdf.setDrawColor(16, 185, 129);
    pdf.rect(20, yPos, pageWidth - 40, 35, 'S');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BEST PERFORMERS', 30, yPos + 12);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const bestPerformers = data.topProducts.slice(0, 3);
    if (bestPerformers.length > 0) {
      bestPerformers.forEach((product, index) => {
        const xPos = 30 + (index * 160);
        pdf.text(`${index + 1}. ${product.name.length > 18 ? product.name.substring(0, 18) + '...' : product.name}`, xPos, yPos + 22);
        pdf.text(`Stock: ${product.stock} | Value: ${formatCurrencyForPDF(product.value)}`, xPos, yPos + 30);
      });
    } else {
      pdf.setTextColor(120, 120, 120);
      pdf.text('No performance data available', 30, yPos + 22);
      pdf.setTextColor(0, 0, 0);
    }
    
    yPos += 45;

    // Risk Analysis
    pdf.setFillColor(254, 242, 242);
    pdf.rect(20, yPos, pageWidth - 40, 35, 'F');
    pdf.setDrawColor(239, 68, 68);
    pdf.rect(20, yPos, pageWidth - 40, 35, 'S');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RISK ANALYSIS', 30, yPos + 12);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    const riskProducts = data.stockAnalysis.filter(item => 
      item.status.toLowerCase().includes('low') || item.status.toLowerCase().includes('critical')
    ).slice(0, 3);
    
    if (riskProducts.length > 0) {
      riskProducts.forEach((product, index) => {
        const xPos = 30 + (index * 160);
        pdf.text(`${product.name.length > 18 ? product.name.substring(0, 18) + '...' : product.name}`, xPos, yPos + 22);
        pdf.text(`Status: ${product.status} | Action: ${product.action.length > 15 ? product.action.substring(0, 15) + '...' : product.action}`, xPos, yPos + 30);
      });
    } else {
      pdf.setTextColor(16, 185, 129);
      pdf.text('No products at risk - All inventory levels are healthy', 30, yPos + 22);
      pdf.setTextColor(0, 0, 0);
    }
    
    yPos += 45;

    return yPos;
  }

  private addSalesReport(pdf: jsPDF, data: SalesReportData, currentY: number): number {
    let yPos = currentY;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Check page space before starting
    if (yPos > pageHeight - 150) {
      pdf.addPage();
      yPos = 40;
    }

    // Summary cards with better spacing
    pdf.setFillColor(254, 249, 195);
    pdf.rect(20, yPos, pageWidth - 40, 45, 'F');
    pdf.setDrawColor(217, 119, 6);
    pdf.rect(20, yPos, pageWidth - 40, 45, 'S');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SALES PERFORMANCE OVERVIEW', 30, yPos + 18);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Sales: ${formatCurrencyForPDF(data.totalSales)}`, 30, yPos + 30);
    pdf.text(`Total Orders: ${data.totalOrders}`, 30, yPos + 40);
    pdf.text(`Avg Order Value: ${formatCurrencyForPDF(data.avgOrderValue)}`, 200, yPos + 30);
    pdf.text(`Revenue Growth: ${data.totalOrders > 0 ? '+12.5%' : 'N/A'}`, 200, yPos + 40);

    yPos += 60;

    // Check page space for table
    if (yPos > pageHeight - 200) {
      pdf.addPage();
      yPos = 40;
    }

    // Top Selling Products
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(245, 158, 11);
    pdf.text('TOP SELLING PRODUCTS', 20, yPos);
    yPos += 15;

    const salesTableData = data.topSellingProducts.length > 0 
      ? data.topSellingProducts.map(product => [
          product.name.length > 25 ? product.name.substring(0, 25) + '...' : product.name,
          product.unitsSold.toString(),
          formatCurrencyForPDF(product.revenue),
          product.margin.toString() + '%'
        ])
      : [['No sales data available', '-', '-', '-']];

  autoTable(pdf as any, {
      head: [['Product Name', 'Units Sold', 'Revenue', 'Margin']],
      body: salesTableData,
      startY: yPos,
      theme: 'grid',
      headStyles: { 
        fillColor: [245, 158, 11],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 8,
        textColor: 0
      },
      alternateRowStyles: { 
        fillColor: [254, 249, 195] 
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 30, halign: 'center' }
      },
      margin: { left: 20, right: 20 }
    });

    yPos = (pdf as any).lastAutoTable.finalY + 20;

    // Sales Trends
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MONTHLY SALES TRENDS', 20, yPos);
    yPos += 10;

    const trendsTableData = data.salesTrends.map(trend => [
      trend.month,
      formatCurrencyForPDF(trend.sales),
      trend.orders.toString(),
      trend.growth.toString() + '%'
    ]);

  autoTable(pdf as any, {
      head: [['Month', 'Sales', 'Orders', 'Growth']],
      body: trendsTableData,
      startY: yPos,
      theme: 'grid',
      headStyles: { 
        fillColor: [139, 69, 19],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 8,
        textColor: 0
      },
      alternateRowStyles: { 
        fillColor: [255, 248, 220] 
      },
      margin: { left: 20, right: 20 }
    });

    return (pdf as any).lastAutoTable.finalY + 10;
  }

  private addFinancialReport(pdf: jsPDF, data: FinancialReportData, currentY: number): number {
    let yPos = currentY;
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Summary cards
    pdf.setFillColor(220, 252, 231);
    pdf.rect(20, yPos, pageWidth - 40, 50, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FINANCIAL PERFORMANCE', 30, yPos + 15);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Revenue: ${formatCurrencyForPDF(data.totalRevenue)}`, 30, yPos + 25);
    pdf.text(`Total Expenses: ${formatCurrencyForPDF(data.totalExpenses)}`, 30, yPos + 35);
    pdf.text(`Net Profit: ${formatCurrencyForPDF(data.netProfit)}`, 30, yPos + 45);
    pdf.text(`Profit Margin: ${data.profitMargin.toFixed(1)}%`, 150, yPos + 25);
    pdf.text(`ROI: ${data.roi.toFixed(1)}%`, 150, yPos + 35);
    pdf.text(`Cash Flow: ${formatCurrencyForPDF(data.cashFlow)}`, 150, yPos + 45);

    yPos += 65;

    // Expense Breakdown
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EXPENSE BREAKDOWN', 20, yPos);
    yPos += 10;

    const expenseTableData = data.expenseBreakdown.map(expense => [
      expense.category,
      formatCurrencyForPDF(expense.amount),
      expense.percentage.toString() + '%',
      expense.trend
    ]);

  autoTable(pdf as any, {
      head: [['Category', 'Amount', 'Percentage', 'Trend']],
      body: expenseTableData,
      startY: yPos,
      theme: 'grid',
      headStyles: { 
        fillColor: [16, 185, 129],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 8,
        textColor: 0
      },
      alternateRowStyles: { 
        fillColor: [220, 252, 231] 
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 40, halign: 'center' }
      },
      margin: { left: 20, right: 20 }
    });

    yPos = (pdf as any).lastAutoTable.finalY + 20;

    // Monthly P&L Summary
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MONTHLY PROFIT & LOSS', 20, yPos);
    yPos += 10;

    const plTableData = data.chartData.monthlyProfitLoss.map(month => [
      month.month,
      formatCurrencyForPDF(month.revenue),
      formatCurrencyForPDF(month.expenses),
      formatCurrencyForPDF(month.profit)
    ]);

  autoTable(pdf as any, {
      head: [['Month', 'Revenue', 'Expenses', 'Profit']],
      body: plTableData,
      startY: yPos,
      theme: 'grid',
      headStyles: { 
        fillColor: [34, 197, 94],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 8,
        textColor: 0
      },
      alternateRowStyles: { 
        fillColor: [240, 253, 244] 
      },
      margin: { left: 20, right: 20 }
    });

    return (pdf as any).lastAutoTable.finalY + 10;
  }

  private addGSTReport(pdf: jsPDF, data: GSTReportData, currentY: number): number {
    let yPos = currentY;
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Summary cards
    pdf.setFillColor(254, 242, 242);
    pdf.rect(20, yPos, pageWidth - 40, 50, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GST COMPLIANCE REPORT', 30, yPos + 15);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`GST Collected: ${formatCurrencyForPDF(data.totalGSTCollected)}`, 30, yPos + 25);
    pdf.text(`Input Tax Credit: ${formatCurrencyForPDF(data.inputTaxCredit)}`, 30, yPos + 35);
    pdf.text(`Net GST Liability: ${formatCurrencyForPDF(data.netGSTLiability)}`, 30, yPos + 45);
    pdf.text(`Compliance Score: ${data.complianceScore}%`, 150, yPos + 25);

    yPos += 65;

    // GST Transactions
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RECENT GST TRANSACTIONS', 20, yPos);
    yPos += 10;

    const gstTableData = data.gstTransactions.slice(0, 10).map(txn => [
      txn.date,
      txn.invoiceNo,
      txn.customerName,
      formatCurrencyForPDF(txn.amount),
      txn.gstRate.toString() + '%',
      formatCurrencyForPDF(txn.gstAmount),
      txn.type
    ]);

  autoTable(pdf as any, {
      head: [['Date', 'Invoice', 'Customer', 'Amount', 'GST%', 'GST Amount', 'Type']],
      body: gstTableData,
      startY: yPos,
      theme: 'grid',
      headStyles: { 
        fillColor: [239, 68, 68],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 7,
        textColor: 0
      },
      alternateRowStyles: { 
        fillColor: [254, 242, 242] 
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 15, halign: 'center' }
      },
      margin: { left: 20, right: 20 }
    });

    yPos = (pdf as any).lastAutoTable.finalY + 20;

    // GST Rate Distribution
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GST RATE DISTRIBUTION', 20, yPos);
    yPos += 10;

    const rateTableData = data.chartData.gstRateDistribution.map(rate => [
      rate.rate,
      formatCurrencyForPDF(rate.amount),
      rate.percentage.toString() + '%'
    ]);

    (pdf as any).autoTable({
      head: [['GST Rate', 'Amount', 'Percentage']],
      body: rateTableData,
      startY: yPos,
      theme: 'grid',
      headStyles: { 
        fillColor: [220, 38, 38],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 8,
        textColor: 0
      },
      alternateRowStyles: { 
        fillColor: [255, 245, 245] 
      },
      margin: { left: 20, right: 20 }
    });

    return (pdf as any).lastAutoTable.finalY + 10;
  }

  async generatePDF(reportType: 'inventory' | 'sales' | 'financial' | 'gst', config?: ReportConfig): Promise<void> {
    try {
      const response = await productsAPI.getAll();
      const products = response.data;
      
      if (!products || products.length === 0) {
        throw new Error('No product data available for report generation');
      }

      const pdf = new jsPDF('p', 'pt', 'a4');
      
      // Generate report-specific data
      let reportData;
      let title;
      
      switch (reportType) {
        case 'inventory':
          reportData = this.generateInventoryData(products);
          title = 'Inventory Management Report';
          break;
        case 'sales':
          reportData = this.generateSalesData(products);
          title = 'Sales Performance Report';
          break;
        case 'financial':
          reportData = this.generateFinancialData(products);
          title = 'Financial Analysis Report';
          break;
        case 'gst':
          reportData = this.generateGSTData(products);
          title = 'GST Compliance Report';
          break;
        default:
          throw new Error('Invalid report type');
      }

      // Add header
      let currentY = this.addHeader(pdf, title);
      
      // Add report-specific content
      switch (reportType) {
        case 'inventory':
          currentY = this.addInventoryReport(pdf, reportData as InventoryReportData, currentY);
          break;
        case 'sales':
          currentY = this.addSalesReport(pdf, reportData as SalesReportData, currentY);
          break;
        case 'financial':
          currentY = this.addFinancialReport(pdf, reportData as FinancialReportData, currentY);
          break;
        case 'gst':
          currentY = this.addGSTReport(pdf, reportData as GSTReportData, currentY);
          break;
      }

      // Add footer to all pages
      const totalPages = pdf.internal.pages.length - 1; // Subtract 1 for the first empty page
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        this.addFooter(pdf, i);
      }

      // Save the PDF
      const filename = `SmartStock_${reportType.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new Error(`Failed to generate ${reportType} report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const reportService = new ReportService();
export default reportService;
export { ReportService };
