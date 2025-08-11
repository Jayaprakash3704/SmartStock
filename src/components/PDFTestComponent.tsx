import React from 'react';
import PDFGenerator from '../services/pdfGenerator';

const PDFTestComponent: React.FC = () => {
  const handleTestSimplePDF = async () => {
    try {
      console.log('Testing simple PDF generation...');
      await PDFGenerator.generateSimplePDF();
      alert('Simple PDF generated successfully! Check your downloads folder.');
    } catch (error) {
      console.error('Simple PDF test failed:', error);
      alert(`Simple PDF test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestInventoryPDF = async () => {
    try {
      console.log('Testing inventory PDF generation...');
      await PDFGenerator.generateInventoryPDF();
      alert('Inventory PDF generated successfully! Check your downloads folder.');
    } catch (error) {
      console.error('Inventory PDF test failed:', error);
      alert(`Inventory PDF test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestSalesPDF = async () => {
    try {
      console.log('Testing sales PDF generation...');
      await PDFGenerator.generateSalesPDF();
      alert('Sales PDF generated successfully! Check your downloads folder.');
    } catch (error) {
      console.error('Sales PDF test failed:', error);
      alert(`Sales PDF test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px', borderRadius: '8px' }}>
      <h3>PDF Generation Test</h3>
      <p>Use these buttons to test PDF generation functionality:</p>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleTestSimplePDF}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Simple PDF
        </button>
        
        <button
          onClick={handleTestInventoryPDF}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Inventory PDF
        </button>
        
        <button
          onClick={handleTestSalesPDF}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Sales PDF
        </button>
      </div>
      
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <p><strong>Instructions:</strong></p>
        <ul>
          <li>Click "Test Simple PDF" first to verify basic PDF functionality</li>
          <li>Check browser console for detailed error messages</li>
          <li>Generated PDFs will be downloaded to your default download folder</li>
        </ul>
      </div>
    </div>
  );
};

export default PDFTestComponent;
