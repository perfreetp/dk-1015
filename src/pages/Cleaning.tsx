import { useState, useEffect } from 'react'
import { Card, Steps, Button, Form, Input, Select, Radio, message, Modal, Table, Tag } from 'antd'
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  FileTextOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { mockCleaningBatches, mockEndoscopes, type CleaningBatch } from '../data/mockData'

interface User {
  id: number
  username: string
  name: string
  role: 'nurse' | 'cleaner' | 'qc'
}

interface CleaningProps {
  user: User
}

const steps = [
  { title: '预处理', description: '计时记录' },
  { title: '测漏登记', description: '测漏检测' },
  { title: '手工刷洗', description: '刷洗确认' },
  { title: '机洗程序', description: '程序选择' },
  { title: '消毒记录', description: '浓度检测' },
  { title: '干燥存放', description: '定位存放' },
]

const programOptions = [
  { value: 'standard', label: '标准清洗程序' },
  { value: 'enhanced', label: '强化清洗程序' },
  { value: 'quick', label: '快速清洗程序' },
]

const storageLocations = [
  { value: 'A-1', label: 'A区-1号柜' },
  { value: 'A-2', label: 'A区-2号柜' },
  { value: 'B-1', label: 'B区-1号柜' },
  { value: 'B-2', label: 'B区-2号柜' },
]

