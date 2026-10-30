import { seed, repository } from '../../server/repository'
import { analyze } from '../../server/services/analysis'
import {
  createIncident,
  updateIncident,
  InputError,
} from '../../server/services/incidents'
import { ingest } from '../../server/services/logs'
import { notify } from '../../server/services/notifications'
export default async (req: Request) => {
  try {
    const path = new URL(req.url).pathname.replace(/\/$/, ''),
      method = req.method
    if (Number(req.headers.get('content-length') || 0) > 250000)
      return Response.json({ error: 'Payload too large.' }, { status: 413 })
    await seed()
    const body = async () => {
      try {
        const value = await req.json()
        if (!value || typeof value !== 'object' || Array.isArray(value))
          throw new InputError('Request body must be a JSON object.')
        return value
      } catch {
        throw new InputError('Invalid JSON request.')
      }
    }
    if (path === '/api/incidents' && method === 'GET')
      return Response.json(await repository.incidents())
    if (path === '/api/incidents' && method === 'POST')
      return Response.json(await createIncident(await body()), { status: 201 })
    if (path === '/api/simulate' && method === 'POST')
      return Response.json(
        await createIncident({
          title: 'Payment API response timeout',
          description:
            'ERROR payment network timeout 504 after 30000ms. Upstream API requests failing.',
          service: 'Payment API',
        }),
        { status: 201 },
      )
    if (path.startsWith('/api/incidents/')) {
      const id = decodeURIComponent(path.split('/').pop()!),
        incident = await repository.incident(id)
      if (!incident)
        return Response.json({ error: 'Incident not found.' }, { status: 404 })
      if (method === 'GET') return Response.json(incident)
      if (method === 'PUT')
        return Response.json(await updateIncident(incident, await body()))
      if (method === 'DELETE') {
        await repository.deleteIncident(id)
        return new Response(null, { status: 204 })
      }
    }
    if (path === '/api/logs' && method === 'GET')
      return Response.json(await repository.logs())
    if (
      (path === '/api/logs/analyze' || path === '/api/analysis') &&
      method === 'POST'
    ) {
      const { text } = await body()
      if (typeof text !== 'string' || !text.trim() || text.length > 200000)
        throw new InputError('Enter logs between 1 and 200,000 characters.')
      const result = analyze(text)
      await ingest(text)
      return Response.json(result)
    }
    if (path === '/api/notifications' && method === 'GET')
      return Response.json(await repository.notifications())
    if (path === '/api/notifications' && method === 'POST') {
      const b = await body()
      if (
        typeof b.title !== 'string' ||
        !b.title.trim() ||
        typeof b.message !== 'string' ||
        b.message.length > 3000
      )
        throw new InputError('Title and message are required.')
      return Response.json(await notify(b.title, b.message), { status: 201 })
    }
    if (path === '/api/notifications/read' && method === 'PUT') {
      for (const n of await repository.notifications())
        await repository.notice({ ...n, read: true })
      return Response.json({ ok: true })
    }
    if (
      (path === '/api/services/health' || path === '/api/health') &&
      method === 'GET'
    ) {
      const start = performance.now()
      await repository.incidents()
      const ms = Math.round(performance.now() - start)
      return Response.json(
        [
          {
            name: 'API Gateway',
            description: 'Routes and validates all frontend REST requests.',
            endpoint: '/api/*',
          },
          {
            name: 'Incident Service',
            description: 'Owns incident lifecycle, assignment and timeline.',
            endpoint: '/api/incidents',
          },
          {
            name: 'Log Service',
            description: 'Ingests and retrieves application log records.',
            endpoint: '/api/logs',
          },
          {
            name: 'AI Analysis Service',
            description: 'Classifies log patterns using local simulation.',
            endpoint: '/api/analysis',
          },
          {
            name: 'Notification Service',
            description: 'Records incident lifecycle notifications.',
            endpoint: '/api/notifications',
          },
          {
            name: 'Database',
            description: 'Persistent Netlify PostgreSQL repository.',
            endpoint: 'PostgreSQL / Drizzle',
          },
        ].map((s) => ({ ...s, status: 'Operational', responseTime: ms })),
      )
    }
    return Response.json(
      { error: 'Route or method not supported.' },
      { status: 405 },
    )
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof InputError
            ? error.message
            : 'Unable to complete this request. Please try again.',
      },
      { status: error instanceof InputError ? 400 : 500 },
    )
  }
}
export const config = { path: '/api/*' }
