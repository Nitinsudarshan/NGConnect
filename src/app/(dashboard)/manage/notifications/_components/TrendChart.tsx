'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export interface TrendDataPoint {
  date: string;
  crm_sends: number;
  learning_center_sends: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
}

export function NotificationTrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl">
        No email send activity recorded yet.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="crmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-chart-primary)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--color-chart-primary)" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="lcGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-chart-accent-1)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--color-chart-accent-1)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid, rgba(200,200,200,0.2))" />
          <XAxis
            dataKey="date"
            stroke="var(--color-chart-text, #888888)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="var(--color-chart-text, #888888)"
            fontSize={12}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="crm_sends"
            name="CRM Module"
            stroke="var(--color-chart-primary)"
            fillOpacity={1}
            fill="url(#crmGradient)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="learning_center_sends"
            name="Learning Center"
            stroke="var(--color-chart-accent-1)"
            fillOpacity={1}
            fill="url(#lcGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
