import { Layout as AntLayout, Menu, Button, Avatar, Dropdown, Space, MenuProps } from 'antd'
import { 
  DashboardOutlined, 
  SearchOutlined as MicroscopeOutlined, 
  UserOutlined, 
  CloudOutlined as CleaningOutlined, 
  SettingOutlined as WrenchOutlined, 
  CheckCircleOutlined, 
  SearchOutlined, 
  BarChartOutlined,
  LogoutOutlined,
  InfoOutlined as UserInfoOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

interface User {
  id: number
  username: string
  name: string
  role: 'nurse' | 'cleaner' | 'qc'
}

interface LayoutProps {
  user: User
  onLogout: () => void
}

const { Sider, Content, Header } = AntLayout

const roleNames = {
  nurse: '护士长',
  cleaner: '洗消人员',
  qc: '质控员'
}

const menuItems = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: '洗消看板', path: '/dashboard' },
  { key: 'endoscope', icon: <MicroscopeOutlined />, label: '内镜档案', path: '/endoscope' },
  { key: 'patient', icon: <UserOutlined />, label: '患者关联', path: '/patient' },
  { key: 'cleaning', icon: <CleaningOutlined />, label: '清洗流程', path: '/cleaning' },
  { key: 'equipment', icon: <WrenchOutlined />, label: '消毒设备', path: '/equipment' },
  { key: 'qc-inspection', icon: <CheckCircleOutlined />, label: '质控抽检', path: '/qc-inspection' },
  { key: 'traceability', icon: <SearchOutlined />, label: '追溯查询', path: '/traceability' },
  { key: 'reports', icon: <BarChartOutlined />, label: '月度报表', path: '/reports' },
]

function Layout({ user, onLogout }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleMenuClick = (key: string) => {
    navigate(key === 'dashboard' ? '/' : `/${key}`)
  }

  const currentKey = location.pathname === '/' ? 'dashboard' : location.pathname.slice(1)

  const userMenuItems: MenuProps['items'] = [
    { key: 'info', icon: <UserInfoOutlined />, label: `角色: ${roleNames[user.role]}` },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: onLogout },
  ]

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={200} className="border-r">
        <div className="flex items-center justify-center h-16 bg-gradient-to-r from-primary to-primary/80">
          <span className="text-white font-bold text-lg">内镜洗消系统</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentKey]}
          style={{ height: 'calc(100% - 64px)', borderRight: 0 }}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: () => handleMenuClick(item.key)
          }))}
        />
      </Sider>
      <AntLayout>
        <Header className="flex items-center justify-between px-6 bg-white border-b">
          <div className="text-lg font-semibold text-gray-800">
            {menuItems.find(item => item.key === currentKey)?.label}
          </div>
          <Dropdown menu={{ items: userMenuItems }}>
            <Button type="text" className="flex items-center gap-2">
              <Avatar icon={<UserOutlined />} />
              <Space>
                <span>{user.name}</span>
                <span className="text-sm text-gray-500">{roleNames[user.role]}</span>
              </Space>
            </Button>
          </Dropdown>
        </Header>
        <Content className="p-6 bg-gray-50">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
