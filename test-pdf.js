// Simple test to check if PDF generation works
const jsPDF = require('jspdf').default;
const autoTable = require('jspdf-autotable');

console.log('Testing PDF generation...');

try {
  const pdf = new jsPDF('p', 'pt', 'a4');
  
  pdf.setFontSize(16);
  pdf.text('SmartStock Test Report', 20, 30);
  
  pdf.setFontSize(12);
  pdf.text('This is a test to verify PDF generation is working.', 20, 60);
  
  // Simple table test
  autoTable.default(pdf, {
    head: [['Test Column 1', 'Test Column 2']],
    body: [['Test Data 1', 'Test Data 2']],
    startY: 80
  });
  
  // Save test PDF
  const fs = require('fs');
  const pdfBuffer = pdf.output('arraybuffer');
  fs.writeFileSync('test-output.pdf', Buffer.from(pdfBuffer));
  
  console.log('✅ PDF generation test PASSED! File saved as test-output.pdf');
} catch (error) {
  console.error('❌ PDF generation test FAILED:', error.message);
}
