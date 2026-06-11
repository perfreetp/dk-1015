import { useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, message, Card, Space, Timeline } from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined,
  SettingOutlined as WrenchOutlined,
  WarningOutlined as AlertTriangleIcon,
  BellOutlined
} from '@ant-design/icons'
import { useStore } from '../store/useStore'
import type { Equipment } from '../data/mockData'

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

const maintenanceTypeConfig = {
  routine: '定期保养',
  repair: '故障维修',
  inspection: '检查',
}

function Equipment({ user }: EquipmentProps) {
  const { equipment, updateEquipment, addEquipment } = useStore()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isMaintenanceModalVisible, setIsMaintenanceModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<Equipment | null>(null)
  const [maintenanceForm] = Form.useForm()

  const daysUntilMaintenance = (dateStr: string) => {
    const today = new Date()
    const targetDate = new Date(dateStr)
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const needMaintenanceAlert = (dateStr: string) => {
    const days = daysUntilMaintenance(dateStr)
    return days <= 7 && days >= 0
  }

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
    { 
      title: '下次维护', 
      dataIndex: 'nextMaintenanceDate', 
      key: 'nextMaintenanceDate',
      render: (date: string) => {
        const days = daysUntilMaintenance(date)
        const alert = needMaintenanceAlert(date)
        return (
          <span className={alert ? 'text-orange-500 font-medium' : ''}>
            {alert && <BellOutlined className="inline mr-1" />}
            {date} {days > 0 && `(${days}天后)`}
          </span>
        )
      }
    },
    { 
      title: '操作', 
      key: 'action',
      render: (_: unknown, record: Equipment) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => showDetail(record)} />
          <Button icon={<EditOutlined />} onClick={() => editItem(record)} />
          {user.role === 'nurse' && (
            <Button icon={<WrenchOutlined />} onClick={() => openMaintenanceModal(record)} />
          )}
          {user.role === 'nurse' && record.status !== 'broken' && (
            <Button danger icon={<AlertTriangleIcon />} onClick={() => reportBroken(record)} />
          )}
        </Space>
      )
    },
  ]

  const showModal = () => {
    setEditingItem(null)
    setIsModalVisible(true)
  }

  const editItem = (item: Equipment) => {
    setEditingItem(item)
    setIsModalVisible(true)
  }

  const showDetail = (item: Equipment) => {
    setEditingItem(item)
    setIsDetailModalVisible(true)
  }

  const openMaintenanceModal = (item: Equipment) => {
    setEditingItem(item)
    maintenanceForm.resetFields()
    setIsMaintenanceModalVisible(true)
  }

  const handleOk = () => {
    if (!editingItem) {
      const newItem: Equipment = {
        id: Date.now(),
        name: '新设备',
        model: '',
        serialNumber: `EQ-${Date.now()}`,
        status: 'normal',
        usageCount: 0,
        lastMaintenanceDate: new Date().toISOString().split('T')[0],
        nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: '',
        createdAt: new Date().toISOString().split('T')[0],
        maintenanceRecords: [],
      }
      addEquipment(newItem)
      message.success('创建成功')
    } else {
      message.success('更新成功')
    }
    setIsModalVisible(false)
  }

  const handleMaintenanceSubmit = () => {
    if (!editingItem) return
    
    maintenanceForm.validateFields().then(values => {
      const newRecord = {
        id: Date.now(),
        time: new Date().toISOString().split('T')[0],
        type: values.type as 'routine' | 'repair' | 'inspection',
        description: values.description,
        operator: user.name,
      }

      const updatedRecords = [...(editingItem.maintenanceRecords || []), newRecord]
      
      updateEquipment(editingItem.id, { 
        maintenanceRecords: updatedRecords,
        lastMaintenanceDate: newRecord.time,
      })

      message.success('维护记录已添加')
      setIsMaintenanceModalVisible(false)
      setEditingItem(null)
    })
  }

  const reportBroken = (item: Equipment) => {
    Modal.warning({
      title: '故障报修',
      content: (
        <div>
          <p>设备: {item.name}</p>
          <Form layout="vertical" className="mt-4">
            <Form.Item name="description" label="故障描述" rules={[{ required: true }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        </div>
      ),
      footer: (
        <Button type="primary" danger onClick={() => {
          updateEquipment(item.id, { status: 'broken' })
          message.success('已报修，设备状态已更新为故障')
        }}>
          确认报修
        </Button>
      )
    })
  }

  const handleMaintenanceComplete = () => {
    if (!editingItem) return
    updateEquipment(editingItem.id, { 
      status: 'normal',
      nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
    message.success('设备已恢复正常')
    setIsDetailModalVisible(false)
    setEditingItem(null)
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
        <Form layout="vertical">
          <Form.Item label="设备名称" rules={[{ required: true }]}>
            <Input defaultValue={editingItem?.name} />
          </Form.Item>
          <Form.Item label="型号" rules={[{ required: true }]}>
            <Input defaultValue={editingItem?.model} />
          </Form.Item>
          <Form.Item label="设备编号" rules={[{ required: true }]}>
            <Input defaultValue={editingItem?.serialNumber} />
          </Form.Item>
          <Form.Item label="位置">
            <Input defaultValue={editingItem?.location} />
          </Form.Item>
          <Form.Item label="下次维护日期">
            <Input type="date" defaultValue={editingItem?.nextMaintenanceDate} />
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
              <div>
                下次维护: 
                {needMaintenanceAlert(editingItem.nextMaintenanceDate) && (
                  <BellOutlined className="text-orange-500 inline mx-1" />
                )}
                {editingItem.nextMaintenanceDate}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">维护记录</h4>
              <Timeline>
                {(editingItem.maintenanceRecords || []).map((record) => (
                  <Timeline.Item key={record.id}>
                    <div className="font-medium">{record.time}</div>
                    <div className="text-sm text-gray-500">{maintenanceTypeConfig[record.type]} - {record.description}</div>
                    <div className="text-xs text-gray-400">操作人: {record.operator}</div>
                  </Timeline.Item>
                ))}
              </Timeline>
              {(editingItem.maintenanceRecords || []).length === 0 && (
                <p className="text-gray-400 text-center py-4">暂无维护记录</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button icon={<WrenchOutlined />} onClick={() => openMaintenanceModal(editingItem)}>添加维护记录</Button>
              {editingItem.status !== 'broken' && editingItem.status !== 'maintenance' && (
                <Button icon={<AlertTriangleIcon />} danger onClick={() => reportBroken(editingItem)}>报修</Button>
              )}
              {editingItem.status === 'maintenance' && (
                <Button type="primary" onClick={handleMaintenanceComplete}>维护完成</Button>
              )}
              {editingItem.status === 'broken' && (
                <Button type="primary" onClick={() => updateEquipment(editingItem.id, { status: 'maintenance' })}>开始维修</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="添加维护记录"
        visible={isMaintenanceModalVisible}
        onOk={handleMaintenanceSubmit}
        onCancel={() => {
          setIsMaintenanceModalVisible(false)
          setEditingItem(null)
        }}
      >
        {editingItem && (
          <div>
            <p className="mb-4">设备: <strong>{editingItem.name}</strong></p>
            <Form form={maintenanceForm} layout="vertical">
              <Form.Item name="type" label="维护类型" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="routine">定期保养</Select.Option>
                  <Select.Option value="repair">故障维修</Select.Option>
                  <Select.Option value="inspection">检查</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="description" label="描述" rules={[{ required: true }]}>
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item label="操作人">
                <Input disabled value={user.name} />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Equipment
