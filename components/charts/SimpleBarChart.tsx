'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts'

interface SimpleBarChartProps {
  data: Array<{ name: string; value: number; color: string }>
  xLabel?: string
  yLabel?: string
}

export function SimpleBarChart({ data, xLabel = 'Categories', yLabel = 'Value' }: SimpleBarChartProps) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" label={{ value: xLabel, position: 'insideBottom', offset: -5 }} tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
          <YAxis label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: -5 }} tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value">
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color || '#2563eb'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
