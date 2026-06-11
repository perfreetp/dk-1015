import { useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, message, Card, Space, Radio } from 'antd'
import { 
  PlusOutlined, 
  ScanOutlined, 
  EditOutlined, 
  EyeOutlined,
  LinkOutlined
} from '@ant-design/icons'
import { mockPatients, mockEndoscopes, type Patient } from '../data/mockData'

const riskLevelConfig = {
  normal: { color: 'green', text: '普通' },
  high: { color: 'orange', text: '高风险' },
  critical: { color: 'red', text: '危重' },
}

function Patient() {
  const [patients, setPatients] = useState<Patient[]>(mockPatients)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isScanModalVisible, setIsScanModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<Patient | null>(null)
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
          <Button icon={<EyeOutlined />} />
          <Button icon={<EditOutlined />} onClick={() => editItem(record)} />
          <Button icon={<LinkOutlined />} onClick={() => bindEndoscope(record)} />
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

  const showScanModal = () => {
    setScanValue('')
    setIsScanModalVisible(true)
  }

  const handleOk = () => {
    form.validateFields().then(values => {
      if (editingItem) {
        setPatients(patients.map(p => p.id === editingItem.id ? { ...p, ...values } : p))
        message.success('更新成功')
      } else {
        const newItem: Patient = {
          ...values,
          id: Date.now(),
          patientId: `P${Date.now()}`,
          createdAt: new Date().toLocaleString('zh-CN'),
        } as Patient
        setPatients([...patients, newItem])
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
      setEditingItem(existingPatient)
      setIsScanModalVisible(false)
    } else {
      message.info('未找到患者，是否新建？')
      form.setFieldsValue({ patientId: scanValue })
      setIsScanModalVisible(false)
      setIsModalVisible(true)
    }
  }

  const bindEndoscope = (patient: Patient) => {
    Modal.info({
      title: '绑定内镜',
      content: (
        <div>
          <p>患者: {patient.name} ({patient.patientId})</p>
          <p className="mt-2">选择要绑定的内镜:</p>
          <Select
            style={{ width: '100%', marginTop: 10 }}
            options={mockEndoscopes
              .filter(e => e.status === 'in_use')
              .map(e => ({ value: e.id, label: `${e.serialNumber} - ${e.model}` }))
            }
            placeholder="选择内镜"
          />
        </div>
      ),
      footer: (
        <Button type="primary" onClick={() => message.success('绑定成功')}>
          确认绑定
        </Button>
      )
    })
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
    </div>
  )
}

export default Patient
