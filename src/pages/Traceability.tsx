import { useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, DatePicker, message, Card, Space } from 'antd'
import { 
  SearchOutlined, 
  PrinterOutlined, 
  FileTextOutlined,
  CalendarOutlined,
  BarcodeOutlined
} from '@ant-design/icons'
import { mockCleaningBatches, type CleaningBatch } from '../data/mockData'

interface User {
  id: number
  username: string
  name: string
  role: 'nurse' | 'cleaner' | 'qc'
}

interface TraceabilityProps {
  user: User
}

const steps = [
  { title: '预处理', key: 'preprocess' },
  { title: '测漏登记', key: 'leakTest' },
  { title: '手工刷洗', key: 'manualBrush' },
  { title: '机洗程序', key: 'machineWash' },
  { title: '消毒记录', key: 'disinfection' },
  { title: '干燥存放', key: 'dryStorage' },
]

const batchStatusConfig = {
  pending: { color: 'default', text: '待开始' },
  processing: { color: 'blue', text: '处理中' },
  completed: { color: 'green', text: '已完成' },
  abnormal: { color: 'red', text: '异常' },
}

function Traceability({ user }: TraceabilityProps) {
  const [batches] = useState<CleaningBatch[]>(mockCleaningBatches)
  const [searchParams, setSearchParams] = useState({
    batchNumber: '',
    endoscopeSerial: '',
    dateRange: undefined as undefined | [Date, Date],
  })
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<CleaningBatch | null>(null)
  const [form] = Form.useForm()

  const filteredBatches = batches.filter(batch => {
    if (searchParams.batchNumber && !batch.batchNumber.includes(searchParams.batchNumber)) return false
    if (searchParams.endoscopeSerial && !batch.endoscopeSerial.includes(searchParams.endoscopeSerial)) return false
    return true
  })

  const columns = [
    { title: '批次号', dataIndex: 'batchNumber', key: 'batchNumber' },
    { title: '内镜编号', dataIndex: 'endoscopeSerial', key: 'endoscopeSerial' },
    { title: '患者', dataIndex: 'patientName', key: 'patientName', render: (name?: string) => name || '-' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => <Tag color={batchStatusConfig[status as keyof typeof batchStatusConfig].color}>
        {batchStatusConfig[status as keyof typeof batchStatusConfig].text}
      </Tag>
    },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', render: (time: string) => new Date(time).toLocaleString() },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime', render: (time?: string) => time ? new Date(time).toLocaleString() : '-' },
    { 
      title: '操作', 
      key: 'action',
      render: (_: unknown, record: CleaningBatch) => (
        <Space>
          <Button icon={<FileTextOutlined />} onClick={() => viewDetail(record)}>查看</Button>
          <Button icon={<PrinterOutlined />} onClick={() => printRecord(record)}>打印</Button>
        </Space>
      )
    },
  ]

  const handleSearch = () => {
    const values = form.getFieldsValue() as typeof searchParams
    setSearchParams(values)
  }

  const viewDetail = (batch: CleaningBatch) => {
    setSelectedBatch(batch)
    setShowDetailModal(true)
  }

  const printRecord = (batch: CleaningBatch) => {
    Modal.info({
      title: '打印追溯单',
      content: (
        <div className="print-container">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">消化内镜洗消追溯单</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>批次号: {batch.batchNumber}</div>
            <div>内镜编号: {batch.endoscopeSerial}</div>
            <div>患者: {batch.patientName || '-'}</div>
            <div>状态: {batchStatusConfig[batch.status].text}</div>
            <div>开始时间: {new Date(batch.startTime).toLocaleString()}</div>
            <div>结束时间: {batch.endTime ? new Date(batch.endTime).toLocaleString() : '-'}</div>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">洗消流程记录</h4>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={step.key} className="flex items-center gap-2">
                  <span>{index + 1}.</span>
                  <span className={index < batch.currentStep ? 'text-green-600' : 'text-gray-400'}>
                    {index < batch.currentStep ? '✓' : '○'} {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t pt-4 mt-4 text-right">
            <p>操作人员: {user.name}</p>
            <p>打印时间: {new Date().toLocaleString()}</p>
          </div>
        </div>
      ),
      width: 600,
      footer: (
        <Button type="primary" icon={<PrinterOutlined />} onClick={() => message.success('追溯单已发送至打印机')}>
          确认打印
        </Button>
      )
    })
  }

  return (
    <div>
      <Card title="追溯查询">
        <Form form={form} layout="inline" onFinish={handleSearch} className="mb-6">
          <Form.Item name="batchNumber">
            <Input 
              prefix={<BarcodeOutlined />}
              placeholder="批次号" 
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="endoscopeSerial">
            <Input 
              prefix={<SearchOutlined />}
              placeholder="内镜编号" 
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="dateRange">
            <DatePicker.RangePicker 
              prefix={<CalendarOutlined />}
              placeholder={['开始日期', '结束日期']}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">查询</Button>
          </Form.Item>
        </Form>

        <Table 
          columns={columns} 
          dataSource={filteredBatches} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="追溯详情"
        visible={showDetailModal}
        footer={null}
        onCancel={() => setShowDetailModal(false)}
        width={800}
      >
        {selectedBatch && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{selectedBatch.batchNumber}</h3>
              <Tag color={batchStatusConfig[selectedBatch.status].color}>
                {batchStatusConfig[selectedBatch.status].text}
              </Tag>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">内镜编号</p>
                <p className="font-medium">{selectedBatch.endoscopeSerial}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">患者信息</p>
                <p className="font-medium">{selectedBatch.patientName || '未关联'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">操作人</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">开始时间</p>
                <p>{new Date(selectedBatch.startTime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">结束时间</p>
                <p>{selectedBatch.endTime ? new Date(selectedBatch.endTime).toLocaleString() : '进行中'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">总耗时</p>
                <p>{selectedBatch.endTime ? Math.floor((new Date(selectedBatch.endTime).getTime() - new Date(selectedBatch.startTime).getTime()) / 60000) + '分钟' : '-'}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">洗消流程进度</h4>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.key} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      index < selectedBatch.currentStep 
                        ? 'bg-green-500' 
                        : index === selectedBatch.currentStep 
                          ? 'bg-blue-500' 
                          : 'bg-gray-300'
                    }`}>
                      {index < selectedBatch.currentStep ? '✓' : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        index < selectedBatch.currentStep ? 'text-green-600' : 'text-gray-700'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {index < selectedBatch.currentStep ? '已完成' : index === selectedBatch.currentStep ? '进行中' : '待处理'}
                      </p>
                    </div>
                    <div className={`h-1 flex-1 rounded-full ${
                      index < selectedBatch.currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button onClick={() => setShowDetailModal(false)}>关闭</Button>
              <Button type="primary" icon={<PrinterOutlined />} onClick={() => printRecord(selectedBatch)}>打印追溯单</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Traceability
