export const severities = ['Critical', 'High', 'Medium', 'Low'] as const
export const statuses = [
  'Detected',
  'Investigating',
  'Mitigating',
  'Resolved',
  'Closed',
] as const
export type Severity = (typeof severities)[number]
export type Status = (typeof statuses)[number]
export interface Analysis {
  type: string
  severity: Severity
  rootCause: string
  action: string
  summary: string
  confidence: number
  engine: string
}
export interface Incident {
  id: string
  title: string
  description: string
  service: string
  severity: Severity
  status: Status
  createdAt: string
  updatedAt: string
  engineer: string
  analysis: Analysis
  timeline: { time: string; message: string }[]
}
export interface Log {
  id: string
  incidentId: string
  service: string
  level: string
  message: string
  time: string
}
export interface Notice {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  incidentId?: string
}
export interface Health {
  name: string
  status: string
  description: string
  endpoint: string
  responseTime: number
}
