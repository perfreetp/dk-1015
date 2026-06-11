export interface Endoscope {
  id: number
  serialNumber: string
  model: string
  brand: string
  status: 'available' | 'in_use' | 'cleaning' | 'isolated' | 'maintenance'
  location: string
  totalUsageCount: number
  lastMaintenanceDate: string
  nextMaintenanceDate: string
  createdAt: string
}

export interface Patient {
  id: number
  patientId: string
  name: string
  gender: string
  age: number
  riskLevel: 'normal' | 'high' | 'critical'
  createdAt: string
}

export interface CleaningBatch {
  id: number
  batchNumber: string
  endoscopeId: number
  endoscopeSerial: string
  patientId?: number
  patientName?: string
  status: 'pending' | 'processing' | 'completed' | 'abnormal'
  currentStep: number
  steps: {
    preprocess: boolean
    leakTest: boolean
    manualBrush: boolean
    machineWash: boolean
    disinfection: boolean
    dryStorage: boolean
  }
  startTime: string
  endTime?: string
  createdAt: string
}

export interface MaintenanceRecord {
  id: number
  time: string
  type: 'routine' | 'repair' | 'inspection'
  description: string
  operator: string
}

export interface Equipment {
  id: number
  name: string
  model: string
  serialNumber: string
  status: 'normal' | 'running' | 'maintenance' | 'broken'
  usageCount: number
  lastMaintenanceDate: string
  nextMaintenanceDate: string
  location: string
  createdAt: string
  maintenanceRecords?: MaintenanceRecord[]
}

export interface QCSample {
  id: number
  batchId: number
  batchNumber: string
  sampleTime: string
  inspectorName: string
  result: 'pass' | 'fail' | 'pending'
  issueDescription?: string
  rectificationStatus: 'pending' | 'rectified' | 'verified'
  createdAt: string
}

export interface Alert {
  id: number
  type: 'timeout' | 'abnormal' | 'maintenance'
  message: string
  endoscopeSerial?: string
  equipmentName?: string
  time: string
}

export const mockEndoscopes: Endoscope[] = [
  { id: 1, serialNumber: 'TJ-2024-001', model: 'GIF-H260', brand: 'Olympus', status: 'available', location: 'A区-1号柜', totalUsageCount: 125, lastMaintenanceDate: '2024-01-15', nextMaintenanceDate: '2024-02-15', createdAt: '2024-01-01' },
  { id: 2, serialNumber: 'TJ-2024-002', model: 'GIF-H260', brand: 'Olympus', status: 'in_use', location: '内镜室-3号床', totalUsageCount: 98, lastMaintenanceDate: '2024-01-10', nextMaintenanceDate: '2024-02-10', createdAt: '2024-01-01' },
  { id: 3, serialNumber: 'TJ-2024-003', model: 'CF-H260AI', brand: 'Olympus', status: 'cleaning', location: '洗消间-机洗1号', totalUsageCount: 156, lastMaintenanceDate: '2024-01-08', nextMaintenanceDate: '2024-02-08', createdAt: '2024-01-01' },
  { id: 4, serialNumber: 'TJ-2024-004', model: 'GIF-XQ260', brand: 'Olympus', status: 'isolated', location: '隔离区-2号柜', totalUsageCount: 89, lastMaintenanceDate: '2024-01-12', nextMaintenanceDate: '2024-02-12', createdAt: '2024-01-01' },
  { id: 5, serialNumber: 'TJ-2024-005', model: 'GIF-Q260J', brand: 'Olympus', status: 'maintenance', location: '维修室', totalUsageCount: 203, lastMaintenanceDate: '2024-01-05', nextMaintenanceDate: '2024-02-05', createdAt: '2024-01-01' },
  { id: 6, serialNumber: 'TJ-2024-006', model: 'CF-Q260AI', brand: 'Olympus', status: 'available', location: 'A区-2号柜', totalUsageCount: 76, lastMaintenanceDate: '2024-01-18', nextMaintenanceDate: '2024-02-18', createdAt: '2024-01-01' },
]

export const mockPatients: Patient[] = [
  { id: 1, patientId: 'P20240120001', name: '张三', gender: '男', age: 55, riskLevel: 'normal', createdAt: '2024-01-20 09:00' },
  { id: 2, patientId: 'P20240120002', name: '李四', gender: '女', age: 48, riskLevel: 'high', createdAt: '2024-01-20 09:30' },
  { id: 3, patientId: 'P20240120003', name: '王五', gender: '男', age: 62, riskLevel: 'critical', createdAt: '2024-01-20 10:00' },
  { id: 4, patientId: 'P20240120004', name: '赵六', gender: '女', age: 35, riskLevel: 'normal', createdAt: '2024-01-20 10:30' },
]

export const mockCleaningBatches: CleaningBatch[] = [
  {
    id: 1,
    batchNumber: 'CB20240120001',
    endoscopeId: 3,
    endoscopeSerial: 'TJ-2024-003',
    patientId: 2,
    patientName: '李四',
    status: 'processing',
    currentStep: 3,
    steps: { preprocess: true, leakTest: true, manualBrush: true, machineWash: false, disinfection: false, dryStorage: false },
    startTime: '2024-01-20 11:00:00',
    createdAt: '2024-01-20 11:00:00'
  },
  {
    id: 2,
    batchNumber: 'CB20240120002',
    endoscopeId: 1,
    endoscopeSerial: 'TJ-2024-001',
    status: 'completed',
    currentStep: 6,
    steps: { preprocess: true, leakTest: true, manualBrush: true, machineWash: true, disinfection: true, dryStorage: true },
    startTime: '2024-01-20 08:00:00',
    endTime: '2024-01-20 09:30:00',
    createdAt: '2024-01-20 08:00:00'
  },
  {
    id: 3,
    batchNumber: 'CB20240120003',
    endoscopeId: 6,
    endoscopeSerial: 'TJ-2024-006',
    patientId: 1,
    patientName: '张三',
    status: 'pending',
    currentStep: 0,
    steps: { preprocess: false, leakTest: false, manualBrush: false, machineWash: false, disinfection: false, dryStorage: false },
    startTime: '2024-01-20 14:00:00',
    createdAt: '2024-01-20 14:00:00'
  },
]

