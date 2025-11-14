'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

interface QuestionPieChartProps {
  data: Array<{ label: string; value: number; color: string }>
}

export function QuestionPieChart({ data }: QuestionPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-40 w-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-500">
        No data available
      </div>
    )
  }

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={35}
            outerRadius={55}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color || '#2563eb'} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value}`, 'Responses']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
