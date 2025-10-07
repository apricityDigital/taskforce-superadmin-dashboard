'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'

interface SummaryTrendChartProps {
  data: Array<{ name: string; yes: number; no: number }>
}

export function SummaryTrendChart({ data }: SummaryTrendChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="yes" stackId="a" fill="#22c55e" name="Yes" />
          <Bar dataKey="no" stackId="a" fill="#ef4444" name="No" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}