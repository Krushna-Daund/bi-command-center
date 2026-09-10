import React, { useState, useEffect } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { getFilteredData } from '../api';
import KPICard from '../components/KPICard';
import { formatNumber, formatPercent } from '../utils/formatters';
import { Star, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

export default function CustomerExperience() {
  const { filters } = useFilters();
  const [data, setData] = useState({ kpis: null, distribution: [], trend: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [kpisRes, distRes, trendRes] = await Promise.all([
          getFilteredData('/kpis', filters),
          getFilteredData('/reviews/distribution', filters),
          getFilteredData('/reviews/trend', filters)
        ]);
        
        if (isMounted) {
          setData({ kpis: kpisRes.reviews, distribution: distRes, trend: trendRes });
        }
      } catch (err) {
        if (isMounted) setError('Unable to load review data.');
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [filters]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Customer Experience...</div>;
  if (error) return <div style={{ color: 'var(--color-danger)', padding: '2rem' }}><AlertCircle /> {error}</div>;
  if (!data.kpis) return <div style={{ padding: '2rem' }}>No data available.</div>;

  const reverseDist = [...data.distribution].reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Customer Experience</h1>
        <p style={{ color: 'var(--text-muted)' }}>Monitor customer satisfaction, review scores, and feedback trends.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <KPICard 
          title="Average Review Score" 
          value={Number(data.kpis.average_score || 0).toFixed(2)} 
          subtitle="Out of 5.00"
          icon={Star}
          color="var(--color-warning)"
        />
        <KPICard 
          title="Total Reviews" 
          value={formatNumber(data.kpis.total_reviews)} 
          icon={Star}
        />
        <KPICard 
          title="5-Star Rate" 
          value={formatPercent(data.kpis.five_star_rate)} 
          icon={ThumbsUp}
          color="var(--color-success)"
        />
        <KPICard 
          title="Negative Rate (1-2 Stars)" 
          value={formatPercent(data.kpis.negative_rate)} 
          icon={ThumbsDown}
          color="var(--color-danger)"
        />
      </div>

      {/* Insights */}
      <div className="card" style={{ backgroundColor: 'var(--color-secondary)', color: 'white', border: 'none' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Star size={18} /> Automated Business Insights
        </h3>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.9 }}>
          <li>
            The average customer review score is <strong>{Number(data.kpis.average_score || 0).toFixed(2)}/5</strong>.
          </li>
          <li>
            <strong>{formatPercent(data.kpis.five_star_rate)}</strong> of all reviews are perfect 5-star ratings, indicating strong product satisfaction.
          </li>
          <li>
            However, <strong>{formatPercent(data.kpis.negative_rate)}</strong> of reviews are negative (1 or 2 stars), representing {formatNumber(Math.round((data.kpis.negative_rate / 100) * data.kpis.total_reviews))} unhappy customer experiences.
          </li>
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
        
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Review Score Distribution</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reverseDist} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="review_score" axisLine={false} tickLine={false} tickFormatter={(val) => `${val} Star${val>1?'s':''}`} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => formatNumber(val)} />
                <RechartsTooltip formatter={(value) => formatNumber(value)} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="count" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Average Rating Trend</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month_name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis domain={[0, 5]} axisLine={false} tickLine={false} />
                <RechartsTooltip formatter={(value) => Number(value).toFixed(2)} />
                <Line type="monotone" dataKey="average_score" stroke="var(--color-primary-light)" strokeWidth={3} dot={{r:4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
