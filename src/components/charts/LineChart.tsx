'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface LineChartProps {
  data: Array<{ [key: string]: any }>
  dataKey: string
  height?: number
  lineColor?: string
  showLegend?: boolean
  showGrid?: boolean
  xAxisDataKey?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-gray-300 text-sm mb-1">{label}</p>
        <p className="text-emerald-400 font-semibold">
          {payload[0].value.toLocaleString('id-ID')}
        </p>
      </div>
    )
  }
  return null
}

export default function LineChart({
  data,
  dataKey,
  height = 300,
  lineColor = '#10b981',
  showLegend = false,
  showGrid = true,
  xAxisDataKey = 'name'
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#374151" 
            vertical={false}
          />
        )}
        <XAxis 
          dataKey={xAxisDataKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend 
            wrapperStyle={{ color: '#9CA3AF' }}
            formatter={(value) => <span className="text-gray-300">{value}</span>}
          />
        )}
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={lineColor}
          strokeWidth={2}
          dot={{ fill: lineColor, r: 4, strokeWidth: 2, stroke: '#1F2937' }}
          activeDot={{ r: 6, fill: lineColor }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}