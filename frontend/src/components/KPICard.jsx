import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function KPICard({ title, value, subtitle, trend, trendLabel, icon: Icon, color = 'var(--color-primary)', sparklineData }) {
  // variants for framer motion stagger
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="card flex flex-col gap-2 relative overflow-hidden group"
    >
      <div className="flex justify-between items-start z-10">
        <h3 className="text-sm font-semibold text-text-muted">{title}</h3>
        {Icon && (
          <div className="p-2 rounded-lg bg-bg-hover transition-colors group-hover:bg-opacity-80">
            <Icon size={20} style={{ color }} />
          </div>
        )}
      </div>
      
      <div className="text-3xl font-bold text-text-main mt-1 z-10">
        {value}
      </div>
      
      <div className="flex items-center justify-between mt-auto pt-2 z-10">
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 text-sm">
            {trend && (
              <span className={`font-semibold ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-text-muted'}`}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '-'} {trendLabel}
              </span>
            )}
            {subtitle && <span className="text-text-muted">{subtitle}</span>}
          </div>
        )}
      </div>

      {/* Sparkline Background */}
      {sparklineData && (
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 pointer-events-none z-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={3} 
                dot={false}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
