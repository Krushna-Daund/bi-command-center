import React, { useState, useEffect } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { getFilteredData } from '../api';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { AlertCircle, TrendingUp } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function GrowthAnalysis() {
  const { filters } = useFilters();
  const [metrics, setMetrics] = useState([]);
  const [contribution, setContribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchGrowth = async () => {
      setLoading(true);
      setError(null);
      try {
        const [metricsRes, contributionRes] = await Promise.all([
          getFilteredData('/growth/metrics', filters),
          getFilteredData('/growth/contribution', filters)
        ]);
        
        if (isMounted) {
          setMetrics(metricsRes);
          setContribution(contributionRes);
        }
      } catch (err) {
        if (isMounted) setError('Unable to load Growth data. Please check your connection.');
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchGrowth();
    return () => { isMounted = false; };
  }, [filters]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>Loading Growth Analysis...</div>;
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', padding: '2rem' }}>
        <AlertCircle /> {error}
      </div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return <div style={{ padding: '2rem' }}>No data available for selected filters.</div>;
  }

  // Format metrics for charting
  const formattedMetrics = metrics.map(m => ({
    ...m,
    revenue_growth_pct_display: m.revenue_growth_pct * 100,
    order_growth_pct_display: m.order_growth_pct * 100,
    customer_growth_pct_display: m.customer_growth_pct * 100,
  }));

  const latestMonth = metrics[metrics.length - 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Growth Analysis</h1>
        <p style={{ color: 'var(--text-muted)' }}>Analyze business growth trends across revenue, orders, and customers.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Latest Month Revenue Growth</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0', color: latestMonth.revenue_growth_pct >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {formatPercent(latestMonth.revenue_growth_pct)}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Abs: {formatCurrency(latestMonth.revenue_abs_growth)}
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Latest Month Order Growth</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0', color: latestMonth.order_growth_pct >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {formatPercent(latestMonth.order_growth_pct)}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Abs: {formatNumber(latestMonth.order_abs_growth)}
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rolling 3M Revenue</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
            {formatCurrency(latestMonth.rolling_3m_revenue)}
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cumulative Revenue</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
            {formatCurrency(latestMonth.cumulative_revenue)}
          </div>
        </div>
      </div>

      {/* Insights Box */}
      <div className="card" style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none' }}>
        <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'white' }}>
          <TrendingUp size={18} /> Business Insights
        </h3>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.9 }}>
          {latestMonth.revenue_growth_pct < 0 ? (
            <li><strong>Revenue Declining:</strong> The latest month saw a {formatPercent(latestMonth.revenue_growth_pct)} drop in revenue compared to the previous month.</li>
          ) : (
            <li><strong>Revenue Growing:</strong> The latest month saw a {formatPercent(latestMonth.revenue_growth_pct)} increase in revenue.</li>
          )}
          {latestMonth.order_growth_pct > latestMonth.revenue_growth_pct && (
            <li><strong>AOV Pressure:</strong> Order volume is growing faster than revenue, indicating a decrease in Average Order Value.</li>
          )}
          <li>
            <strong>Top Contributor:</strong> The category '{contribution[0]?.category}' is the largest revenue contributor at {formatPercent((contribution[0]?.contribution_pct || 0) / 100)}.
          </li>
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Revenue Growth Trend (MoM)</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={formattedMetrics} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month_name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(val) => `${val.toFixed(0)}%`} />
                <RechartsTooltip 
                  formatter={(value, name) => {
                    if (name === 'Revenue') return [formatCurrency(value), name];
                    if (name === 'Growth %') return [`${value.toFixed(2)}%`, name];
                    return [value, name];
                  }}
                  cursor={{ fill: 'var(--bg-hover)' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="var(--color-primary-light)" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="revenue_growth_pct_display" name="Growth %" stroke="var(--color-warning)" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Order Growth Trend (MoM)</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={formattedMetrics} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month_name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(val) => `${val.toFixed(0)}%`} />
                <RechartsTooltip 
                  formatter={(value, name) => {
                    if (name === 'Orders') return [formatNumber(value), name];
                    if (name === 'Growth %') return [`${value.toFixed(2)}%`, name];
                    return [value, name];
                  }}
                  cursor={{ fill: 'var(--bg-hover)' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="orders" name="Orders" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="order_growth_pct_display" name="Growth %" stroke="var(--color-warning)" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
