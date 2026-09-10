import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({ data, columns, title, defaultSortKey = null }) {
  const [sortConfig, setSortConfig] = useState({ key: defaultSortKey, direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const sortedData = useMemo(() => {
    if (!data) return [];
    let sortableItems = [...data];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;
  const currentData = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const exportToCSV = () => {
    if (!sortedData || sortedData.length === 0) return;
    const headers = columns.map(c => c.label).join(',');
    const rows = sortedData.map(row => 
      columns.map(c => {
        const val = row[c.key];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${title.replace(/\s+/g, '_').toLowerCase()}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!data || data.length === 0) {
    return <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data available for {title}.</div>;
  }

  return (
    <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{title}</h3>
        <button onClick={exportToCSV} className="header-btn" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--bg-hover)', position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              {columns.map((col) => (
                <th 
                  key={col.key} 
                  onClick={() => requestSort(col.key)}
                  style={{ 
                    padding: '1rem 1.5rem', 
                    fontWeight: 600, 
                    fontSize: '0.85rem', 
                    color: 'var(--text-muted)', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: '1px solid var(--border-color)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {col.label}
                    {sortConfig.key === col.key ? (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    ) : (
                      <div style={{ width: 14 }} /> 
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                {columns.map((col) => (
                  <td key={col.key} style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                    {col.format ? col.format(row[col.key]) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing {sortedData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length} entries
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            style={{ padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '0.3rem', background: currentPage === 1 ? 'var(--bg-hover)' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-main)' }}
          ><ChevronLeft size={16}/></button>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 0.5rem' }}>{currentPage} / {totalPages}</span>
          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            style={{ padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '0.3rem', background: currentPage === totalPages ? 'var(--bg-hover)' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-main)' }}
          ><ChevronRight size={16}/></button>
        </div>
      </div>
    </div>
  );
}
