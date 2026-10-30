import { eq } from 'drizzle-orm'
import { database } from '../db'
import { incidents, logs, notifications, metadata } from '../db/schema'
import { analyze } from './services/analysis'
import type { Incident, Log, Notice, Status } from '../src/shared/models'
export async function seed() {
  const db = database()
  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(metadata)
      .values({ id: 'seed-v1' })
      .onConflictDoNothing()
      .returning()
    if (!inserted.length) return
    const samples = [
      [
        'Database Connection Pool Exhaustion',
        'Database',
        'Database connection timeout. Connection pool exhausted. API requests failing.',
      ],
      [
        'Payment API Timeout',
        'Payment API',
        'ERROR upstream payment network timeout 504 after 30000ms',
      ],
      [
        'Authentication Service Failure',
        'Auth Service',
        'ERROR token validation failed 401 authentication unavailable',
      ],
      [
        'High CPU Utilization',
        'API Gateway',
        'WARNING CPU utilization at 94% for five minutes',
      ],
      [
        'Memory Usage Spike',
        'Worker Service',
        'WARNING heap memory usage approaching configured limit',
      ],
      [
        'Cache Node Unavailable',
        'Cache Service',
        'CRITICAL service unavailable 503 readiness probe failed',
      ],
      [
        'Elevated API Error Rate',
        'API Gateway',
        'ERROR request processing failed with status 500',
      ],
      [
        'Network Latency Increase',
        'Payment API',
        'WARNING network timeout to upstream processor',
      ],
      [
        'Scheduled Job Failure',
        'Worker Service',
        'ERROR scheduled export failed due to invalid payload',
      ],
      [
        'Session Token Expiration',
        'Auth Service',
        'ERROR auth token expired across active sessions',
      ],
      [
        'Database Query Latency',
        'Database',
        'WARNING database query connection pool waiting',
      ],
      [
        'Worker Recovery Complete',
        'Worker Service',
        'INFO worker successfully restarted and healthy',
      ],
    ]
    const states: Status[] = [
      'Investigating',
      'Detected',
      'Mitigating',
      'Investigating',
      'Detected',
      'Resolved',
      'Mitigating',
      'Resolved',
      'Closed',
      'Resolved',
      'Investigating',
      'Resolved',
    ]
    for (let i = 0; i < samples.length; i++) {
      const [title, service, message] = samples[i],
        id = `INC-${1001 + i}`,
        time = new Date(Date.now() - i * 7200000 - 900000).toISOString(),
        analysis = analyze(message)
      const data: Incident = {
        id,
        title,
        description: `${message}. Detected in the fictional demonstration environment.`,
        service,
        severity: analysis.severity,
        status: states[i],
        createdAt: time,
        updatedAt: states[i] === 'Resolved' ? new Date().toISOString() : time,
        engineer: ['Maya Chen', 'Arjun Rao', 'Sofia Reyes'][i % 3],
        analysis,
        timeline: [
          { time, message: 'Incident detected from application logs' },
          { time, message: 'AI Analysis completed using local simulation' },
        ],
      }
      await tx.insert(incidents).values({ id, data })
      const log: Log = {
        id: `LOG-${i}`,
        incidentId: id,
        service,
        level: message.startsWith('INFO')
          ? 'INFO'
          : message.startsWith('WARNING')
            ? 'WARNING'
            : analysis.severity === 'Critical'
              ? 'CRITICAL'
              : 'ERROR',
        message,
        time,
      }
      await tx.insert(logs).values({ id: log.id, data: log })
    }
    const n: Notice = {
      id: 'notice-seed',
      title: 'Critical incident detected',
      message: 'Database connection pool exhaustion requires investigation.',
      time: new Date().toISOString(),
      read: false,
      incidentId: 'INC-1001',
    }
    await tx.insert(notifications).values({ id: n.id, data: n })
    for (const [index, title, message, incidentId] of [
      [
        '1',
        'Incident assigned',
        'Maya Chen is investigating the database connection issue.',
        'INC-1001',
      ],
      [
        '2',
        'Incident resolved',
        'Cache service replicas have recovered after mitigation.',
        'INC-1006',
      ],
      [
        '3',
        'Service health warning',
        'Sample application CPU utilization exceeded its warning threshold.',
        'INC-1004',
      ],
    ]) {
      const notice: Notice = {
        id: `notice-${index}`,
        title,
        message,
        incidentId,
        time: new Date(Date.now() - Number(index) * 300000).toISOString(),
        read: false,
      }
      await tx.insert(notifications).values({ id: notice.id, data: notice })
    }
  })
}
export const repository = {
  async incidents() {
    return (await database().select().from(incidents))
      .map((r) => r.data)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async incident(id: string) {
    return (
      await database().select().from(incidents).where(eq(incidents.id, id))
    )[0]?.data
  },
  async saveIncident(data: Incident) {
    await database()
      .insert(incidents)
      .values({ id: data.id, data })
      .onConflictDoUpdate({ target: incidents.id, set: { data } })
    return data
  },
  async deleteIncident(id: string) {
    await database().delete(incidents).where(eq(incidents.id, id))
  },
  async logs() {
    return (await database().select().from(logs))
      .map((r) => r.data)
      .sort((a, b) => b.time.localeCompare(a.time))
  },
  async addLogs(items: Log[]) {
    if (items.length)
      await database()
        .insert(logs)
        .values(items.map((data) => ({ id: data.id, data })))
  },
  async notifications() {
    return (await database().select().from(notifications))
      .map((r) => r.data)
      .sort((a, b) => b.time.localeCompare(a.time))
  },
  async notice(data: Notice) {
    await database()
      .insert(notifications)
      .values({ id: data.id, data })
      .onConflictDoUpdate({ target: notifications.id, set: { data } })
    return data
  },
}
