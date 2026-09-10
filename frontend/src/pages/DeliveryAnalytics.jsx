import React, { useState, useEffect } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { getFilteredData } from '../api';
import KPICard from '../components/KPICard';
import { formatNumber, formatPercent } from '../utils/formatters';
import { Truck, Clock, AlertCircle } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

export default function DeliveryAnalytics() {
  const { filters } = useFilters();
  const [data, setData] = useState({ kpis: null, trend: [], state: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [kpisRes, trendRes, stateRes] = await Promise.all([
          getFilteredData('/kpis', filters),
          getFilteredData('/delivery/trend', filters),
          getFilteredData('/delivery/state', filters)
        ]);
        
        if (isMounted) {
          setData({ kpis: kpisRes.delivery, trend: trendRes, state: stateRes });
        }
      } catch (err) {
        if (isMounted) setError('Unable to load delivery data.');
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [filters]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Delivery Analytics...</div>;
  if (error) return <div style={{ color: 'var(--color-danger)', padding: '2rem' }}><AlertCircle /> {error}</div>;
  if (!data.kpis) return <div style={{ padding: '2rem' }}>No data available.</div>;

  const top10States = data.state.slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Delivery & Operations</h1>
        <p style={{ color: 'var(--text-muted)' }}>Analyze shipping times, on-time performance, and logistical bottlenecks.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <KPICard 
          title="On-Time Delivery Rate" 
          value={formatPercent(data.kpis.on_time_rate)} 
          icon={Truck}
          color="var(--color-success)"
        />
        <KPICard 
          title="Average Delivery Time" 
          value={`${Number(data.kpis.avg_days || 0).toFixed(2)} days`} 
          icon={Clock}
        />
        <KPICard 
          title="Median Delivery Time" 
          value={`${Number(data.kpis.median_days || 0).toFixed(2)} days`} 
          icon={Clock}
        />
        <KPICard 
          title="P90 Delivery Time" 
          value={`${Number(data.kpis.p90_days || 0).toFixed(2)} days`} 
          icon={AlertCircle}
          color="var(--color-warning)"
        />
      </div>

      {/* Insights */}
      <div className="card" style={{ backgroundColor: 'var(--color-secondary)', color: 'white', border: 'none' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'white' }}>Automated Business Insights</h3>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.9 }}>
          <li>
            <strong>{formatPercent(data.kpis.on_time_rate)}</strong> of valid deliveries arrived on or before the estimated delivery date.
          </li>
          <li>
            The average order takes <strong>{Number(data.kpis.avg_days || 0).toFixed(2)} days</strong> to arrive. Half of all orders arrive within <strong>{Number(data.kpis.median_days || 0).toFixed(2)} days</strong> (Median).
          </li>
          <li>
            10% of deliveries take longer than <strong>{Number(data.kpis.p90_days || 0).toFixed(2)} days</strong> (P90), indicating the tail-end logistical performance.
          </li>
          <li>
            *Note: Delivery times &gt; 90 days are excluded as data anomalies for these averages.
          </li>
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Average Delivery Time Trend (Days)</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month_name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip formatter={(value) => `${Number(value).toFixed(2)} days`} />
                <Line type="monotone" dataKey="avg_delivery_days" stroke="var(--color-primary-light)" strokeWidth={3} dot={{r:4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Fastest 10 States by Avg Delivery Time</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10States} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="state" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip formatter={(value) => `${Number(value).toFixed(2)} days`} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="avg_delivery_days" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
