import { useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, message, Card, Space, Radio } from 'antd'
import { 
  PlusOutlined, 
  ScanOutlined, 
  EditOutlined, 
  EyeOutlined,
  LinkOutlined
} from '@ant-design/icons'
import { useStore } from '../store/useStore'
import type { Patient } from '../data/mockData'

const riskLevelConfig = {
  normal: { color: 'green', text: '普通' },
  high: { color: 'orange', text: '高风险' },
  critical: { color: 'red', text: '危重' },
}

function Patient() {
  const { patients, endoscopes, batches, addPatient, updatePatient, addBatch, updateEndoscopeStatus } = useStore()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isScanModalVisible, setIsScanModalVisible] = useState(false)
  const [isBindModalVisible, setIsBindModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<Patient | null>(null)
  const [bindingPatient, setBindingPatient] = useState<Patient | null>(null)
  const [selectedEndoscopeId, setSelectedEndoscopeId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const [scanValue, setScanValue] = useState('')

  const columns = [
    { title: '患者ID', dataIndex: 'patientId', key: 'patientId' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '性别', dataIndex: 'gender', key: 'gender' },
    { title: '年龄', dataIndex: 'age', key: 'age' },
    { 
      title: '感染风险', 
      dataIndex: 'riskLevel', 
      key: 'riskLevel',
      render: (level: string) => <Tag color={riskLevelConfig[level as keyof typeof riskLevelConfig].color}>
        {riskLevelConfig[level as keyof typeof riskLevelConfig].text}
      </Tag>
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    { 
      title: '操作', 
      key: 'action',
      render: (_: unknown, record: Patient) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => showDetail(record)} />
          <Button icon={<EditOutlined />} onClick={() => editItem(record)} />
          <Button icon={<LinkOutlined />} onClick={() => openBindModal(record)} />
        </Space>
      )
    },
  ]

  const showModal = () => {
    setEditingItem(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const editItem = (item: Patient) => {
    setEditingItem(item)
    form.setFieldsValue(item)
    setIsModalVisible(true)
  }

  const showDetail = (patient: Patient) => {
    const patientBatches = batches.filter(b => b.patientId === patient.id)
    Modal.info({
      title: '患者详情',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><strong>患者ID:</strong> {patient.patientId}</div>
            <div><strong>姓名:</strong> {patient.name}</div>
            <div><strong>性别:</strong> {patient.gender}</div>
            <div><strong>年龄:</strong> {patient.age}</div>
            <div><strong>感染风险:</strong> <Tag color={riskLevelConfig[patient.riskLevel].color}>{riskLevelConfig[patient.riskLevel].text}</Tag></div>
            <div><strong>创建时间:</strong> {patient.createdAt}</div>
          </div>
          {patientBatches.length > 0 && (
            <div>
              <h4 className="font-semibold mt-4 mb-2">关联的洗消批次:</h4>
              <ul className="space-y-1">
                {patientBatches.map(batch => (
                  <li key={batch.id}>批次号: {batch.batchNumber} - 内镜: {batch.endoscopeSerial} - 状态: {batch.status}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    })
  }

  const showScanModal = () => {
    setScanValue('')
    setIsScanModalVisible(true)
  }

  const openBindModal = (patient: Patient) => {
    setBindingPatient(patient)
    setSelectedEndoscopeId(null)
    setIsBindModalVisible(true)
  }

  const handleOk = () => {
    form.validateFields().then(values => {
      if (editingItem) {
        updatePatient(editingItem.id, values)
        message.success('更新成功')
      } else {
        addPatient({
          ...values,
          patientId: values.patientId || `P${Date.now()}`,
          createdAt: new Date().toLocaleString('zh-CN'),
        })
        message.success('创建成功')
      }
      setIsModalVisible(false)
    })
  }

  const handleScanSubmit = () => {
    if (!scanValue) {
      message.error('请扫描患者ID或手动输入')
      return
    }
    const existingPatient = patients.find(p => p.patientId === scanValue || p.name === scanValue)
    if (existingPatient) {
      message.success(`找到患者: ${existingPatient.name}`)
      openBindModal(existingPatient)
      setIsScanModalVisible(false)
    } else {
      message.info('未找到患者，是否新建？')
      form.setFieldsValue({ patientId: scanValue })
      setIsScanModalVisible(false)
      setIsModalVisible(true)
    }
  }

  const handleBindSubmit = () => {
    if (!selectedEndoscopeId) {
      message.error('请选择要绑定的内镜')
      return
    }
    if (!bindingPatient) return

    const endoscope = endoscopes.find(e => e.id === selectedEndoscopeId)
    if (!endoscope) {
      message.error('所选内镜不存在')
      return
    }

    const now = new Date()
    const batchNumber = `CB${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(batches.length + 1).padStart(3, '0')}`

    addBatch({
      batchNumber,
      endoscopeId: endoscope.id,
      endoscopeSerial: endoscope.serialNumber,
      patientId: bindingPatient.id,
      patientName: bindingPatient.name,
      status: 'pending',
      currentStep: 0,
      steps: {
        preprocess: false,
        leakTest: false,
        manualBrush: false,
        machineWash: false,
        disinfection: false,
        dryStorage: false,
      },
      startTime: now.toLocaleString('zh-CN'),
    })

    updateEndoscopeStatus(endoscope.id, 'in_use')

    message.success(`绑定成功！已创建洗消批次: ${batchNumber}`)
    setIsBindModalVisible(false)
    setBindingPatient(null)
    setSelectedEndoscopeId(null)
  }

  return (
    <div>
      <Card 
        title="患者关联管理" 
        extra={
          <Space>
            <Button icon={<ScanOutlined />} onClick={showScanModal}>
              扫码绑定
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
              新增患者
            </Button>
          </Space>
        }
      >
        <Table 
          columns={columns} 
          dataSource={patients} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑患者' : '新增患者'}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="patientId" label="患者ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Radio.Group>
              <Radio value="男">男</Radio>
              <Radio value="女">女</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="age" label="年龄">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="riskLevel" label="感染风险等级">
            <Select defaultValue="normal">
              <Select.Option value="normal">普通</Select.Option>
              <Select.Option value="high">高风险</Select.Option>
              <Select.Option value="critical">危重</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="扫码绑定患者"
        visible={isScanModalVisible}
        onOk={handleScanSubmit}
        onCancel={() => setIsScanModalVisible(false)}
      >
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <ScanOutlined className="w-16 h-16 text-gray-400" />
          </div>
          <p className="mb-4">请使用扫码枪扫描患者腕带二维码</p>
          <Input
            value={scanValue}
            onChange={e => setScanValue(e.target.value)}
            placeholder="或手动输入患者ID"
            className="text-center text-xl"
          />
        </div>
      </Modal>

      <Modal
        title="绑定内镜"
        visible={isBindModalVisible}
        onOk={handleBindSubmit}
        onCancel={() => {
          setIsBindModalVisible(false)
          setBindingPatient(null)
          setSelectedEndoscopeId(null)
        }}
      >
        {bindingPatient && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded">
              <p><strong>患者信息:</strong></p>
              <p>姓名: {bindingPatient.name}</p>
              <p>患者ID: {bindingPatient.patientId}</p>
              <p>感染风险: <Tag color={riskLevelConfig[bindingPatient.riskLevel].color}>{riskLevelConfig[bindingPatient.riskLevel].text}</Tag></p>
            </div>
            <div>
              <label className="block mb-2 font-medium">选择要绑定的内镜（仅限使用中状态）:</label>
              <Select
                value={selectedEndoscopeId}
                onChange={(value) => setSelectedEndoscopeId(value)}
                style={{ width: '100%' }}
                options={endoscopes
                  .filter(e => e.status === 'in_use' || e.status === 'available')
                  .map(e => ({ 
                    value: e.id, 
                    label: `${e.serialNumber} - ${e.model} - ${e.status === 'in_use' ? '使用中' : '可领用'}` 
                  }))
                }
                placeholder="请选择内镜"
              />
              {endoscopes.filter(e => e.status === 'in_use' || e.status === 'available').length === 0 && (
                <p className="text-red-500 mt-2">暂无可用的内镜，请先领用内镜</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Patient
