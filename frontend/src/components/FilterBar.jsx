import React, { useState } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { Search, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';

export default function FilterBar() {
  const { filters, updateFilter, clearFilters } = useFilters();
  const [isExpanded, setIsExpanded] = useState(false); // Default collapsed for cleaner header

  const handleChange = (e) => {
    updateFilter(e.target.name, e.target.value);
  };

  const hasActiveFilters = Object.values(filters).some(val => val !== '');

  const inputStyle = {
    padding: '0.6rem 0.85rem',
    borderRadius: '0.75rem',
    border: '2px solid transparent',
    fontSize: '0.875rem',
    outline: 'none',
    minWidth: '140px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    color: 'var(--text-main)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = 'var(--color-primary-light)';
    e.target.style.backgroundColor = 'var(--bg-card)';
    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
    e.target.style.transform = 'translateY(-2px)';
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = 'transparent';
    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    e.target.style.boxShadow = 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)';
    e.target.style.transform = 'translateY(0)';
  };

  const labelStyle = {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.1rem',
    paddingLeft: '0.25rem'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button 
          className="header-btn"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontWeight: 600, 
            color: isExpanded ? 'var(--color-primary)' : 'var(--text-main)', 
            padding: '0.5rem 1rem',
            borderRadius: '2rem',
            backgroundColor: isExpanded ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            width: 'auto',
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter size={18} />
          <span>Global Filters {hasActiveFilters && <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: 'var(--color-primary)', 
            color: 'white', 
            borderRadius: '50%', 
            width: '20px', 
            height: '20px', 
            fontSize: '0.7rem', 
            marginLeft: '0.5rem' 
          }}>{Object.values(filters).filter(val => val !== '').length}</span>}</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              background: 'transparent', border: 'none', color: 'var(--color-danger)',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              padding: '0.5rem 1rem', borderRadius: '2rem',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={16} /> Clear All
          </button>
        )}
      </div>

      <div style={{
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '1rem', 
        alignItems: 'flex-end',
        position: 'absolute',
        top: '100%',
        left: 0,
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        padding: isExpanded ? '1.5rem' : '0',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        border: isExpanded ? '1px solid var(--border-color)' : 'none',
        opacity: isExpanded ? 1 : 0,
        transform: isExpanded ? 'translateY(10px)' : 'translateY(0)',
        pointerEvents: isExpanded ? 'auto' : 'none',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 50,
        width: 'max-content',
        maxWidth: 'calc(100vw - 350px)'
      }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={labelStyle}>Date From</label>
          <input type="date" name="date_from" value={filters.date_from} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={labelStyle}>Date To</label>
          <input type="date" name="date_to" value={filters.date_to} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={labelStyle}>Order Status</label>
          <select name="order_status" value={filters.order_status} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} style={inputStyle}>
            <option value="">All Statuses</option>
            <option value="delivered">Delivered</option>
            <option value="canceled">Canceled</option>
            <option value="shipped">Shipped</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={labelStyle}>Customer State</label>
          <input type="text" name="customer_state" placeholder="e.g. SP" value={filters.customer_state} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} style={{...inputStyle, width: '100px'}} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={labelStyle}>Customer City</label>
          <input type="text" name="customer_city" placeholder="e.g. sao paulo" value={filters.customer_city} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={labelStyle}>Product Category</label>
          <input type="text" name="category" placeholder="Search category..." value={filters.category} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={labelStyle}>Product ID</label>
          <input type="text" name="product" placeholder="Product ID..." value={filters.product} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={labelStyle}>Seller State</label>
          <input type="text" name="seller_state" placeholder="e.g. RJ" value={filters.seller_state} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} style={{...inputStyle, width: '100px'}} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={labelStyle}>Review Score</label>
          <select name="review_score" value={filters.review_score} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} style={inputStyle}>
            <option value="">All Scores</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
        
      </div>
    </div>
  );
}
