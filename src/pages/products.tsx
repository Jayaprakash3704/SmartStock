import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import { notificationManager } from '../services/notificationManager';
import { Product, ProductFormData } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';

// Product Form Component
const ProductForm: React.FC<{
  product?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}> = ({ product, onSubmit, onCancel, isSubmitting = false }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    price: product?.price || 0,
    quantity: product?.quantity || 0,
    minStockLevel: product?.minStockLevel || 0,
    maxStockLevel: product?.maxStockLevel || 0,
    supplier: product?.supplier || '',
    barcode: product?.barcode || '',
    gstRate: product?.gstRate || 18,
    hsnCode: product?.hsnCode || '',
    brand: product?.brand || '',
    unit: product?.unit || 'pieces',
    location: product?.location || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="glass-card">
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#374151' }}>
        {product ? '✏️ Edit Product' : '➕ Add New Product'}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              className="modern-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter product name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="modern-select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Books">Books</option>
              <option value="Sports">Sports</option>
              <option value="Home & Garden">Home & Garden</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Price (₹)</label>
            <input
              type="number"
              className="modern-input"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              className="modern-input"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              required
              min="0"
              placeholder="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Minimum Stock Level</label>
            <input
              type="number"
              className="modern-input"
              value={formData.minStockLevel}
              onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })}
              required
              min="0"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Supplier</label>
            <input
              type="text"
              className="modern-input"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              required
              placeholder="Enter supplier name"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="modern-input"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Enter product description"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Barcode (Optional)</label>
          <input
            type="text"
            className="modern-input"
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            placeholder="Enter barcode"
          />
        </div>

        <div className="action-buttons" style={{ marginTop: '24px' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ minWidth: '120px' }}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner" style={{ marginRight: '8px' }}></span>
                Saving...
              </>
            ) : (
              product ? 'Update Product' : 'Add Product'
            )}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const Products: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await productsAPI.getAll();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (productData: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const response = await productsAPI.create(productData);
      if (response.success) {
        setProducts([...products, response.data]);
        setIsAddingProduct(false);
        notificationManager.showSuccess('Product Added', `${response.data.name} created successfully`);
      } else {
        alert(response.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product. Please ensure you are signed in and Firestore rules allow writes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async (productData: ProductFormData) => {
    if (!editingProduct) return;
    setIsSubmitting(true);
    try {
      const response = await productsAPI.update(editingProduct.id, productData);
      if (response.success) {
        setProducts(products.map(p => p.id === editingProduct.id ? response.data : p));
        setEditingProduct(null);
        notificationManager.showSuccess('Product Updated', `${response.data.name || 'Product'} updated`);
      }
    } catch (error) {
      console.error('Error updating product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await productsAPI.delete(id);
        if (response.success) {
          setProducts(products.filter(p => p.id !== id));
          notificationManager.showSuccess('Product Deleted', 'Product removed successfully');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.supplier && product.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  if (isLoading) {
    return (
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', flexDirection: 'column', gap: '12px' }}>
        <div className="loading-spinner"></div>
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading products...</span>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title page-title--solid">Products</h1>
          <p className="page-description">Manage your product catalog</p>
        </div>
      </div>

      {/* Add Product Form */}
      {isAddingProduct && (
        <ProductForm
          onSubmit={handleAddProduct}
          onCancel={() => setIsAddingProduct(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Edit Product Form */}
      {editingProduct && (
        <ProductForm
          product={editingProduct}
          onSubmit={handleEditProduct}
          onCancel={() => setEditingProduct(null)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Products List */}
      {!isAddingProduct && !editingProduct && (
        <div className="glass-card">
          {/* Controls */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', gap: '16px', flex: 1, flexWrap: 'wrap' }}>
              <div className="search-container" style={{ flex: 1, minWidth: '250px', marginBottom: 0 }}>
                <div className="search-icon">🔍</div>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="modern-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ minWidth: '150px', marginBottom: '0' }}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <button
              className="btn-primary"
              onClick={() => setIsAddingProduct(true)}
            >
              ➕ Add Product
            </button>
          </div>

          {/* Statistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--surface-2)', color: 'var(--text)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{filteredProducts.length}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Products</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--surface-2)', color: 'var(--text)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {formatCurrency(filteredProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0))}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Total Value</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--surface-2)', color: 'var(--text)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {filteredProducts.filter(p => p.minStockLevel && p.quantity <= p.minStockLevel).length}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Low Stock</div>
            </div>
          </div>

          {/* Products Table */}
          {filteredProducts.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Min Level</th>
                    <th>Status</th>
                    <th>Supplier</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>{product.name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{product.description}</div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-success">{product.category}</span>
                      </td>
                      <td style={{ fontWeight: '600', color: '#059669' }}>
                        {formatCurrency(product.price)}
                      </td>
                      <td style={{ fontWeight: '600' }}>{product.quantity}</td>
                      <td>{product.minStockLevel}</td>
                      <td>
                        <span className={`badge ${
                          product.minStockLevel && product.quantity <= product.minStockLevel 
                            ? 'badge-danger' 
                            : product.minStockLevel && product.quantity <= product.minStockLevel * 2
                            ? 'badge-warning'
                            : 'badge-success'
                        }`}>
                          {product.minStockLevel && product.quantity <= product.minStockLevel 
                            ? 'Low Stock' 
                            : product.minStockLevel && product.quantity <= product.minStockLevel * 2
                            ? 'Medium'
                            : 'In Stock'}
                        </span>
                      </td>
                      <td>{product.supplier}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-warning"
                            onClick={() => setEditingProduct(product)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No products found</h3>
              <p style={{ marginBottom: '24px' }}>
                {searchTerm || selectedCategory 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by adding your first product'
                }
              </p>
              {!searchTerm && !selectedCategory && (
                <button
                  className="btn-primary"
                  onClick={() => setIsAddingProduct(true)}
                >
                  Add Your First Product
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Products;
