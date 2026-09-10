import React, { useState, useEffect } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { getFilteredData } from '../api';
import { formatNumber, formatCurrency } from '../utils/formatters';
import { AlertCircle, Calculator, Activity, Bell } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from 'recharts';

export default function StatisticalAnalysis() {
  const { filters } = useFilters();
  const [data, setData] = useState({ histogram: [], delivery: [], outliers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const [histRes, delivRes, outlierRes] = await Promise.all([
          getFilteredData('/statistics/order_value_histogram', filters),
          getFilteredData('/statistics/delivery_time_distribution', filters),
          getFilteredData('/statistics/outliers', filters)
        ]);
        
        if (isMounted) {
          setData({ histogram: histRes, delivery: delivRes, outliers: outlierRes });
        }
      } catch (err) {
        if (isMounted) setError('Unable to load Statistical Analysis data.');
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => { isMounted = false; };
  }, [filters]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>Loading Statistical Models...</div>;
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', padding: '2rem' }}>
        <AlertCircle /> {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Statistical & Distribution Analysis</h1>
        <p style={{ color: 'var(--text-muted)' }}>Deep dive into distributions, order value spread, and outlier detection models.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'white' }}>
            <Calculator size={18} /> Model Insights
          </h3>
          <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.9 }}>
            <li>Order Value Distribution typically follows a log-normal distribution, characterized by a long right tail.</li>
            <li>Delivery time distribution reveals the operational SLA mode and standard deviations.</li>
            <li>Outlier detection model isolates anomalies exceeding the 99th percentile for fraud or VIP review.</li>
          </ul>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Order Value Distribution (Histogram)</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.histogram} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="bucket_start" name="Bucket" tickFormatter={(val) => `R$${val}`} label={{ value: 'Order Value Bucket (R$)', position: 'bottom', offset: 0 }} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis dataKey="num_orders" name="Orders" label={{ value: 'Number of Orders', angle: -90, position: 'left' }} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <RechartsTooltip 
                  formatter={(value) => formatNumber(value)}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return `R$${payload[0].payload.bucket_start} - R$${payload[0].payload.bucket_end}`;
                    }
                    return label;
                  }}
                  cursor={{ fill: 'var(--bg-hover)' }} 
                />
                <Bar dataKey="num_orders" fill="var(--color-success)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Delivery Time Distribution (Days)</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.delivery} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="days" name="Days" label={{ value: 'Days to Deliver', position: 'bottom', offset: 0 }} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis dataKey="num_orders" name="Orders" label={{ value: 'Number of Orders', angle: -90, position: 'left' }} tick={{ fill: 'var(--text-muted)' }} />
                <RechartsTooltip formatter={(value) => formatNumber(value)} labelFormatter={(label) => `${label} Days`} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="num_orders" fill="var(--color-primary-light)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Bell size={18} color="var(--color-warning)" /> P99 Value Outliers (Top 50 Anomalies)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Order ID</th>
                  <th style={{ padding: '0.75rem' }}>State</th>
                  <th style={{ padding: '0.75rem' }}>Total Value</th>
                  <th style={{ padding: '0.75rem' }}>Multiple of P99</th>
                </tr>
              </thead>
              <tbody>
                {data.outliers.map((outlier, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--bg-hover)' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{outlier.order_id.substring(0, 8)}...</td>
                    <td style={{ padding: '0.75rem' }}>{outlier.customer_state}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{formatCurrency(outlier.total_value)}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-danger)' }}>{outlier.multiple_of_p99.toFixed(1)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
