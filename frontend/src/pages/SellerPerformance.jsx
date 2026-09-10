import React, { useState, useEffect } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { getFilteredData } from '../api';
import KPICard from '../components/KPICard';
import { formatNumber, formatCurrency } from '../utils/formatters';
import { Store, TrendingUp, Package, MapIcon, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  ComposedChart, Line
} from 'recharts';

export default function SellerPerformance() {
  const { filters } = useFilters();
  const [data, setData] = useState({ summary: null, top: [], state: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, topRes, stateRes, paretoRes] = await Promise.all([
          getFilteredData('/sellers/summary', filters),
          getFilteredData('/sellers/top', filters),
          getFilteredData('/sellers/state', filters),
          getFilteredData('/sellers/pareto', filters)
        ]);
        
        if (isMounted) {
          setData({ summary: summaryRes, top: topRes, state: stateRes, pareto: paretoRes });
        }
      } catch (err) {
        if (isMounted) setError('Unable to load seller data.');
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [filters]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Seller Performance...</div>;
  if (error) return <div style={{ color: 'var(--color-danger)', padding: '2rem' }}><AlertCircle /> {error}</div>;
  if (!data.summary) return <div style={{ padding: '2rem' }}>No data available.</div>;

  const top10Sellers = data.top.slice(0, 10);
  const top10States = data.state.slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Seller Performance</h1>
        <p style={{ color: 'var(--text-muted)' }}>Monitor marketplace seller activity, revenue contribution, and geographic spread.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <KPICard 
          title="Active Sellers" 
          value={formatNumber(data.summary.active_sellers)} 
          subtitle={`Out of ${formatNumber(data.summary.total_sellers)} total`}
          icon={Store}
        />
        <KPICard 
          title="Avg Revenue / Seller" 
          value={formatCurrency(data.summary.avg_revenue_per_seller)} 
          icon={TrendingUp}
        />
        <KPICard 
          title="Avg Orders / Seller" 
          value={formatNumber(data.summary.avg_orders_per_seller)} 
          icon={Package}
        />
      </div>

      {/* Insights */}
      <div className="card" style={{ backgroundColor: 'var(--color-secondary)', color: 'white', border: 'none' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'white' }}>Automated Business Insights</h3>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.9 }}>
          <li>
            There are <strong>{formatNumber(data.summary.active_sellers)}</strong> active sellers contributing to the revenue.
          </li>
          <li>
            The average seller has processed <strong>{formatNumber(data.summary.avg_orders_per_seller)}</strong> orders and generated <strong>{formatCurrency(data.summary.avg_revenue_per_seller)}</strong> in product revenue.
          </li>
          {top10Sellers.length > 0 && (
            <li>
              The top seller (ID: <strong>{top10Sellers[0].seller_id.substring(0, 8)}...</strong>) generated <strong>{formatCurrency(top10Sellers[0].product_revenue)}</strong> from {top10Sellers[0].state}.
            </li>
          )}
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Top 10 Sellers by Revenue</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Sellers} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => `R$${(val/1000).toFixed(0)}K`} />
                <YAxis dataKey="seller_id" type="category" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 11 }} tickFormatter={(val) => val.substring(0,8)} />
                <RechartsTooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="product_revenue" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Seller Distribution by State (Revenue)</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10States} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="state" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$${(val/1000000).toFixed(1)}M`} />
                <RechartsTooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="total_revenue" fill="var(--color-primary-light)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Seller Revenue Pareto (Concentration Risk)</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.pareto} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="seller_rank" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} label={{ value: 'Seller Rank (by Revenue)', position: 'bottom', offset: 0 }} />
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
                <Bar yAxisId="left" dataKey="revenue" fill="var(--color-primary)" radius={[2, 2, 0, 0]} maxBarSize={20} />
                <Line yAxisId="right" type="monotone" dataKey="cumulative_pct" stroke="var(--color-warning)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
