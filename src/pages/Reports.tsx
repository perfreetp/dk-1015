import { useState, useMemo } from 'react'
import { Card, Row, Col, Statistic, Button, Select, DatePicker, message } from 'antd'
import { 
  BarChartOutlined, 
  DownloadOutlined, 
  ArrowUpOutlined as TrendingUpOutlined,
  ClockCircleOutlined,
  TeamOutlined as UsersOutlined,
  WarningOutlined as AlertTriangleIcon
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { mockReportsData } from '../data/mockData'

const generateMonthlyData = (_month: string) => {
  const baseQualityRate = 95 + Math.random() * 3
  const baseTotalCleaning = 280 + Math.floor(Math.random() * 80)
  const baseAbnormal = Math.floor(Math.random() * 5)

  return {
    dailyStats: {
      totalCleaning: baseTotalCleaning,
      qualityRate: parseFloat(baseQualityRate.toFixed(1)),
      abnormal: baseAbnormal,
    },
    monthlyStats: {
      labels: ['第1周', '第2周', '第3周', '第4周'],
      qualityRate: [
        parseFloat((94 + Math.random() * 4).toFixed(1)),
        parseFloat((94 + Math.random() * 4).toFixed(1)),
        parseFloat((94 + Math.random() * 4).toFixed(1)),
        parseFloat((94 + Math.random() * 4).toFixed(1)),
      ],
      totalCount: [
        Math.floor(60 + Math.random() * 40),
        Math.floor(70 + Math.random() * 40),
        Math.floor(65 + Math.random() * 40),
        Math.floor(85 + Math.random() * 40),
      ],
    },
    equipmentUsage: mockReportsData.equipmentUsage.map(e => ({
      ...e,
      rate: Math.floor(70 + Math.random() * 25),
    })),
    userWorkload: mockReportsData.userWorkload.map(u => ({
      ...u,
      count: Math.floor(80 + Math.random() * 60),
    })),
  }
}

function Reports() {
  const [selectedMonth, setSelectedMonth] = useState('2024-01')

  const currentMonthData = useMemo(() => {
    return generateMonthlyData(selectedMonth)
  }, [selectedMonth])

  const qualityRateChartOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['洗消合格率', '目标值'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: currentMonthData.monthlyStats.labels },
    yAxis: { type: 'value', min: 90, max: 100 },
    series: [
      { name: '洗消合格率', type: 'line', smooth: true, data: currentMonthData.monthlyStats.qualityRate },
      { name: '目标值', type: 'line', data: [95, 95, 95, 95], lineStyle: { type: 'dashed', color: '#F59E0B' } }
    ]
  }), [currentMonthData.monthlyStats])

  const totalCountChartOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: currentMonthData.monthlyStats.labels },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: currentMonthData.monthlyStats.totalCount, itemStyle: { color: '#3B82F6' } }]
  }), [currentMonthData.monthlyStats])

  const equipmentUsageChartOption = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', max: 100 },
    yAxis: { type: 'category', data: currentMonthData.equipmentUsage.map(e => e.name) },
    series: [{ 
      type: 'bar', 
      data: currentMonthData.equipmentUsage.map(e => e.rate),
      itemStyle: { 
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#10B981' },
            { offset: 1, color: '#059669' }
          ]
        }
      }
    }]
  }), [currentMonthData.equipmentUsage])

  const userWorkloadChartOption = useMemo(() => ({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8 },
      label: { show: true },
      data: currentMonthData.userWorkload.map((u, i) => ({
        value: u.count,
        name: u.name,
        itemStyle: { color: ['#10B981', '#3B82F6', '#F59E0B'][i] }
      }))
    }]
  }), [currentMonthData.userWorkload])

  const handleExport = () => {
    message.success('报表已导出')
  }

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value)
  }

  const getMonthOptions = () => {
    const options = []
    const today = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      options.push({
        value: `${year}-${month}`,
        label: `${year}年${month}月`,
      })
    }
    return options
  }

  const totalWorkload = currentMonthData.userWorkload.reduce((sum, u) => sum + u.count, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Select 
            value={selectedMonth} 
            onChange={handleMonthChange}
            style={{ width: 200 }}
            options={getMonthOptions()}
          />
          <DatePicker 
            picker="month" 
            value={selectedMonth ? new Date(selectedMonth) : undefined}
            onChange={(date) => {
              if (date) {
                const year = date.getFullYear()
                const month = String(date.getMonth() + 1).padStart(2, '0')
                setSelectedMonth(`${year}-${month}`)
              }
            }}
          />
        </div>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
          导出报表
        </Button>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card className="text-center">
            <Statistic 
              title="洗消总量" 
              value={currentMonthData.dailyStats.totalCleaning} 
              prefix={<BarChartOutlined className="text-primary" />}
            />
            <p className="text-sm text-gray-500 mt-2">{selectedMonth}累计</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic 
              title="洗消合格率" 
              value={currentMonthData.dailyStats.qualityRate} 
              suffix="%"
              valueStyle={{ color: currentMonthData.dailyStats.qualityRate >= 95 ? '#10B981' : '#F59E0B' }}
              prefix={<TrendingUpOutlined />}
            />
            <p className="text-sm text-gray-500 mt-2">目标: 95%</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic 
              title="异常数量" 
              value={currentMonthData.dailyStats.abnormal} 
              valueStyle={{ color: currentMonthData.dailyStats.abnormal > 0 ? '#EF4444' : '#10B981' }}
              prefix={<AlertTriangleIcon />}
            />
            <p className="text-sm text-gray-500 mt-2">{selectedMonth}异常</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic 
              title="设备利用率" 
              value={Math.floor(currentMonthData.equipmentUsage.reduce((sum, e) => sum + e.rate, 0) / currentMonthData.equipmentUsage.length)} 
              suffix="%"
              prefix={<ClockCircleOutlined className="text-secondary" />}
            />
            <p className="text-sm text-gray-500 mt-2">平均利用率</p>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="洗消合格率趋势" extra={<span className="text-green-600">目标: 95%</span>}>
            <ReactECharts option={qualityRateChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="洗消数量统计">
            <ReactECharts option={totalCountChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="设备利用率">
            <ReactECharts option={equipmentUsageChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="人员工作量分布">
            <ReactECharts option={userWorkloadChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="详细统计数据">
        <Row gutter={16}>
          <Col span={8}>
            <h4 className="font-medium mb-3">设备使用详情</h4>
            <div className="space-y-2">
              {currentMonthData.equipmentUsage.map(item => (
                <div key={item.name} className="flex justify-between items-center">
                  <span>{item.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${item.rate}%` }} />
                    </div>
                    <span className="text-sm">{item.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Col>
          <Col span={8}>
            <h4 className="font-medium mb-3">人员工作量</h4>
            <div className="space-y-2">
              {currentMonthData.userWorkload.map(item => (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <UsersOutlined className="text-primary" />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.count} 次</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between">
                <span>总计</span>
                <span className="font-bold text-lg">
                  {totalWorkload} 次
                </span>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <h4 className="font-medium mb-3">质控抽检统计</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>抽检总数</span>
                <span className="font-medium">128 次</span>
              </div>
              <div className="flex justify-between">
                <span>合格</span>
                <span className="font-medium text-green-600">122 次 (95.3%)</span>
              </div>
              <div className="flex justify-between">
                <span>不合格</span>
                <span className="font-medium text-red-600">6 次 (4.7%)</span>
              </div>
              <div className="flex justify-between">
                <span>待验证整改</span>
                <span className="font-medium text-orange-600">2 项</span>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default Reports
