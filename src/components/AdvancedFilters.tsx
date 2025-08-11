import React from 'react';

interface AdvancedFiltersProps {
  filters: any;
  availableFilters: {
    categories: string[];
    suppliers: string[];
    locations: string[];
  };
  onFilterChange: (key: string, value: any) => void;
  onReset: () => void;
  onApplyDateRange: (preset: string) => void;
  dateRange: { start: string; end: string };
  onDateChange: (field: 'start' | 'end', value: string) => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  availableFilters,
  onFilterChange,
  onReset,
  onApplyDateRange,
  dateRange,
  onDateChange
}) => {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '32px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'between',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          margin: 0,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🔍 Advanced Filters & Analytics
        </h3>
        <button
          onClick={onReset}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: 'white',
            color: '#6b7280',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Reset All
        </button>
      </div>

      {/* Quick Date Range Presets */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '600', 
          color: '#374151',
          marginBottom: '8px'
        }}>
          📅 Quick Date Ranges
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '8px'
        }}>
          {[
            { label: 'Today', value: 'today' },
            { label: 'This Week', value: 'thisWeek' },
            { label: 'This Month', value: 'thisMonth' },
            { label: 'This Quarter', value: 'thisQuarter' },
            { label: 'This Year', value: 'thisYear' },
            { label: 'Custom', value: 'custom' }
          ].map(preset => (
            <button
              key={preset.value}
              onClick={() => onApplyDateRange(preset.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: filters.quickDateRange === preset.value ? '2px solid #667eea' : '1px solid #e5e7eb',
                background: filters.quickDateRange === preset.value ? 'rgba(102, 126, 234, 0.1)' : 'white',
                color: filters.quickDateRange === preset.value ? '#667eea' : '#6b7280',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range */}
      {filters.quickDateRange === 'custom' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px',
          padding: '16px',
          background: 'rgba(102, 126, 234, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#374151',
              marginBottom: '6px'
            }}>
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => onDateChange('start', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#374151',
              marginBottom: '6px'
            }}>
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => onDateChange('end', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      )}

      {/* Main Filters Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* Category Filter */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '13px', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '6px'
          }}>
            🏷️ Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="">All Categories</option>
            {availableFilters.categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Supplier Filter */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '13px', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '6px'
          }}>
            🏢 Supplier
          </label>
          <select
            value={filters.supplier}
            onChange={(e) => onFilterChange('supplier', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="">All Suppliers</option>
            {availableFilters.suppliers.map(sup => (
              <option key={sup} value={sup}>{sup}</option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '13px', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '6px'
          }}>
            📍 Location
          </label>
          <select
            value={filters.location}
            onChange={(e) => onFilterChange('location', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="">All Locations</option>
            {availableFilters.locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Stock Level Filter */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '13px', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '6px'
          }}>
            📦 Stock Level
          </label>
          <select
            value={filters.stockLevel}
            onChange={(e) => onFilterChange('stockLevel', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="all">All Stock</option>
            <option value="inStock">In Stock</option>
            <option value="lowStock">Low Stock</option>
            <option value="outOfStock">Out of Stock</option>
            <option value="overstock">Overstock</option>
          </select>
        </div>
      </div>

      {/* Search and Advanced Options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: '16px',
        marginBottom: '16px'
      }}>
        {/* Search Term */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '13px', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '6px'
          }}>
            🔍 Search Products
          </label>
          <input
            type="text"
            placeholder="Search by name, brand, barcode..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange('searchTerm', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Sort By */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '13px', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '6px'
          }}>
            📊 Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="quantity">Quantity</option>
            <option value="category">Category</option>
            <option value="supplier">Supplier</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '13px', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '6px'
          }}>
            🔄 Order
          </label>
          <select
            value={filters.sortOrder}
            onChange={(e) => onFilterChange('sortOrder', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

  {/* Toggle Options removed: View Mode buttons below control visibility */}
    </div>
  );
};

export default AdvancedFilters;
