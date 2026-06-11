import { useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, DatePicker, Card, Space } from 'antd'
import { 
  SearchOutlined, 
  PrinterOutlined, 
  FileTextOutlined,
  CalendarOutlined,
  BarcodeOutlined
} from '@ant-design/icons'
import { useStore } from '../store/useStore'
import type { CleaningBatch } from '../data/mockData'

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
  const { batches, patients, endoscopes } = useStore()
  const [searchParams, setSearchParams] = useState({
    batchNumber: '',
    endoscopeSerial: '',
    dateRange: undefined as undefined | [Date, Date],
  })
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<CleaningBatch | null>(null)
  const [form] = Form.useForm()

  const filteredBatches = batches.filter(batch => {
    if (searchParams.batchNumber && !batch.batchNumber.includes(searchParams.batchNumber)) return false
    if (searchParams.endoscopeSerial && !batch.endoscopeSerial.includes(searchParams.endoscopeSerial)) return false
    
    if (searchParams.dateRange && searchParams.dateRange.length === 2) {
      const [startDate, endDate] = searchParams.dateRange
      const batchDate = new Date(batch.startTime)
      if (batchDate < startDate || batchDate > endDate) {
        return false
      }
    }
    
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
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime' },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime', render: (time?: string) => time || '-' },
    { 
      title: '操作', 
      key: 'action',
      render: (_: unknown, record: CleaningBatch) => (
        <Space>
          <Button icon={<FileTextOutlined />} onClick={() => viewDetail(record)}>查看</Button>
          <Button icon={<PrinterOutlined />} onClick={() => openPrintModal(record)}>打印</Button>
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

  const openPrintModal = (batch: CleaningBatch) => {
    setSelectedBatch(batch)
    setShowPrintModal(true)
  }

  const printRecord = () => {
    if (!selectedBatch) return
    
    const patient = patients.find(p => p.id === selectedBatch.patientId)
    const endoscope = endoscopes.find(e => e.id === selectedBatch.endoscopeId)
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>消化内镜洗消追溯单</title>
        <style>
          body { font-family: 'SimSun', serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { font-size: 24px; margin-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
          .info-item { padding: 10px; border-bottom: 1px solid #eee; }
          .info-label { color: #666; font-size: 14px; }
          .info-value { font-weight: bold; font-size: 16px; }
          .steps-section { margin-top: 30px; }
          .steps-section h3 { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .step-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .step-name { flex: 1; }
          .step-status { font-weight: bold; }
          .footer { margin-top: 40px; text-align: right; border-top: 1px solid #eee; padding-top: 20px; }
          .signature { margin-top: 30px; display: flex; justify-content: space-between; }
          .signature-box { border-bottom: 1px solid #000; width: 200px; text-align: center; padding-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>消化内镜洗消追溯单</h1>
          <p>批次号: ${selectedBatch.batchNumber}</p>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">内镜编号</div>
            <div class="info-value">${selectedBatch.endoscopeSerial}</div>
          </div>
          <div class="info-item">
            <div class="info-label">内镜型号</div>
            <div class="info-value">${endoscope?.model || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">患者姓名</div>
            <div class="info-value">${selectedBatch.patientName || '未关联'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">患者ID</div>
            <div class="info-value">${patient?.patientId || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">感染风险</div>
            <div class="info-value">${patient ? (patient.riskLevel === 'normal' ? '普通' : patient.riskLevel === 'high' ? '高风险' : '危重') : '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">洗消状态</div>
            <div class="info-value">${batchStatusConfig[selectedBatch.status].text}</div>
          </div>
          <div class="info-item">
            <div class="info-label">开始时间</div>
            <div class="info-value">${selectedBatch.startTime}</div>
          </div>
          <div class="info-item">
            <div class="info-label">结束时间</div>
            <div class="info-value">${selectedBatch.endTime || '进行中'}</div>
          </div>
        </div>
        
        <div class="steps-section">
          <h3>洗消流程记录</h3>
          <div class="step-item">
            <span class="step-name">1. 预处理</span>
            <span class="step-status" style="color: ${selectedBatch.steps.preprocess ? '#22c55e' : '#9ca3af'}">
              ${selectedBatch.steps.preprocess ? '✓ 已完成' : '○ 未完成'}
            </span>
          </div>
          <div class="step-item">
            <span class="step-name">2. 测漏登记</span>
            <span class="step-status" style="color: ${selectedBatch.steps.leakTest ? '#22c55e' : '#9ca3af'}">
              ${selectedBatch.steps.leakTest ? '✓ 已完成' : '○ 未完成'}
            </span>
          </div>
          <div class="step-item">
            <span class="step-name">3. 手工刷洗</span>
            <span class="step-status" style="color: ${selectedBatch.steps.manualBrush ? '#22c55e' : '#9ca3af'}">
              ${selectedBatch.steps.manualBrush ? '✓ 已完成' : '○ 未完成'}
            </span>
          </div>
          <div class="step-item">
            <span class="step-name">4. 机洗程序</span>
            <span class="step-status" style="color: ${selectedBatch.steps.machineWash ? '#22c55e' : '#9ca3af'}">
              ${selectedBatch.steps.machineWash ? '✓ 已完成' : '○ 未完成'}
            </span>
          </div>
          <div class="step-item">
            <span class="step-name">5. 消毒记录</span>
            <span class="step-status" style="color: ${selectedBatch.steps.disinfection ? '#22c55e' : '#9ca3af'}">
              ${selectedBatch.steps.disinfection ? '✓ 已完成' : '○ 未完成'}
            </span>
          </div>
          <div class="step-item">
            <span class="step-name">6. 干燥存放</span>
            <span class="step-status" style="color: ${selectedBatch.steps.dryStorage ? '#22c55e' : '#9ca3af'}">
              ${selectedBatch.steps.dryStorage ? '✓ 已完成' : '○ 未完成'}
            </span>
          </div>
        </div>
        
        <div class="footer">
          <div class="signature">
            <div>
              <div class="signature-box">操作人员签名</div>
              <div style="text-align: center; margin-top: 5px;">{user.name}</div>
            </div>
            <div>
              <div class="signature-box">质控人员签名</div>
              <div style="text-align: center; margin-top: 5px;">________________</div>
            </div>
          </div>
          <p style="margin-top: 20px;">打印时间: {new Date().toLocaleString('zh-CN')}</p>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
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
              style={{ width: 300 }}
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
                <p>{selectedBatch.startTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">结束时间</p>
                <p>{selectedBatch.endTime || '进行中'}</p>
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
              <Button type="primary" icon={<PrinterOutlined />} onClick={() => openPrintModal(selectedBatch)}>打印追溯单</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="打印追溯单"
        visible={showPrintModal}
        footer={null}
        onCancel={() => setShowPrintModal(false)}
        width={700}
      >
        {selectedBatch && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">消化内镜洗消追溯单</h2>
              <p className="text-gray-500 mt-2">批次号: {selectedBatch.batchNumber}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">内镜编号</p>
                <p className="font-medium">{selectedBatch.endoscopeSerial}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">内镜型号</p>
                <p className="font-medium">{endoscopes.find(e => e.id === selectedBatch.endoscopeId)?.model || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">患者姓名</p>
                <p className="font-medium">{selectedBatch.patientName || '未关联'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">患者ID</p>
                <p className="font-medium">{patients.find(p => p.id === selectedBatch.patientId)?.patientId || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">感染风险</p>
                <p className="font-medium">
                  {patients.find(p => p.id === selectedBatch.patientId) 
                    ? (patients.find(p => p.id === selectedBatch.patientId)!.riskLevel === 'normal' ? '普通' : 
                       patients.find(p => p.id === selectedBatch.patientId)!.riskLevel === 'high' ? '高风险' : '危重') 
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">洗消状态</p>
                <p className="font-medium">{batchStatusConfig[selectedBatch.status].text}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">开始时间</p>
                <p>{selectedBatch.startTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">结束时间</p>
                <p>{selectedBatch.endTime || '进行中'}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">洗消流程记录</h4>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div key={step.key} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>{index + 1}. {step.title}</span>
                    <span className={selectedBatch!.steps[step.key as keyof typeof selectedBatch.steps] ? 'text-green-600 font-medium' : 'text-gray-400'}>
                      {selectedBatch!.steps[step.key as keyof typeof selectedBatch.steps] ? '✓ 已完成' : '○ 未完成'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between">
                <div className="text-center">
                  <div className="border-b border-gray-300 w-32 pb-1 mb-1">操作人员签名</div>
                  <p>{user.name}</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-gray-300 w-32 pb-1 mb-1">质控人员签名</div>
                  <p className="text-gray-400">________________</p>
                </div>
              </div>
              <p className="text-right text-sm text-gray-500 mt-4">打印时间: {new Date().toLocaleString('zh-CN')}</p>
            </div>

            <div className="flex justify-end gap-3">
              <Button onClick={() => setShowPrintModal(false)}>关闭</Button>
              <Button type="primary" icon={<PrinterOutlined />} onClick={printRecord}>确认打印</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Traceability
