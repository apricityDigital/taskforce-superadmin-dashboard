'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

interface SimpleBarChartProps {
  data: Array<{ name: string; value: number; color: string }>
}

export function SimpleBarChart({ data }: SimpleBarChartProps) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
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
