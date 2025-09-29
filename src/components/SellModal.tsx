import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { productsAPI } from '../services/api';
import { salesService, SaleItem } from '../services/salesService';
import { useCurrency } from '../contexts/CurrencyContext';

interface SellModalProps {
  product: Product;
  onClose: () => void;
  onSaleComplete: () => void;
}

const SellModal: React.FC<SellModalProps> = ({ product, onClose, onSaleComplete }) => {
  const { formatCurrency } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  const maxQuantity = product.quantity || 0;
  const unitPrice = product.price || 0;
  const total = quantity * unitPrice;
  const gstAmount = total * 0.18;
  const finalTotal = total + gstAmount;

  const handleSale = async () => {
    if (quantity <= 0 || quantity > maxQuantity) return;
    
    setIsProcessing(true);
    try {
      const saleItem: SaleItem = {
        productId: product.id!,
        productName: product.name,
        quantity,
        unitPrice,
        total
      };

      await salesService.processSale([saleItem], customerName || undefined, paymentMethod);
      onSaleComplete();
      onClose();
    } catch (error) {
      console.error('Sale failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text)' }}>
            🛒 Sell Product
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            ✕
          </button>
        </div>

        {/* Product Info */}
        <div style={{
          background: 'var(--surface-2)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid var(--border)'
        }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: 'var(--text)' }}>
            {product.name}
          </h4>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Category: {product.category} • Available: {maxQuantity} units
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--primary)' }}>
            Price: {formatCurrency(unitPrice)} per unit
          </div>
        </div>

        {/* Quantity Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--text)' }}>
            Quantity to Sell
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
              min="1"
              max={maxQuantity}
              style={{
                width: '80px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                textAlign: 'center',
                fontSize: '16px'
              }}
            />
            <button
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              disabled={quantity >= maxQuantity}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              +
            </button>
          </div>
          {quantity > maxQuantity && (
            <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px' }}>
              Only {maxQuantity} units available
            </div>
          )}
        </div>

        {/* Customer Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--text)' }}>
            Customer Name (Optional)
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter customer name"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Payment Method */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--text)' }}>
            Payment Method
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['cash', 'card', 'upi'] as const).map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: paymentMethod === method ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: paymentMethod === method ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'var(--surface-2)',
                  color: paymentMethod === method ? 'var(--primary)' : 'var(--text)',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Bill Summary */}
        <div style={{
          background: 'var(--surface-2)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid var(--border)'
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0', color: 'var(--text)' }}>
            Bill Summary
          </h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
            <span style={{ color: 'var(--text)' }}>{formatCurrency(total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>GST (18%):</span>
            <span style={{ color: 'var(--text)' }}>{formatCurrency(gstAmount)}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px', marginTop: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>Total:</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--primary)' }}>
                {formatCurrency(finalTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text)',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSale}
            disabled={isProcessing || quantity <= 0 || quantity > maxQuantity}
            style={{
              flex: 2,
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--success)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: isProcessing || quantity <= 0 || quantity > maxQuantity ? 0.6 : 1
            }}
          >
            {isProcessing ? 'Processing...' : `Complete Sale - ${formatCurrency(finalTotal)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellModal;
