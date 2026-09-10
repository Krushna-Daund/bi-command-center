import React, { useState, useEffect } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { getFilteredData } from '../api';
import KPICard from '../components/KPICard';
import { formatNumber, formatCurrency, formatPercent } from '../utils/formatters';
import { CreditCard, Layers, DollarSign, AlertCircle } from 'lucide-react';
import {
  PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis
} from 'recharts';

export default function PaymentAnalytics() {
  const { filters } = useFilters();
  const [data, setData] = useState({ summary: null, distribution: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, distRes] = await Promise.all([
          getFilteredData('/payments/summary', filters),
          getFilteredData('/payments/distribution', filters)
        ]);
        
        if (isMounted) {
          setData({ summary: summaryRes, distribution: distRes });
        }
      } catch (err) {
        if (isMounted) setError('Unable to load payment data.');
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [filters]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Payment Analytics...</div>;
  if (error) return <div style={{ color: 'var(--color-danger)', padding: '2rem' }}><AlertCircle /> {error}</div>;
  if (!data.summary) return <div style={{ padding: '2rem' }}>No data available.</div>;

  const COLORS = ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)', 'var(--color-primary-light)'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Payment Analytics</h1>
        <p style={{ color: 'var(--text-muted)' }}>Analyze revenue capture, payment methods, and installment behavior.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <KPICard 
          title="Total Processed Value" 
          value={formatCurrency(data.summary.total_payment_value)} 
          icon={DollarSign}
        />
        <KPICard 
          title="Avg Installments" 
          value={Number(data.summary.avg_installments || 0).toFixed(1)} 
          subtitle="Payments per order"
          icon={Layers}
        />
        <KPICard 
          title="Installment Usage" 
          value={formatNumber(data.summary.installment_orders)} 
          subtitle="Orders with > 1 installment"
          icon={CreditCard}
        />
      </div>

      {/* Insights */}
      <div className="card" style={{ backgroundColor: 'var(--color-secondary)', color: 'white', border: 'none' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreditCard size={18} /> Automated Business Insights
        </h3>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.9 }}>
          <li>
            Total gross payment value processed through all gateways is <strong>{formatCurrency(data.summary.total_payment_value)}</strong>.
          </li>
          <li>
            Customers opt to spread their payments across an average of <strong>{Number(data.summary.avg_installments || 0).toFixed(1)}</strong> installments.
          </li>
          {data.distribution.length > 0 && (
            <li>
              The dominant payment method is <strong>{data.distribution[0].payment_type.replace('_', ' ')}</strong>, accounting for <strong>{formatCurrency(data.distribution[0].total_value)}</strong> of the total value.
            </li>
          )}
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
        
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Payment Method Value Distribution</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.distribution}
                  dataKey="total_value"
                  nameKey="payment_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={60}
                  paddingAngle={2}
                  label={({ payment_type }) => payment_type.replace('_', ' ')}
                >
                  {data.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => value.replace('_', ' ')} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Payment Method Popularity (Transaction Count)</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...data.distribution].sort((a,b)=>b.count-a.count)} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="payment_type" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(val) => val.replace('_', ' ')} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => formatNumber(val)} />
                <RechartsTooltip formatter={(value) => formatNumber(value)} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="count" fill="var(--color-primary-light)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