function Cleaning({ user }: CleaningProps) {
  const [batches] = useState<CleaningBatch[]>(mockCleaningBatches)
  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [timer, setTimer] = useState(0)
  const [selectedBatch, setSelectedBatch] = useState<CleaningBatch | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [form] = Form.useForm()
  const [stepData, setStepData] = useState({
    preprocess: { duration: 0, completed: false },
    leakTest: { result: true, description: '', completed: false },
    manualBrush: { completed: false, signature: '' },
    machineWash: { program: '', runTime: 0, completed: false },
    disinfection: { concentration: 0, time: 0, temperature: 0, completed: false },
    dryStorage: { dryTime: 0, location: '', completed: false },
  })

  useEffect(() => {
    let interval: number
    if (isRunning) {
      interval = window.setInterval(() => {
        setTimer(t => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = () => {
    setIsRunning(true)
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const completeStep = () => {
    if (currentStep === 0) {
      setStepData(prev => ({ ...prev, preprocess: { duration: timer, completed: true } }))
    } else if (currentStep === 1) {
      const values = form.getFieldsValue() as { leakResult: boolean; leakDesc: string }
      setStepData(prev => ({ 
        ...prev, 
        leakTest: { result: values.leakResult, description: values.leakDesc, completed: true } 
      }))
      if (!values.leakResult) {
        Modal.warning({
          title: '测漏未通过',
          content: '内镜测漏未通过，已自动隔离',
        })
      }
    } else if (currentStep === 2) {
      setStepData(prev => ({ ...prev, manualBrush: { completed: true, signature: user.name } }))
    } else if (currentStep === 3) {
      const values = form.getFieldsValue() as { program: string }
      setStepData(prev => ({ 
        ...prev, 
        machineWash: { program: values.program, runTime: timer, completed: true } 
      }))
    } else if (currentStep === 4) {
      const values = form.getFieldsValue() as { concentration: number; disinfectionTime: number; temperature: number }
      setStepData(prev => ({ 
        ...prev, 
        disinfection: { 
          concentration: values.concentration, 
          time: values.disinfectionTime, 
          temperature: values.temperature,
          completed: true 
        } 
      }))
    } else if (currentStep === 5) {
      const values = form.getFieldsValue() as { dryTime: number; location: string }
      setStepData(prev => ({ 
        ...prev, 
        dryStorage: { dryTime: values.dryTime, location: values.location, completed: true } 
      }))
      message.success('洗消流程完成！')
      setSelectedBatch(null)
      setCurrentStep(0)
      setTimer(0)
      setIsRunning(false)
      form.resetFields()
      return
    }
    
    setCurrentStep(s => s + 1)
    setTimer(0)
    setIsRunning(false)
    form.resetFields()
  }

  const startNewBatch = () => {
    Modal.info({
      title: '选择内镜',
      content: (
        <Select
          style={{ width: '100%' }}
          options={mockEndoscopes
            .filter(e => e.status === 'in_use')
            .map(e => ({ value: e.id, label: `${e.serialNumber} - ${e.model}` }))
          }
          placeholder="选择要洗消的内镜"
        />
      ),
      footer: (
        <Button type="primary" onClick={() => {
          message.success('开始洗消流程')
          setSelectedBatch({
            id: Date.now(),
            batchNumber: `CB${Date.now()}`,
            endoscopeId: 1,
            endoscopeSerial: 'TJ-2024-001',
            status: 'processing',
            currentStep: 0,
            steps: { preprocess: false, leakTest: false, manualBrush: false, machineWash: false, disinfection: false, dryStorage: false },
            startTime: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          })
        }}>
          确认开始
        </Button>
      )
    })
  }

  const batchStatusConfig = {
    pending: { color: 'default', text: '待开始' },
    processing: { color: 'blue', text: '处理中' },
    completed: { color: 'green', text: '已完成' },
    abnormal: { color: 'red', text: '异常' },
  }

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
    { title: '当前步骤', dataIndex: 'currentStep', key: 'currentStep', render: (step: number) => steps[step]?.title || '-' },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', render: (time: string) => new Date(time).toLocaleString() },
    { 
      title: '操作', 
      key: 'action',
      render: (_: unknown, record: CleaningBatch) => (
        <Button 
          icon={<FileTextOutlined />} 
          onClick={() => {
            setSelectedBatch(record)
            setShowDetailModal(true)
          }}
        >
          详情
        </Button>
      )
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <Card 
          title="洗消批次列表" 
          extra={<Button type="primary" onClick={startNewBatch}>开始新批次</Button>}
        >
          <Table 
            columns={columns} 
            dataSource={batches} 
            rowKey="id" 
            pagination={{ pageSize: 8 }}
          />
        </Card>
      </div>

      <div className="space-y-6">
        {selectedBatch ? (
          <Card title={`批次 ${selectedBatch.batchNumber}`}>
            <Steps current={currentStep} items={steps} />
            
            <div className="mt-6 space-y-4">
              {currentStep === 0 && (
                <div>
                  <div className="text-center text-4xl font-bold text-primary mb-4">{formatTime(timer)}</div>
                  <div className="flex gap-2 justify-center">
                    {!isRunning ? (
                      <Button type="primary" icon={<PlayCircleOutlined />} onClick={startTimer}>开始计时</Button>
                    ) : (
                      <Button type="default" icon={<PauseCircleOutlined />} onClick={pauseTimer}>暂停</Button>
                    )}
                    <Button type="primary" icon={<CheckCircleOutlined />} onClick={completeStep}>完成预处理</Button>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <Form form={form} layout="vertical">
                  <Form.Item name="leakResult" label="测漏结果" rules={[{ required: true }]}>
                    <Radio.Group>
                      <Radio value={true}>通过</Radio>
                      <Radio value={false}>未通过</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item name="leakDesc" label="问题描述">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                  <Form.Item name="leakImage" label="图片上传">
                    <Button icon={<UploadOutlined />}>上传测漏照片</Button>
                  </Form.Item>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={completeStep}>确认测漏</Button>
                </Form>
              )}

              {currentStep === 2 && (
                <div>
                  <p className="mb-4">请确认手工刷洗完成并签名</p>
                  <div className="bg-gray-100 p-4 rounded-lg mb-4">
                    <p className="text-center">签名区域</p>
                    <div className="w-full h-24 border border-dashed border-gray-300 rounded mt-2 flex items-center justify-center">
                      <span className="text-gray-400">点击或手写签名</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">操作人员: {user.name}</p>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={completeStep}>确认刷洗完成</Button>
                </div>
              )}

              {currentStep === 3 && (
                <Form form={form} layout="vertical">
                  <Form.Item name="program" label="选择程序" rules={[{ required: true }]}>
                    <Select options={programOptions} />
                  </Form.Item>
                  <div className="text-center text-4xl font-bold text-primary mb-4">{formatTime(timer)}</div>
                  <div className="flex gap-2 justify-center">
                    {!isRunning ? (
                      <Button type="primary" icon={<PlayCircleOutlined />} onClick={startTimer}>开始机洗</Button>
                    ) : (
                      <Button type="default" icon={<PauseCircleOutlined />} onClick={pauseTimer}>暂停</Button>
                    )}
                    <Button type="primary" icon={<CheckCircleOutlined />} onClick={completeStep}>完成机洗</Button>
                  </div>
                </Form>
              )}

              {currentStep === 4 && (
                <Form form={form} layout="vertical">
                  <Form.Item name="concentration" label="消毒液浓度(%)" rules={[{ required: true }]}>
                    <Input type="number" placeholder="请输入浓度" />
                  </Form.Item>
                  <Form.Item name="disinfectionTime" label="消毒时间(分钟)" rules={[{ required: true }]}>
                    <Input type="number" placeholder="请输入时间" />
                  </Form.Item>
                  <Form.Item name="temperature" label="温度(℃)" rules={[{ required: true }]}>
                    <Input type="number" placeholder="请输入温度" />
                  </Form.Item>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={completeStep}>确认消毒</Button>
                </Form>
              )}

              {currentStep === 5 && (
                <Form form={form} layout="vertical">
                  <Form.Item name="dryTime" label="干燥时间(分钟)" rules={[{ required: true }]}>
                    <Input type="number" placeholder="请输入时间" />
                  </Form.Item>
                  <Form.Item name="location" label="存放位置" rules={[{ required: true }]}>
                    <Select options={storageLocations} />
                  </Form.Item>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={completeStep}>完成洗消</Button>
                </Form>
              )}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-12">
              <ClockCircleOutlined className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">选择或创建一个洗消批次</p>
              <Button type="primary" className="mt-4" onClick={startNewBatch}>开始新批次</Button>
            </div>
          </Card>
        )}

        <Card title="流程说明">
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>预处理: 内镜使用后立即进行初步处理</li>
            <li>测漏登记: 检查内镜是否有泄漏</li>
            <li>手工刷洗: 彻底清洗内镜表面</li>
            <li>机洗程序: 使用清洗机进行深度清洗</li>
            <li>消毒记录: 消毒液浓度检测与记录</li>
            <li>干燥存放: 干燥后存放至指定位置</li>
          </ol>
        </Card>
      </div>

      <Modal
        title="洗消详情"
        visible={showDetailModal}
        footer={null}
        onCancel={() => setShowDetailModal(false)}
        width={800}
      >
        {selectedBatch && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{selectedBatch.batchNumber}</h3>
              <Tag color={batchStatusConfig[selectedBatch.status].color}>
                {batchStatusConfig[selectedBatch.status].text}
              </Tag>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>内镜编号: {selectedBatch.endoscopeSerial}</div>
              <div>患者: {selectedBatch.patientName || '-'}</div>
              <div>开始时间: {new Date(selectedBatch.startTime).toLocaleString()}</div>
              <div>结束时间: {selectedBatch.endTime ? new Date(selectedBatch.endTime).toLocaleString() : '进行中'}</div>
            </div>
            <Steps current={selectedBatch.currentStep} items={steps} />
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">流程记录</h4>
              <div className="space-y-2 text-sm">
                <div className={stepData.preprocess.completed ? 'text-green-600' : 'text-gray-400'}>
                  {stepData.preprocess.completed ? '✓' : '○'} 预处理: {stepData.preprocess.duration}秒
                </div>
                <div className={stepData.leakTest.completed ? 'text-green-600' : 'text-gray-400'}>
                  {stepData.leakTest.completed ? '✓' : '○'} 测漏登记: {stepData.leakTest.result ? '通过' : '未通过'}
                </div>
                <div className={stepData.manualBrush.completed ? 'text-green-600' : 'text-gray-400'}>
                  {stepData.manualBrush.completed ? '✓' : '○'} 手工刷洗: {stepData.manualBrush.signature}
                </div>
                <div className={stepData.machineWash.completed ? 'text-green-600' : 'text-gray-400'}>
                  {stepData.machineWash.completed ? '✓' : '○'} 机洗程序: {stepData.machineWash.program || '-'}
                </div>
                <div className={stepData.disinfection.completed ? 'text-green-600' : 'text-gray-400'}>
                  {stepData.disinfection.completed ? '✓' : '○'} 消毒记录: {stepData.disinfection.concentration}%
                </div>
                <div className={stepData.dryStorage.completed ? 'text-green-600' : 'text-gray-400'}>
                  {stepData.dryStorage.completed ? '✓' : '○'} 干燥存放: {stepData.dryStorage.location || '-'}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Cleaning
