import React, { useState, useEffect } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { getFilteredData } from '../api';
import KPICard from '../components/KPICard';
import DataTable from '../components/DataTable';
import { formatNumber, formatCurrency } from '../utils/formatters';
import { Package, Tag, ShoppingBag, DollarSign, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  ComposedChart, Line, ScatterChart, Scatter, ZAxis
} from 'recharts';

export default function ProductAnalytics() {
  const { filters } = useFilters();
  const [data, setData] = useState({ summary: null, categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, categoriesRes, paretoRes, matrixRes] = await Promise.all([
          getFilteredData('/products/summary', filters),
          getFilteredData('/products/categories', filters),
          getFilteredData('/products/pareto', filters),
          getFilteredData('/products/category_matrix', filters)
        ]);
        
        if (isMounted) {
          setData({ summary: summaryRes, categories: categoriesRes, pareto: paretoRes, matrix: matrixRes });
        }
      } catch (err) {
        if (isMounted) setError('Unable to load product data.');
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [filters]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Product Analytics...</div>;
  if (error) return <div style={{ color: 'var(--color-danger)', padding: '2rem' }}><AlertCircle /> {error}</div>;
  if (!data.summary) return <div style={{ padding: '2rem' }}>No data available.</div>;

  const top10Categories = data.categories.slice(0, 10);
  
  // Table Columns Setup
  const categoryColumns = [
    { key: 'category', label: 'Category Name' },
    { key: 'items_sold', label: 'Items Sold', format: (val) => formatNumber(val) },
    { key: 'product_revenue', label: 'Revenue', format: (val) => formatCurrency(val) }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Product & Category Analysis</h1>
        <p style={{ color: 'var(--text-muted)' }}>Evaluate product performance, category revenue, and item sales.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <KPICard 
          title="Total Products Sold" 
          value={formatNumber(data.summary.total_products)} 
          icon={Package}
        />
        <KPICard 
          title="Total Categories" 
          value={formatNumber(data.summary.total_categories)} 
          icon={Tag}
        />
        <KPICard 
          title="Total Items Sold" 
          value={formatNumber(data.summary.items_sold)} 
          icon={ShoppingBag}
        />
        <KPICard 
          title="Average Product Revenue" 
          value={formatCurrency(data.summary.avg_product_revenue)} 
          icon={DollarSign}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Top 10 Categories by Revenue</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Categories} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => `R$${(val/1000000).toFixed(1)}M`} />
                <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 11 }} />
                <RechartsTooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="product_revenue" fill="var(--color-success)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Top 10 Categories by Items Sold</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...top10Categories].sort((a,b)=>b.items_sold - a.items_sold)} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => formatNumber(val)} />
                <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 11 }} />
                <RechartsTooltip formatter={(value) => formatNumber(value)} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="items_sold" fill="var(--color-primary-light)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Category Growth vs Revenue Matrix</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" dataKey="revenue" name="Revenue" tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} label={{ value: 'Revenue', position: 'bottom', offset: 0 }} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis type="number" dataKey="growth_pct" name="Growth %" tickFormatter={(val) => `${val.toFixed(0)}%`} label={{ value: 'Growth % (MoM)', angle: -90, position: 'left' }} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <ZAxis type="category" dataKey="category" name="Category" />
                <RechartsTooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                          <p style={{ fontWeight: 'bold' }}>{d.category}</p>
                          <p>Revenue: {formatCurrency(d.revenue)}</p>
                          <p>Growth: {d.growth_pct.toFixed(2)}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Categories" data={data.matrix} fill="var(--color-primary-light)" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Product Revenue Pareto (80/20 Rule)</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.pareto} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="product_rank" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} label={{ value: 'Product Rank (by Revenue)', position: 'bottom', offset: 0 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(val) => `${val.toFixed(0)}%`} />
                <RechartsTooltip 
                  formatter={(value, name) => {
                    if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                    if (name === 'cumulative_pct') return [`${value.toFixed(2)}%`, 'Cumulative %'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Rank: ${label}`}
                  cursor={{ fill: 'var(--bg-hover)' }}
                />
                <Bar yAxisId="left" dataKey="revenue" fill="var(--color-primary-light)" radius={[2, 2, 0, 0]} maxBarSize={20} />
                <Line yAxisId="right" type="monotone" dataKey="cumulative_pct" stroke="var(--color-warning)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actionable Data Table */}
        <div style={{ gridColumn: '1 / -1' }}>
          <DataTable 
            title="Raw Category Data Explorer" 
            columns={categoryColumns} 
            data={data.categories} 
            defaultSortKey="product_revenue" 
          />
        </div>

      </div>
    </div>
  );
}
