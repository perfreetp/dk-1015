import { useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, message, Card, Space, Popconfirm } from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CheckOutlined,
  XOutlined,
  WarningOutlined as AlertTriangleIcon,
  SettingOutlined as WrenchOutlined
} from '@ant-design/icons'
import { useStore } from '../store/useStore'
import type { Endoscope } from '../data/mockData'

interface User {
  id: number
  username: string
  name: string
  role: 'nurse' | 'cleaner' | 'qc'
}

interface EndoscopeProps {
  user: User
}

const statusConfig = {
  available: { color: 'green', text: '可领用' },
  in_use: { color: 'blue', text: '使用中' },
  cleaning: { color: 'orange', text: '洗消中' },
  isolated: { color: 'red', text: '隔离' },
  maintenance: { color: 'purple', text: '维护' },
}

function Endoscope({ user }: EndoscopeProps) {
  const { endoscopes, addEndoscope, updateEndoscope, deleteEndoscope } = useStore()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<Endoscope | null>(null)
  const [form] = Form.useForm()

  const columns = [
    { title: '内镜编号', dataIndex: 'serialNumber', key: 'serialNumber' },
    { title: '型号', dataIndex: 'model', key: 'model' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => <Tag color={statusConfig[status as keyof typeof statusConfig].color}>
        {statusConfig[status as keyof typeof statusConfig].text}
      </Tag>
    },
    { title: '位置', dataIndex: 'location', key: 'location' },
    { title: '累计使用次数', dataIndex: 'totalUsageCount', key: 'totalUsageCount' },
    { title: '下次维护', dataIndex: 'nextMaintenanceDate', key: 'nextMaintenanceDate' },
    { 
      title: '操作', 
      key: 'action',
      render: (_: unknown, record: Endoscope) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => showDetail(record)} />
          <Button icon={<EditOutlined />} onClick={() => editItem(record)} />
          {user.role === 'nurse' && (
            <Popconfirm
              title="确定删除该内镜档案？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
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

  const editItem = (item: Endoscope) => {
    setEditingItem(item)
    form.setFieldsValue(item)
    setIsModalVisible(true)
  }

  const showDetail = (item: Endoscope) => {
    setEditingItem(item)
    setIsDetailModalVisible(true)
  }

  const handleDelete = (id: number) => {
    deleteEndoscope(id)
    message.success('删除成功')
  }

  const handleOk = () => {
    form.validateFields().then(values => {
      if (editingItem) {
        updateEndoscope(editingItem.id, values)
        message.success('更新成功')
      } else {
        addEndoscope({
          ...values,
          createdAt: new Date().toISOString().split('T')[0],
          status: 'available',
          totalUsageCount: 0,
          lastMaintenanceDate: new Date().toISOString().split('T')[0],
        })
        message.success('创建成功')
      }
      setIsModalVisible(false)
    })
  }

  const handleCheckout = () => {
    if (!editingItem || editingItem.status !== 'available') {
      message.error('只有可领用状态的内镜才能领用')
      return
    }
    updateEndoscope(editingItem.id, { status: 'in_use', location: '内镜室' })
    message.success('领用成功')
    setIsDetailModalVisible(false)
  }

  const handleCheckin = () => {
    if (!editingItem || editingItem.status !== 'in_use') {
      message.error('只有使用中的内镜才能归还')
      return
    }
    updateEndoscope(editingItem.id, { 
      status: 'cleaning', 
      location: '洗消间',
      totalUsageCount: editingItem.totalUsageCount + 1 
    })
    message.success('归还成功，内镜已进入待洗消状态')
    setIsDetailModalVisible(false)
  }

  const handleIsolate = () => {
    if (!editingItem) return
    updateEndoscope(editingItem.id, { status: 'isolated', location: '隔离区' })
    message.success('已隔离')
    setIsDetailModalVisible(false)
  }

  const handleMaintenance = () => {
    if (!editingItem) return
    updateEndoscope(editingItem.id, { status: 'maintenance', location: '维修室' })
    message.success('已申请维护')
    setIsDetailModalVisible(false)
  }

  return (
    <div>
      <Card 
        title="内镜档案管理" 
        extra={user.role !== 'qc' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
            新增内镜
          </Button>
        )}
      >
        <Table 
          columns={columns} 
          dataSource={endoscopes} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑内镜' : '新增内镜'}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="serialNumber" label="内镜编号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="model" label="型号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="brand" label="品牌" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="location" label="存放位置">
            <Input />
          </Form.Item>
          <Form.Item name="nextMaintenanceDate" label="下次维护日期">
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="内镜详情"
        visible={isDetailModalVisible}
        footer={null}
        onCancel={() => setIsDetailModalVisible(false)}
      >
        {editingItem && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingItem.serialNumber}</h3>
              <Tag color={statusConfig[editingItem.status].color}>
                {statusConfig[editingItem.status].text}
              </Tag>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>型号: {editingItem.model}</div>
              <div>品牌: {editingItem.brand}</div>
              <div>位置: {editingItem.location}</div>
              <div>累计使用: {editingItem.totalUsageCount} 次</div>
              <div>上次维护: {editingItem.lastMaintenanceDate}</div>
              <div>下次维护: {editingItem.nextMaintenanceDate}</div>
            </div>
            <div className="flex gap-3 mt-6">
              {editingItem.status === 'available' && (
                <Button type="primary" icon={<CheckOutlined />} onClick={handleCheckout}>
                  领用
                </Button>
              )}
              {editingItem.status === 'in_use' && (
                <Button type="primary" icon={<XOutlined />} onClick={handleCheckin}>
                  归还
                </Button>
              )}
              {editingItem.status !== 'isolated' && editingItem.status !== 'maintenance' && (
                <Button danger icon={<AlertTriangleIcon />} onClick={handleIsolate}>
                  异常隔离
                </Button>
              )}
              {editingItem.status !== 'maintenance' && (
                <Button icon={<WrenchOutlined />} onClick={handleMaintenance}>申请维护</Button>
              )}
              {editingItem.status === 'maintenance' && (
                <Button type="primary" onClick={() => updateEndoscope(editingItem.id, { status: 'available', location: 'A区-1号柜' })}>维护完成</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Endoscope
