import React from 'react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name?: string) => [string, string];
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ 
  active, 
  payload, 
  label,
  formatter 
}) => {
  if (active && payload && payload.length) {
    return (
      <div 
        style={{
          backgroundColor: 'var(--chart-tooltip-bg)',
          border: '1px solid var(--chart-tooltip-border)',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          color: 'var(--chart-text)',
          fontSize: '14px'
        }}
      >
        {label && (
          <div 
            style={{
              marginBottom: '8px',
              fontWeight: '600',
              color: 'var(--chart-text)'
            }}
          >
            {label}
          </div>
        )}
        {payload.map((entry, index) => {
          const [value, name] = formatter ? 
            formatter(entry.value, entry.name) : 
            [entry.value, entry.name];
          
          return (
            <div 
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: index < payload.length - 1 ? '4px' : '0'
              }}
            >
              <div 
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: entry.color,
                  borderRadius: '2px'
                }}
              />
              <span style={{ color: 'var(--chart-text)' }}>
                {name}: <strong>{value}</strong>
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
};