export const mockEquipment: Equipment[] = [
  { 
    id: 1, 
    name: '内镜清洗机A1', 
    model: 'EW-280', 
    serialNumber: 'EQ-001', 
    status: 'running', 
    usageCount: 1250, 
    lastMaintenanceDate: '2024-01-01', 
    nextMaintenanceDate: '2024-02-01', 
    location: '洗消间-1号', 
    createdAt: '2023-06-01',
    maintenanceRecords: [
      { id: 1, time: '2024-01-01', type: 'routine', description: '定期保养', operator: '工程师王' },
      { id: 2, time: '2023-12-15', type: 'repair', description: '更换水泵', operator: '工程师王' },
    ]
  },
  { 
    id: 2, 
    name: '内镜清洗机A2', 
    model: 'EW-280', 
    serialNumber: 'EQ-002', 
    status: 'normal', 
    usageCount: 1180, 
    lastMaintenanceDate: '2024-01-05', 
    nextMaintenanceDate: '2024-02-05', 
    location: '洗消间-2号', 
    createdAt: '2023-06-01',
    maintenanceRecords: [
      { id: 1, time: '2024-01-05', type: 'routine', description: '定期保养', operator: '工程师李' },
    ]
  },
  { 
    id: 3, 
    name: '高压灭菌器B1', 
    model: 'SQ-500', 
    serialNumber: 'EQ-003', 
    status: 'maintenance', 
    usageCount: 890, 
    lastMaintenanceDate: '2024-01-10', 
    nextMaintenanceDate: '2024-02-10', 
    location: '消毒室', 
    createdAt: '2023-03-01',
    maintenanceRecords: [
      { id: 1, time: '2024-01-10', type: 'repair', description: '更换加热管', operator: '工程师王' },
      { id: 2, time: '2023-12-20', type: 'inspection', description: '年度检查', operator: '工程师李' },
    ]
  },
  { 
    id: 4, 
    name: '干燥柜C1', 
    model: 'GZ-300', 
    serialNumber: 'EQ-004', 
    status: 'normal', 
    usageCount: 2100, 
    lastMaintenanceDate: '2024-01-08', 
    nextMaintenanceDate: '2024-02-08', 
    location: '存储区-A', 
    createdAt: '2023-01-01',
    maintenanceRecords: [
      { id: 1, time: '2024-01-08', type: 'routine', description: '定期保养', operator: '工程师王' },
    ]
  },
]

export const mockQCSamples: QCSample[] = [
  { id: 1, batchId: 2, batchNumber: 'CB20240120002', sampleTime: '2024-01-20 09:35:00', inspectorName: '质控员A', result: 'pass', rectificationStatus: 'verified', createdAt: '2024-01-20 09:35:00' },
  { id: 2, batchId: 1, batchNumber: 'CB20240120001', sampleTime: '2024-01-20 11:30:00', inspectorName: '质控员B', result: 'pending', rectificationStatus: 'pending', createdAt: '2024-01-20 11:30:00' },
  { id: 3, batchId: 10, batchNumber: 'CB20240119005', sampleTime: '2024-01-19 16:20:00', inspectorName: '质控员A', result: 'fail', issueDescription: '内镜表面有残留污渍', rectificationStatus: 'rectified', createdAt: '2024-01-19 16:20:00' },
]

export const mockAlerts: Alert[] = [
  { id: 1, type: 'timeout', message: '内镜TJ-2024-003洗消时间超过30分钟', endoscopeSerial: 'TJ-2024-003', time: '2024-01-20 11:32:00' },
  { id: 2, type: 'maintenance', message: '设备内镜清洗机A2距离下次维护还有5天', equipmentName: '内镜清洗机A2', time: '2024-01-20 08:00:00' },
  { id: 3, type: 'abnormal', message: '内镜TJ-2024-004检测到异常已隔离', endoscopeSerial: 'TJ-2024-004', time: '2024-01-20 10:15:00' },
]

export const mockReportsData = {
  dailyStats: {
    totalCleaning: 28,
    completed: 24,
    abnormal: 1,
    qualityRate: 96.4,
  },
  monthlyStats: {
    labels: ['1月1日', '1月5日', '1月10日', '1月15日', '1月20日'],
    qualityRate: [95.2, 96.8, 94.5, 97.2, 96.4],
    totalCount: [25, 30, 28, 32, 28],
  },
  equipmentUsage: [
    { name: '内镜清洗机A1', usage: 1250, rate: 85 },
    { name: '内镜清洗机A2', usage: 1180, rate: 80 },
    { name: '高压灭菌器B1', usage: 890, rate: 60 },
    { name: '干燥柜C1', usage: 2100, rate: 95 },
  ],
  userWorkload: [
    { name: '洗消员甲', count: 156 },
    { name: '洗消员乙', count: 142 },
    { name: '洗消员丙', count: 138 },
  ],
}

export const mockUsers = [
  { id: 1, username: 'nurse1', password: '123456', name: '护士长王', role: 'nurse' as const },
  { id: 2, username: 'cleaner1', password: '123456', name: '洗消员李', role: 'cleaner' as const },
  { id: 3, username: 'qc1', password: '123456', name: '质控员张', role: 'qc' as const },
]
