import { Card, Row, Col, Tag, List, Button, Statistic, Badge } from 'antd'
import { 
  SearchOutlined as MicroscopeOutlined, 
  ClockCircleOutlined, 
  WarningOutlined as AlertTriangleIcon, 
  CheckCircleOutlined,
  SettingOutlined as WrenchOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { mockEndoscopes, mockCleaningBatches, mockAlerts, mockReportsData } from '../data/mockData'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()

  const statusCounts = {
    available: mockEndoscopes.filter(e => e.status === 'available').length,
    inUse: mockEndoscopes.filter(e => e.status === 'in_use').length,
    cleaning: mockEndoscopes.filter(e => e.status === 'cleaning').length,
    isolated: mockEndoscopes.filter(e => e.status === 'isolated').length,
    maintenance: mockEndoscopes.filter(e => e.status === 'maintenance').length,
  }

  const batchStatusTags = {
    pending: { color: 'default', text: '待开始' },
    processing: { color: 'blue', text: '处理中' },
    completed: { color: 'green', text: '已完成' },
    abnormal: { color: 'red', text: '异常' },
  }

  const alertTypeConfig = {
    timeout: { icon: <ClockCircleOutlined className="text-orange-500" />, bg: 'bg-orange-50' },
    abnormal: { icon: <AlertTriangleIcon className="text-red-500" />, bg: 'bg-red-50' },
    maintenance: { icon: <WrenchOutlined className="text-blue-500" />, bg: 'bg-blue-50' },
  }

  const chartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['洗消合格率', '洗消数量'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: mockReportsData.monthlyStats.labels },
    yAxis: [
      { type: 'value', name: '合格率(%)', min: 90, max: 100 },
      { type: 'value', name: '数量', min: 0, max: 40, position: 'right' }
    ],
    series: [
      { name: '洗消合格率', type: 'line', data: mockReportsData.monthlyStats.qualityRate },
      { name: '洗消数量', type: 'bar', yAxisIndex: 1, data: mockReportsData.monthlyStats.totalCount }
    ]
  }

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="内镜总数" value={mockEndoscopes.length} />
            <div className="mt-4 flex justify-center gap-4">
              <Tag color="green">{statusCounts.available} 可领用</Tag>
              <Tag color="blue">{statusCounts.inUse} 使用中</Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="今日洗消" value={mockReportsData.dailyStats.totalCleaning} />
            <div className="mt-4 flex justify-center gap-4">
              <Tag color="green">{mockReportsData.dailyStats.completed} 已完成</Tag>
              <Tag color="orange">{mockReportsData.dailyStats.totalCleaning - mockReportsData.dailyStats.completed} 进行中</Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic 
              title="今日合格率" 
              value={mockReportsData.dailyStats.qualityRate} 
              suffix="%" 
              valueStyle={{ color: '#10B981' }}
            />
            <div className="mt-4 text-sm text-gray-500">较昨日 +0.8%</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic 
              title="异常告警" 
              value={mockAlerts.length} 
              valueStyle={{ color: mockAlerts.length > 0 ? '#EF4444' : '#10B981' }}
            />
            <div className="mt-4 flex justify-center gap-4">
              <Tag color="red">{mockAlerts.filter(a => a.type === 'abnormal').length} 异常</Tag>
              <Tag color="orange">{mockAlerts.filter(a => a.type === 'timeout').length} 超时</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="实时洗消进度" extra={<Button type="link" onClick={() => navigate('/cleaning')}>查看详情 <ArrowRightOutlined /></Button>}>
            <List
              dataSource={mockCleaningBatches.filter(b => b.status !== 'completed')}
              renderItem={batch => (
                <List.Item className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <MicroscopeOutlined className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">{batch.batchNumber}</p>
                      <p className="text-sm text-gray-500">内镜: {batch.endoscopeSerial}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm">进度</p>
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(batch.currentStep / 6) * 100}%` }}
                        />
                      </div>
                    </div>
                    <Tag color={batchStatusTags[batch.status].color}>{batchStatusTags[batch.status].text}</Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card title="告警提醒" extra={<Badge count={mockAlerts.length} />}>
            <List
              dataSource={mockAlerts}
              renderItem={alert => (
                <List.Item className={`flex items-start gap-3 p-3 rounded-lg ${alertTypeConfig[alert.type].bg} mb-2`}>
                  <div className="mt-0.5">{alertTypeConfig[alert.type].icon}</div>
                  <div className="flex-1">
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm text-gray-500">{alert.time}</p>
                  </div>
                  {alert.type === 'abnormal' && (
                    <Button type="primary" size="small">处理</Button>
                  )}
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="内镜状态分布">
            <ReactECharts 
              option={{
                tooltip: { trigger: 'item' },
                legend: { bottom: 0 },
                series: [{
                  type: 'pie',
                  radius: ['40%', '70%'],
                  avoidLabelOverlap: false,
                  itemStyle: { borderRadius: 8 },
                  label: { show: false },
                  emphasis: { label: { show: true, fontSize: 14 } },
                  data: [
                    { value: statusCounts.available, name: '可领用', itemStyle: { color: '#10B981' } },
                    { value: statusCounts.inUse, name: '使用中', itemStyle: { color: '#3B82F6' } },
                    { value: statusCounts.cleaning, name: '洗消中', itemStyle: { color: '#F59E0B' } },
                    { value: statusCounts.isolated, name: '隔离', itemStyle: { color: '#EF4444' } },
                    { value: statusCounts.maintenance, name: '维护', itemStyle: { color: '#8B5CF6' } },
                  ]
                }]
              }}
              style={{ height: 300 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="近期洗消趋势">
            <ReactECharts option={chartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="快捷操作">
        <Row gutter={16}>
          <Col span={4}>
            <Button 
              type="primary" 
              block 
              icon={<MicroscopeOutlined />}
              onClick={() => navigate('/endoscope')}
            >
              内镜领用
            </Button>
          </Col>
          <Col span={4}>
            <Button 
              type="primary" 
              block 
              icon={<CheckCircleOutlined />}
              onClick={() => navigate('/endoscope')}
            >
              内镜归还
            </Button>
          </Col>
          <Col span={4}>
            <Button 
              type="primary" 
              block 
              icon={<AlertTriangleIcon />}
              onClick={() => navigate('/patient')}
            >
              扫码绑定患者
            </Button>
          </Col>
          <Col span={4}>
            <Button 
              type="primary" 
              block 
              icon={<ClockCircleOutlined />}
              onClick={() => navigate('/cleaning')}
            >
              开始洗消流程
            </Button>
          </Col>
          <Col span={4}>
            <Button 
              type="primary" 
              block 
              icon={<WrenchOutlined />}
              onClick={() => navigate('/equipment')}
            >
              设备维护
            </Button>
          </Col>
          <Col span={4}>
            <Button 
              type="primary" 
              block 
              icon={<CheckCircleOutlined />}
              onClick={() => navigate('/qc-inspection')}
            >
              质控抽检
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default Dashboard
