import React, { useState, useEffect, useRef } from 'react';

export default function Tabs({ tabs, activeTab, onTabChange }) {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabsRef = useRef([]);

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    const activeElement = tabsRef.current[activeIndex];
    
    if (activeElement) {
      setIndicatorStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
        opacity: 1
      });
    }
  }, [activeTab, tabs]);

  return (
    <div style={{ 
      display: 'flex', 
      position: 'relative',
      backgroundColor: 'rgba(15, 23, 42, 0.05)',
      padding: '0.35rem',
      borderRadius: '1rem',
      marginBottom: '1.5rem',
      overflowX: 'auto',
      width: 'max-content',
      border: '1px solid var(--border-color)',
      boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
    }}>
      {/* Animated Sliding Indicator */}
      <div style={{
        position: 'absolute',
        top: '0.35rem',
        bottom: '0.35rem',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '0.75rem',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: 0,
        ...indicatorStyle
      }} />

      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={el => tabsRef.current[index] = el}
          onClick={() => onTabChange(tab.id)}
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '0.5rem 1.25rem',
            background: 'transparent',
            border: 'none',
            color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-muted)',
            fontWeight: activeTab === tab.id ? 600 : 500,
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'color 0.3s ease',
            whiteSpace: 'nowrap',
            borderRadius: '0.75rem'
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
