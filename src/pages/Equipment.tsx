import { useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, message, Card, Space, Timeline } from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined,
  SettingOutlined as WrenchOutlined,
  WarningOutlined as AlertTriangleIcon,
  CalendarOutlined
} from '@ant-design/icons'
import { mockEquipment, type Equipment } from '../data/mockData'

interface User {
  id: number
  username: string
  name: string
  role: 'nurse' | 'cleaner' | 'qc'
}

interface EquipmentProps {
  user: User
}

const statusConfig = {
  normal: { color: 'green', text: '正常' },
  running: { color: 'blue', text: '运行中' },
  maintenance: { color: 'orange', text: '维护中' },
  broken: { color: 'red', text: '故障' },
}

const maintenanceRecords = [
  { time: '2024-01-15', type: 'routine', description: '定期保养' },
  { time: '2024-01-05', type: 'repair', description: '更换密封圈' },
  { time: '2023-12-20', type: 'inspection', description: '年度检查' },
]

function Equipment({ user }: EquipmentProps) {
  const [equipment, setEquipment] = useState<Equipment[]>(mockEquipment)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<Equipment | null>(null)
  const [form] = Form.useForm()

  const columns = [
    { title: '设备名称', dataIndex: 'name', key: 'name' },
    { title: '型号', dataIndex: 'model', key: 'model' },
    { title: '设备编号', dataIndex: 'serialNumber', key: 'serialNumber' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => <Tag color={statusConfig[status as keyof typeof statusConfig].color}>
        {statusConfig[status as keyof typeof statusConfig].text}
      </Tag>
    },
    { title: '使用次数', dataIndex: 'usageCount', key: 'usageCount' },
    { title: '位置', dataIndex: 'location', key: 'location' },
    { title: '下次维护', dataIndex: 'nextMaintenanceDate', key: 'nextMaintenanceDate' },
    { 
      title: '操作', 
      key: 'action',
      render: (_: unknown, record: Equipment) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => showDetail(record)} />
          <Button icon={<EditOutlined />} onClick={() => editItem(record)} />
          {user.role === 'nurse' && (
            <Button icon={<WrenchOutlined />} onClick={() => addMaintenance()} />
          )}
          {user.role === 'nurse' && (
            <Button danger icon={<AlertTriangleIcon />} onClick={() => reportBroken(record)} />
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

  const editItem = (item: Equipment) => {
    setEditingItem(item)
    form.setFieldsValue(item)
    setIsModalVisible(true)
  }

  const showDetail = (item: Equipment) => {
    setEditingItem(item)
    setIsDetailModalVisible(true)
  }

  const handleOk = () => {
    form.validateFields().then(values => {
      if (editingItem) {
        setEquipment(equipment.map(e => e.id === editingItem.id ? { ...e, ...values } : e))
        message.success('更新成功')
      } else {
        const newItem: Equipment = {
          ...values,
          id: Date.now(),
          status: 'normal',
          usageCount: 0,
          createdAt: new Date().toISOString().split('T')[0],
        } as Equipment
        setEquipment([...equipment, newItem])
        message.success('创建成功')
      }
      setIsModalVisible(false)
    })
  }

  const addMaintenance = () => {
    Modal.info({
      title: '添加维护记录',
      content: (
        <Form layout="vertical">
          <Form.Item label="维护类型">
            <select className="w-full px-3 py-2 border rounded">
              <option value="routine">定期保养</option>
              <option value="repair">故障维修</option>
              <option value="inspection">检查</option>
            </select>
          </Form.Item>
          <Form.Item label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      ),
      footer: (
        <Button type="primary" onClick={() => message.success('维护记录已添加')}>
          确认添加
        </Button>
      )
    })
  }

  const reportBroken = (item: Equipment) => {
    Modal.warning({
      title: '故障报修',
      content: (
        <div>
          <p>设备: {item.name}</p>
          <Form layout="vertical" className="mt-4">
            <Form.Item label="故障描述">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        </div>
      ),
      footer: (
        <Button type="primary" danger onClick={() => {
          setEquipment(equipment.map(e => 
            e.id === item.id ? { ...e, status: 'broken' as const } : e
          ))
          message.success('已报修，设备状态已更新为故障')
        }}>
          确认报修
        </Button>
      )
    })
  }

  return (
    <div>
      <Card 
        title="消毒设备管理" 
        extra={user.role === 'nurse' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
            添加设备
          </Button>
        )}
      >
        <Table 
          columns={columns} 
          dataSource={equipment} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑设备' : '添加设备'}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="设备名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="model" label="型号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="serialNumber" label="设备编号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="location" label="位置">
            <Input />
          </Form.Item>
          <Form.Item name="nextMaintenanceDate" label="下次维护日期">
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="设备详情"
        visible={isDetailModalVisible}
        footer={null}
        onCancel={() => setIsDetailModalVisible(false)}
        width={700}
      >
        {editingItem && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingItem.name}</h3>
              <Tag color={statusConfig[editingItem.status].color}>
                {statusConfig[editingItem.status].text}
              </Tag>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>型号: {editingItem.model}</div>
              <div>设备编号: {editingItem.serialNumber}</div>
              <div>位置: {editingItem.location}</div>
              <div>累计使用: {editingItem.usageCount} 次</div>
              <div>上次维护: {editingItem.lastMaintenanceDate}</div>
              <div>下次维护: <CalendarOutlined className="text-orange-500 inline" /> {editingItem.nextMaintenanceDate}</div>
            </div>
            <div>
              <h4 className="font-medium mb-3">维护记录</h4>
              <Timeline>
                {maintenanceRecords.map((record, index) => (
                  <Timeline.Item key={index}>
                    <div className="font-medium">{record.time}</div>
                    <div className="text-sm text-gray-500">{record.description}</div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
            <div className="flex gap-3">
              <Button icon={<WrenchOutlined />} onClick={() => addMaintenance()}>添加维护记录</Button>
              {editingItem.status !== 'broken' && (
                <Button icon={<AlertTriangleIcon />} danger onClick={() => reportBroken(editingItem)}>报修</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Equipment
