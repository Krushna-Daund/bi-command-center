import React, { useState, useEffect } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { getFilteredData } from '../api';
import KPICard from '../components/KPICard';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { DollarSign, TrendingUp, AlertCircle, Truck } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function RevenueAnalysis() {
  const { filters } = useFilters();
  const [data, setData] = useState({ kpis: null, trend: [], category: [], state: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [kpisRes, trendRes, categoryRes, stateRes] = await Promise.all([
          getFilteredData('/kpis', filters),
          getFilteredData('/revenue/trend', filters),
          getFilteredData('/revenue/category', filters),
          getFilteredData('/revenue/state', filters)
        ]);
        
        if (isMounted) {
          setData({ kpis: kpisRes.revenue, trend: trendRes, category: categoryRes, state: stateRes });
        }
      } catch (err) {
        if (isMounted) setError('Unable to load revenue data.');
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [filters]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Revenue Analysis...</div>;
  if (error) return <div style={{ color: 'var(--color-danger)', padding: '2rem' }}><AlertCircle /> {error}</div>;
  if (!data.kpis) return <div style={{ padding: '2rem' }}>No data available.</div>;

  const top10Categories = data.category.slice(0, 10);
  const top10States = data.state.slice(0, 10);

  // Compute MoM Growth for the last month if trend has >= 2 months
  let momGrowth = 0;
  let isCurrentMonthIncomplete = false;
  if (data.trend.length >= 2) {
    const last = data.trend[data.trend.length - 1].total_revenue;
    const prev = data.trend[data.trend.length - 2].total_revenue;
    
    // Heuristic: If current month revenue is unusually low (< 50% of previous month) 
    // it is likely incomplete. Compare the two previous completed months instead.
    if (last < prev * 0.5 && data.trend.length >= 3) {
      const prevPrev = data.trend[data.trend.length - 3].total_revenue;
      momGrowth = prevPrev > 0 ? ((prev - prevPrev) / prevPrev) * 100 : 0;
      isCurrentMonthIncomplete = true;
    } else {
      momGrowth = prev > 0 ? ((last - prev) / prev) * 100 : 0;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Revenue Analysis</h1>
        <p style={{ color: 'var(--text-muted)' }}>Detailed breakdown of revenue generation by time, category, and region.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <KPICard 
          title="Total Revenue" 
          value={formatCurrency(data.kpis.total_order_value)} 
          icon={DollarSign}
          trend={momGrowth > 0 ? 'up' : momGrowth < 0 ? 'down' : 'neutral'}
          trendLabel={`${formatPercent(Math.abs(momGrowth))} MoM`}
          subtitle={isCurrentMonthIncomplete ? "(Excludes current month)" : ""}
        />
        <KPICard 
          title="Product Revenue" 
          value={formatCurrency(data.kpis.product_revenue)} 
          icon={DollarSign}
        />
        <KPICard 
          title="Freight Revenue" 
          value={formatCurrency(data.kpis.freight_revenue)} 
          icon={Truck}
        />
        <KPICard 
          title="Average Order Value" 
          value={formatCurrency(data.kpis.aov)} 
          icon={TrendingUp}
        />
      </div>

      {/* Insights */}
      <div className="card" style={{ backgroundColor: 'var(--color-secondary)', color: 'white', border: 'none' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'white' }}>Automated Business Insights</h3>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.9 }}>
          <li>
            The business generated <strong>{formatCurrency(data.kpis.total_order_value)}</strong> in total revenue, with product revenue contributing <strong>{formatCurrency(data.kpis.product_revenue)}</strong>.
          </li>
          <li>
            The average order value (AOV) is <strong>{formatCurrency(data.kpis.aov)}</strong>.
          </li>
          {top10Categories.length > 0 && (
            <li>
              The top performing category is <strong>{top10Categories[0].category}</strong> with <strong>{formatCurrency(top10Categories[0].total_revenue)}</strong>.
            </li>
          )}
          {data.trend.length >= 2 && (
            <li>
              Month-over-Month revenue growth for the latest completed period is <strong>{formatPercent(momGrowth)}</strong>.
            </li>
          )}
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Monthly Revenue Trend</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month_name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$${(val/1000000).toFixed(1)}M`} />
                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="total_revenue" stroke="var(--color-primary-light)" strokeWidth={3} dot={{r:4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Top 10 Categories by Revenue</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Categories} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => `R$${(val/1000000).toFixed(1)}M`} />
                <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 11 }} />
                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="total_revenue" fill="var(--color-success)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
