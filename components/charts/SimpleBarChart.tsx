'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts'

interface SimpleBarChartProps {
  data: Array<{ name: string; value: number; color: string }>
  xLabel?: string
  yLabel?: string
}

const wrapTickLabel = (value: string, maxLineLength = 14) => {
  if (!value) return ['']

  const words = value.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach(word => {
    const tentative = currentLine ? `${currentLine} ${word}` : word
    if (tentative.length > maxLineLength && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = tentative
    }
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  if (lines.length === 1 && lines[0].length > maxLineLength && !lines[0].includes(' ')) {
    const singleWord = lines[0]
    lines.length = 0
    for (let i = 0; i < singleWord.length; i += maxLineLength) {
      lines.push(singleWord.slice(i, i + maxLineLength))
    }
  }

  return lines
}

const AxisTick = ({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value: string } }) => {
  const lines = wrapTickLabel(payload?.value ?? '')
  return (
    <text x={x} y={y + 10} fill="#374151" textAnchor="middle" fontSize={10}>
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : 12}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

export function SimpleBarChart({ data, xLabel = 'Categories', yLabel = 'Value' }: SimpleBarChartProps) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            interval={0}
            tickLine={false}
            axisLine={false}
            tick={<AxisTick />}
            height={70}
            label={{ value: xLabel, position: 'insideBottom', offset: -5, fontSize: 10 }}
          />
          <YAxis
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: -5 }}
            tick={{ fontSize: 10 }}
            allowDecimals={false}
          />
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
