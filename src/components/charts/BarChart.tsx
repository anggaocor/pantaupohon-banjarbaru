'use client'

import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts'

interface ChartData {
  name: string
  [key: string]: any
}

interface BarChartProps {
  data: ChartData[]
  dataKey: string | string[]
  barColors?: string | string[]
  height?: number
  width?: number | string
  showGrid?: boolean
  showLegend?: boolean
  legendLabels?: string[]
  stacked?: boolean
  layout?: 'horizontal' | 'vertical'
  barSize?: number
  radius?: number | [number, number, number, number]
}

export default function BarChart({ 
  data, 
  dataKey, 
  barColors = '#3b82f6',
  height = 300,
  width = '100%',
  showGrid = true,
  showLegend = true,
  legendLabels,
  stacked = false,
  layout = 'horizontal',
  barSize = 20,
  radius = 4
}: BarChartProps) {
  
  // Konversi dataKey ke array
  const keys = Array.isArray(dataKey) ? dataKey : [dataKey]
  const colors = Array.isArray(barColors) ? barColors : [barColors]
  
  // Pastikan jumlah warna sesuai dengan jumlah keys
  const barColorsArray = keys.map((_, index) => 
    colors[index] || colors[colors.length - 1] || '#3b82f6'
  )

  // Custom tooltip untuk dark mode
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-300">{entry.name}:</span>
              <span className="text-white font-semibold">
                {typeof entry.value === 'number' 
                  ? entry.value.toLocaleString('id-ID') 
                  : entry.value
                }
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Custom legend untuk dark mode
  const renderLegend = (props: any) => {
    const { payload } = props
    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-300">
              {legendLabels ? legendLabels[index] : entry.value}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ResponsiveContainer width={width} height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        barSize={barSize}
        barGap={stacked ? 0 : 4}
        barCategoryGap={stacked ? '10%' : '20%'}
      >
        {/* Grid dengan warna lebih gelap untuk dark mode */}
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#374151" 
            vertical={false}
          />
        )}
        
        {/* X Axis */}
        <XAxis 
          dataKey="name" 
          axisLine={{ stroke: '#4B5563' }}
          tickLine={{ stroke: '#4B5563' }}
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          dy={10}
        />
        
        {/* Y Axis */}
        <YAxis 
          axisLine={{ stroke: '#4B5563' }}
          tickLine={{ stroke: '#4B5563' }}
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          dx={-10}
          tickFormatter={(value) => value.toLocaleString('id-ID')}
        />
        
        {/* Tooltip dengan custom component */}
        <Tooltip 
          content={<CustomTooltip />}
          cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
        />
        
        {/* Legend */}
        {showLegend && (
          <Legend 
            content={renderLegend}
            wrapperStyle={{ paddingTop: 20 }}
          />
        )}
        
        {/* Render bars berdasarkan jumlah dataKey */}
        {keys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={barColorsArray[index]}
            stackId={stacked ? 'stack' : undefined}
            radius={typeof radius === 'number' 
              ? [radius, radius, 0, 0] 
              : radius
            }
            animationDuration={1000}
            animationEasing="ease-in-out"
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}