import { useState } from 'react'
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

function Reports() {
  const [selectedMonth, setSelectedMonth] = useState('2024-01')

  const qualityRateChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['洗消合格率', '目标值'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: mockReportsData.monthlyStats.labels },
    yAxis: { type: 'value', min: 90, max: 100 },
    series: [
      { name: '洗消合格率', type: 'line', smooth: true, data: mockReportsData.monthlyStats.qualityRate },
      { name: '目标值', type: 'line', data: [95, 95, 95, 95, 95], lineStyle: { type: 'dashed', color: '#F59E0B' } }
    ]
  }

  const totalCountChartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: mockReportsData.monthlyStats.labels },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: mockReportsData.monthlyStats.totalCount, itemStyle: { color: '#3B82F6' } }]
  }

  const equipmentUsageChartOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', max: 100 },
    yAxis: { type: 'category', data: mockReportsData.equipmentUsage.map(e => e.name) },
    series: [{ 
      type: 'bar', 
      data: mockReportsData.equipmentUsage.map(e => e.rate),
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
  }

  const userWorkloadChartOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8 },
      label: { show: true },
      data: mockReportsData.userWorkload.map((u, i) => ({
        value: u.count,
        name: u.name,
        itemStyle: { color: ['#10B981', '#3B82F6', '#F59E0B'][i] }
      }))
    }]
  }

  const handleExport = () => {
    message.success('报表已导出')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Select 
            value={selectedMonth} 
            onChange={setSelectedMonth}
            style={{ width: 200 }}
            options={[
              { value: '2024-01', label: '2024年1月' },
              { value: '2023-12', label: '2023年12月' },
              { value: '2023-11', label: '2023年11月' },
            ]}
          />
          <DatePicker picker="month" />
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
              value={mockReportsData.dailyStats.totalCleaning} 
              prefix={<BarChartOutlined className="text-primary" />}
            />
            <p className="text-sm text-gray-500 mt-2">本月累计</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic 
              title="洗消合格率" 
              value={mockReportsData.dailyStats.qualityRate} 
              suffix="%"
              valueStyle={{ color: '#10B981' }}
              prefix={<TrendingUpOutlined />}
            />
            <p className="text-sm text-gray-500 mt-2">较上月 +0.8%</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic 
              title="异常数量" 
              value={mockReportsData.dailyStats.abnormal} 
              valueStyle={{ color: mockReportsData.dailyStats.abnormal > 0 ? '#EF4444' : '#10B981' }}
              prefix={<AlertTriangleIcon />}
            />
            <p className="text-sm text-gray-500 mt-2">本月异常</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic 
              title="设备利用率" 
              value={85} 
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
              {mockReportsData.equipmentUsage.map(item => (
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
              {mockReportsData.userWorkload.map(item => (
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
                  {mockReportsData.userWorkload.reduce((sum, u) => sum + u.count, 0)} 次
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
