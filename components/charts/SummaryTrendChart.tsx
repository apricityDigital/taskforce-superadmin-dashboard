'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'

interface SummaryTrendChartProps {
  data: Array<{ name: string; yes: number; no: number }>
  xLabel?: string
  yLabel?: string
}

export function SummaryTrendChart({ data, xLabel = 'Questions', yLabel = 'Responses' }: SummaryTrendChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" label={{ value: xLabel, position: 'insideBottom', offset: -5 }} tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
          <YAxis label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: -5 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="yes" stackId="a" fill="#22c55e" name="Yes" />
          <Bar dataKey="no" stackId="a" fill="#ef4444" name="No" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
