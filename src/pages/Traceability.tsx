import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Button, Modal, Form, Input, DatePicker, Card, Space, Select } from 'antd'
import { 
  SearchOutlined, 
  PrinterOutlined, 
  FileTextOutlined,
  CalendarOutlined,
  BarcodeOutlined,
  UserOutlined,
  ExperimentOutlined as EndoscopeOutlined,
  RightCircleOutlined
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

const programLabelMap: Record<string, string> = {
  'standard': '标准清洗程序',
  'enhanced': '强化清洗程序',
  'quick': '快速清洗程序',
}

function Traceability({ user }: TraceabilityProps) {
  const navigate = useNavigate()
  const { batches, patients, endoscopes } = useStore()
  const [searchParams, setSearchParams] = useState({
    batchNumber: '',
    endoscopeSerial: '',
    patientName: '',
    status: undefined as string | undefined,
    dateRange: undefined as undefined | [Date, Date],
  })
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<CleaningBatch | null>(null)
  const [form] = Form.useForm()

  const filteredBatches = batches.filter(batch => {
    if (searchParams.batchNumber && !batch.batchNumber.includes(searchParams.batchNumber)) return false
    if (searchParams.endoscopeSerial && !batch.endoscopeSerial.includes(searchParams.endoscopeSerial)) return false
    if (searchParams.patientName && !(batch.patientName || '').includes(searchParams.patientName)) return false
    if (searchParams.status && batch.status !== searchParams.status) return false
    
    if (searchParams.dateRange && searchParams.dateRange.length === 2) {
      const [startDate, endDate] = searchParams.dateRange
      const batchDate = new Date(batch.startTime)
      
      const startOfDay = new Date(startDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(endDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      if (batchDate < startOfDay || batchDate > endOfDay) {
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
    const values = form.getFieldsValue() as { 
      batchNumber?: string
      endoscopeSerial?: string
      patientName?: string
      status?: string
      dateRange?: [Date, Date] 
    }
    setSearchParams({
      batchNumber: values.batchNumber || '',
      endoscopeSerial: values.endoscopeSerial || '',
      patientName: values.patientName || '',
      status: values.status,
      dateRange: values.dateRange,
    })
  }

  const goToCleaning = (batchId: number) => {
    navigate('/cleaning', { state: { batchId } })
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
    const stepDetails = selectedBatch.stepDetails || {}
    
    const currentUserName = user.name
    const currentPrintTime = new Date().toLocaleString('zh-CN')
    const preprocessDone = selectedBatch.steps.preprocess
    const leakTestDone = selectedBatch.steps.leakTest
    const manualBrushDone = selectedBatch.steps.manualBrush
    const machineWashDone = selectedBatch.steps.machineWash
    const disinfectionDone = selectedBatch.steps.disinfection
    const dryStorageDone = selectedBatch.steps.dryStorage
    const preprocessDetails = stepDetails.preprocess
    const leakTestDetails = stepDetails.leakTest
    const manualBrushDetails = stepDetails.manualBrush
    const machineWashDetails = stepDetails.machineWash
    const disinfectionDetails = stepDetails.disinfection
    const dryStorageDetails = stepDetails.dryStorage

    const printContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>消化内镜洗消追溯单</title>
  <style>
    body { font-family: 'SimSun', serif; padding: 20px; font-size: 14px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 24px; margin-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
    .info-item { padding: 10px; border-bottom: 1px solid #eee; }
    .info-label { color: #666; font-size: 13px; }
    .info-value { font-weight: bold; font-size: 15px; }
    .steps-section { margin-top: 30px; }
    .steps-section h3 { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; font-size: 16px; }
    .step-item { padding: 12px 15px; border-bottom: 1px solid #eee; }
    .step-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .step-name { font-weight: bold; }
    .step-status { font-weight: bold; }
    .step-details { padding-left: 15px; font-size: 13px; color: #555; line-height: 1.6; }
    .footer { margin-top: 40px; text-align: right; border-top: 1px solid #eee; padding-top: 20px; }
    .signature { margin-top: 30px; display: flex; justify-content: space-between; padding: 0 20px; }
    .signature-box { border-bottom: 1px solid #000; width: 200px; text-align: center; padding-bottom: 5px; margin-bottom: 10px; }
    .operator-info { font-size: 13px; color: #666; }
    .print-time { margin-top: 20px; font-size: 12px; color: #888; }
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
      <div class="step-header">
        <span class="step-name">1. 预处理</span>
        <span class="step-status" style="color: ${preprocessDone ? '#22c55e' : '#9ca3af'}">
          ${preprocessDone ? '✓ 已完成' : '○ 未完成'}
        </span>
      </div>
      ${preprocessDetails ? `<div class="step-details">
        开始时间: ${preprocessDetails.startTime || '-'}<br>
        预处理时长: ${preprocessDetails.duration}秒
      </div>` : ''}
    </div>
    
    <div class="step-item">
      <div class="step-header">
        <span class="step-name">2. 测漏登记</span>
        <span class="step-status" style="color: ${leakTestDone ? '#22c55e' : '#9ca3af'}">
          ${leakTestDone ? '✓ 已完成' : '○ 未完成'}
        </span>
      </div>
      ${leakTestDetails ? `<div class="step-details">
        测漏结果: ${leakTestDetails.result ? '通过' : '未通过'}<br>
        操作者: ${leakTestDetails.operator || '-'}${leakTestDetails.description ? `<br>问题描述: ${leakTestDetails.description}` : ''}
      </div>` : ''}
    </div>
    
    <div class="step-item">
      <div class="step-header">
        <span class="step-name">3. 手工刷洗</span>
        <span class="step-status" style="color: ${manualBrushDone ? '#22c55e' : '#9ca3af'}">
          ${manualBrushDone ? '✓ 已完成' : '○ 未完成'}
        </span>
      </div>
      ${manualBrushDetails ? `<div class="step-details">
        操作人员签名: ${manualBrushDetails.signature || '-'}
      </div>` : ''}
    </div>
    
    <div class="step-item">
      <div class="step-header">
        <span class="step-name">4. 机洗程序</span>
        <span class="step-status" style="color: ${machineWashDone ? '#22c55e' : '#9ca3af'}">
          ${machineWashDone ? '✓ 已完成' : '○ 未完成'}
        </span>
      </div>
      ${machineWashDetails ? `<div class="step-details">
        程序选择: ${programLabelMap[machineWashDetails.program] || machineWashDetails.program}<br>
        运行时长: ${machineWashDetails.runTime}秒<br>
        开始时间: ${machineWashDetails.startTime || '-'}
      </div>` : ''}
    </div>
    
    <div class="step-item">
      <div class="step-header">
        <span class="step-name">5. 消毒记录</span>
        <span class="step-status" style="color: ${disinfectionDone ? '#22c55e' : '#9ca3af'}">
          ${disinfectionDone ? '✓ 已完成' : '○ 未完成'}
        </span>
      </div>
      ${disinfectionDetails ? `<div class="step-details">
        消毒液浓度: ${disinfectionDetails.concentration}%<br>
        消毒时间: ${disinfectionDetails.time}分钟<br>
        消毒温度: ${disinfectionDetails.temperature}℃<br>
        操作者: ${disinfectionDetails.operator || '-'}
      </div>` : ''}
    </div>
    
    <div class="step-item">
      <div class="step-header">
        <span class="step-name">6. 干燥存放</span>
        <span class="step-status" style="color: ${dryStorageDone ? '#22c55e' : '#9ca3af'}">
          ${dryStorageDone ? '✓ 已完成' : '○ 未完成'}
        </span>
      </div>
      ${dryStorageDetails ? `<div class="step-details">
        干燥时间: ${dryStorageDetails.dryTime}分钟<br>
        存放位置: ${dryStorageDetails.location || '-'}<br>
        操作者: ${dryStorageDetails.operator || '-'}
      </div>` : ''}
    </div>
  </div>
  
  <div class="footer">
    <div class="signature">
      <div>
        <div class="signature-box">操作人员签名</div>
        <div class="operator-info">${currentUserName}</div>
      </div>
      <div>
        <div class="signature-box">质控人员签名</div>
        <div class="operator-info">________________</div>
      </div>
    </div>
    <div class="print-time">打印时间: ${currentPrintTime}</div>
    <div class="print-time">打印人员: ${currentUserName}</div>
  </div>
</body>
</html>`

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
              style={{ width: 180 }}
            />
          </Form.Item>
          <Form.Item name="endoscopeSerial">
            <Input 
              prefix={<EndoscopeOutlined />}
              placeholder="内镜编号" 
              style={{ width: 180 }}
            />
          </Form.Item>
          <Form.Item name="patientName">
            <Input 
              prefix={<UserOutlined />}
              placeholder="患者姓名" 
              style={{ width: 150 }}
            />
          </Form.Item>
          <Form.Item name="status">
            <Select
              placeholder="批次状态"
              style={{ width: 120 }}
              allowClear
              options={[
                { value: 'pending', label: '待开始' },
                { value: 'processing', label: '处理中' },
                { value: 'completed', label: '已完成' },
                { value: 'abnormal', label: '异常' },
              ]}
            />
          </Form.Item>
          <Form.Item name="dateRange">
            <DatePicker.RangePicker 
              prefix={<CalendarOutlined />}
              placeholder={['开始日期', '结束日期']}
              style={{ width: 280 }}
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
                {steps.map((step, index) => {
                  const details = selectedBatch.stepDetails?.[step.key as keyof typeof selectedBatch.stepDetails]
                  const isCompleted = selectedBatch.steps[step.key as keyof typeof selectedBatch.steps]
                  
                  return (
                    <div key={step.key} className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                        isCompleted ? 'bg-green-500' : index === selectedBatch.currentStep ? 'bg-blue-500' : 'bg-gray-300'
                      }`}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isCompleted ? 'text-green-600' : 'text-gray-700'}`}>
                          {step.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {isCompleted ? '已完成' : index === selectedBatch.currentStep ? '进行中' : '待处理'}
                        </p>
                        {isCompleted && details && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                            {step.key === 'preprocess' && (
                              <>
                                <p>开始时间: {(details as { startTime?: string }).startTime || '-'}</p>
                                <p>预处理时长: {(details as { duration: number }).duration}秒</p>
                              </>
                            )}
                            {step.key === 'leakTest' && (
                              <>
                                <p>测漏结果: {(details as { result: boolean }).result ? '通过' : '未通过'}</p>
                                <p>操作者: {(details as { operator?: string }).operator || '-'}</p>
                                {(details as { description: string }).description && (
                                  <p>问题描述: {(details as { description: string }).description}</p>
                                )}
                              </>
                            )}
                            {step.key === 'manualBrush' && (
                              <p>操作人员签名: {(details as { signature: string }).signature}</p>
                            )}
                            {step.key === 'machineWash' && (
                              <>
                                <p>程序选择: {programLabelMap[(details as { program: string }).program] || (details as { program: string }).program}</p>
                                <p>运行时长: {(details as { runTime: number }).runTime}秒</p>
                              </>
                            )}
                            {step.key === 'disinfection' && (
                              <>
                                <p>消毒液浓度: {(details as { concentration: number }).concentration}%</p>
                                <p>消毒时间: {(details as { time: number }).time}分钟</p>
                                <p>消毒温度: {(details as { temperature: number }).temperature}℃</p>
                                <p>操作者: {(details as { operator?: string }).operator || '-'}</p>
                              </>
                            )}
                            {step.key === 'dryStorage' && (
                              <>
                                <p>干燥时间: {(details as { dryTime: number }).dryTime}分钟</p>
                                <p>存放位置: {(details as { location: string }).location}</p>
                                <p>操作者: {(details as { operator?: string }).operator || '-'}</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button onClick={() => setShowDetailModal(false)}>关闭</Button>
              {selectedBatch.status !== 'completed' && selectedBatch.status !== 'abnormal' && (
                <Button 
                  type="default" 
                  icon={<RightCircleOutlined />}
                  onClick={() => goToCleaning(selectedBatch.id)}
                >
                  继续处理
                </Button>
              )}
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
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const details = selectedBatch.stepDetails?.[step.key as keyof typeof selectedBatch.stepDetails]
                  const isCompleted = selectedBatch.steps[step.key as keyof typeof selectedBatch.steps]
                  
                  return (
                    <div key={step.key} className="border-b border-gray-100 pb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{index + 1}. {step.title}</span>
                        <span className={isCompleted ? 'text-green-600 font-medium' : 'text-gray-400'}>
                          {isCompleted ? '✓ 已完成' : '○ 未完成'}
                        </span>
                      </div>
                      {isCompleted && details && (
                        <div className="ml-4 text-sm text-gray-600 space-y-1">
                          {step.key === 'preprocess' && (
                            <>
                              <p>开始时间: {(details as { startTime?: string }).startTime || '-'}</p>
                              <p>预处理时长: {(details as { duration: number }).duration}秒</p>
                            </>
                          )}
                          {step.key === 'leakTest' && (
                            <>
                              <p>测漏结果: {(details as { result: boolean }).result ? '通过' : '未通过'}</p>
                              <p>操作者: {(details as { operator?: string }).operator || '-'}</p>
                              {(details as { description: string }).description && (
                                <p>问题描述: {(details as { description: string }).description}</p>
                              )}
                            </>
                          )}
                          {step.key === 'manualBrush' && (
                            <p>操作人员签名: {(details as { signature: string }).signature}</p>
                          )}
                          {step.key === 'machineWash' && (
                            <>
                              <p>程序选择: {programLabelMap[(details as { program: string }).program] || (details as { program: string }).program}</p>
                              <p>运行时长: {(details as { runTime: number }).runTime}秒</p>
                            </>
                          )}
                          {step.key === 'disinfection' && (
                            <>
                              <p>消毒液浓度: {(details as { concentration: number }).concentration}%</p>
                              <p>消毒时间: {(details as { time: number }).time}分钟</p>
                              <p>消毒温度: {(details as { temperature: number }).temperature}℃</p>
                              <p>操作者: {(details as { operator?: string }).operator || '-'}</p>
                            </>
                          )}
                          {step.key === 'dryStorage' && (
                            <>
                              <p>干燥时间: {(details as { dryTime: number }).dryTime}分钟</p>
                              <p>存放位置: {(details as { location: string }).location}</p>
                              <p>操作者: {(details as { operator?: string }).operator || '-'}</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
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
              <p className="text-right text-sm text-gray-500">打印人员: {user.name}</p>
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
