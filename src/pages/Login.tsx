import { useState } from 'react'
import { Form, Input, Button, Card, message, Select } from 'antd'
import { UserOutlined, LockOutlined, SearchOutlined as MicroscopeOutlined } from '@ant-design/icons'
import { mockUsers } from '../data/mockData'

interface LoginProps {
  onLogin: (user: { id: number; username: string; name: string; role: 'nurse' | 'cleaner' | 'qc' }) => void
}

const roleOptions = [
  { value: 'nurse', label: '护士长' },
  { value: 'cleaner', label: '洗消人员' },
  { value: 'qc', label: '质控员' },
]

function Login({ onLogin }: LoginProps) {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async (values: { username: string; password: string; role: string }) => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const user = mockUsers.find(
      u => u.username === values.username && 
           u.password === values.password && 
           u.role === values.role
    )

    if (user) {
      message.success('登录成功')
      onLogin(user)
    } else {
      message.error('用户名、密码或角色错误')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <Card className="w-[420px] shadow-lg rounded-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <MicroscopeOutlined className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">消化内镜洗消追踪系统</h1>
          <p className="text-gray-500 mt-2">规范洗消流程，保障医疗安全</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ role: 'cleaner' }}
        >
          <Form.Item
            name="role"
            label="角色选择"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select options={roleOptions} className="w-full" />
          </Form.Item>

          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="请输入用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full h-12 text-base font-semibold"
              loading={loading}
            >
              登录系统
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 text-center">
            演示账户：用户名 <span className="text-primary font-medium">cleaner1</span> 
            / <span className="text-primary font-medium">nurse1</span> 
            / <span className="text-primary font-medium">qc1</span>，密码均为 <span className="text-primary font-medium">123456</span>
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Login
