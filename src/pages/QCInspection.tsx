import { useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, message, Card, Space, Statistic } from 'antd'
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined as XCircleOutlined, 
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { mockQCSamples, mockCleaningBatches, type QCSample } from '../data/mockData'

interface User {
  id: number
  username: string
  name: string
  role: 'nurse' | 'cleaner' | 'qc'
}

interface QCInspectionProps {
  user: User
}

const resultConfig = {
  pass: { color: 'green', text: '合格', icon: <CheckCircleOutlined /> },
  fail: { color: 'red', text: '不合格', icon: <XCircleOutlined /> },
  pending: { color: 'orange', text: '待检测', icon: <ClockCircleOutlined /> },
}

const rectificationConfig = {
  pending: { color: 'orange', text: '待整改' },
  rectified: { color: 'blue', text: '已整改' },
  verified: { color: 'green', text: '已验证' },
}

function QCInspection({ user }: QCInspectionProps) {
  const [samples, setSamples] = useState<QCSample[]>(mockQCSamples)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isResultModalVisible, setIsResultModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<QCSample | null>(null)
  const [form] = Form.useForm()

  const columns = [
    { title: '抽检编号', dataIndex: 'id', key: 'id', render: (id: number) => `QC${id.toString().padStart(6, '0')}` },
    { title: '批次号', dataIndex: 'batchNumber', key: 'batchNumber' },
    { title: '抽检时间', dataIndex: 'sampleTime', key: 'sampleTime' },
    { title: '抽检人员', dataIndex: 'inspectorName', key: 'inspectorName' },
    { 
      title: '检测结果', 
      dataIndex: 'result', 
      key: 'result',
      render: (result: string) => (
        <Tag color={resultConfig[result as keyof typeof resultConfig].color}>
          {resultConfig[result as keyof typeof resultConfig].icon} {resultConfig[result as keyof typeof resultConfig].text}
        </Tag>
      )
    },
    { title: '问题描述', dataIndex: 'issueDescription', key: 'issueDescription', render: (desc?: string) => desc || '-' },
    { 
      title: '整改状态', 
      dataIndex: 'rectificationStatus', 
      key: 'rectificationStatus',
      render: (status: string) => <Tag color={rectificationConfig[status as keyof typeof rectificationConfig].color}>
        {rectificationConfig[status as keyof typeof rectificationConfig].text}
      </Tag>
    },
    { 
      title: '操作', 
      key: 'action',
      render: (_: unknown, record: QCSample) => (
        <Space>
          {record.result === 'pending' && (
            <Button icon={<CheckCircleOutlined />} onClick={() => setResult(record)}>录入结果</Button>
          )}
          {record.result === 'fail' && record.rectificationStatus === 'pending' && (
            <Button icon={<EditOutlined />} onClick={() => rectify(record)}>整改</Button>
          )}
          {record.result === 'fail' && record.rectificationStatus === 'rectified' && (
            <Button type="primary" onClick={() => verify(record)}>验证</Button>
          )}
        </Space>
      )
    },
  ]

  const showModal = () => {
    setEditingItem(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const setResult = (item: QCSample) => {
    setEditingItem(item)
    setIsResultModalVisible(true)
  }

  const rectify = (item: QCSample) => {
    Modal.info({
      title: '整改处理',
      content: (
        <Form layout="vertical">
          <Form.Item label="整改措施">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="整改人">
            <Input defaultValue={user.name} />
          </Form.Item>
        </Form>
      ),
      footer: (
        <Button type="primary" onClick={() => {
          setSamples(samples.map(s => 
            s.id === item.id ? { ...s, rectificationStatus: 'rectified' } : s
          ))
          message.success('整改已提交')
        }}>
          提交整改
        </Button>
      )
    })
  }

  const verify = (item: QCSample) => {
    Modal.confirm({
      title: '验证整改结果',
      content: '确认整改已完成并通过验证？',
      onOk: () => {
        setSamples(samples.map(s => 
          s.id === item.id ? { ...s, rectificationStatus: 'verified' } : s
        ))
        message.success('验证通过')
      }
    })
  }

  const handleOk = () => {
    form.validateFields().then(values => {
      const newItem: QCSample = {
        ...values,
        id: Date.now(),
        result: 'pending',
        rectificationStatus: 'pending',
        sampleTime: new Date().toISOString(),
        inspectorName: user.name,
      } as QCSample
      setSamples([...samples, newItem])
      message.success('抽检记录已创建')
      setIsModalVisible(false)
    })
  }

  const handleResultOk = () => {
    form.validateFields().then(values => {
      if (!editingItem) return
      setSamples(samples.map(s => 
        s.id === editingItem.id 
          ? { ...s, ...values, result: values.result, rectificationStatus: values.result === 'fail' ? 'pending' : 'verified' }
          : s
      ))
      message.success('检测结果已录入')
      setIsResultModalVisible(false)
    })
  }

  const passCount = samples.filter(s => s.result === 'pass').length
  const failCount = samples.filter(s => s.result === 'fail').length
  const passRate = samples.length > 0 ? ((passCount / (passCount + failCount)) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="抽检总数" value={samples.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="合格" value={passCount} valueStyle={{ color: '#10B981' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="不合格" value={failCount} valueStyle={{ color: '#EF4444' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="合格率" value={passRate} suffix="%" valueStyle={{ color: '#3B82F6' }} />
          </Card>
        </Col>
      </Row>

      <Card 
        title="质控抽检记录" 
        extra={user.role === 'qc' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
            新增抽检
          </Button>
        )}
      >
        <Table 
          columns={columns} 
          dataSource={samples} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新增抽检"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="batchId" label="选择批次" rules={[{ required: true }]}>
            <Select
              options={mockCleaningBatches
                .filter(b => b.status === 'completed')
                .map(b => ({ value: b.id, label: b.batchNumber }))
              }
              placeholder="选择已完成的洗消批次"
            />
          </Form.Item>
          <Form.Item name="batchNumber" label="批次号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="录入检测结果"
        visible={isResultModalVisible}
        onOk={handleResultOk}
        onCancel={() => setIsResultModalVisible(false)}
      >
        {editingItem && (
          <Form form={form} layout="vertical">
            <p className="mb-4">批次号: {editingItem.batchNumber}</p>
            <Form.Item name="result" label="检测结果" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="pass">合格</Select.Option>
                <Select.Option value="fail">不合格</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="issueDescription" label="问题描述">
              <Input.TextArea rows={3} placeholder="如检测不合格，请描述问题" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}

import { Row, Col } from 'antd';
export default QCInspection
