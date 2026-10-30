import { repository } from '../repository'
import { analyze } from './analysis'
import { notify } from './notifications'
import { ingest } from './logs'
import { severities, statuses } from '../../src/shared/models'
import type { Incident } from '../../src/shared/models'
export class InputError extends Error {}
export async function createIncident(input: Record<string, unknown>) {
  for (const key of ['title', 'description', 'service'])
    if (
      typeof input[key] !== 'string' ||
      !(input[key] as string).trim() ||
      (input[key] as string).length > 3000
    )
      throw new InputError(
        `A valid ${key} is required (maximum 3000 characters).`,
      )
  if (input.severity && !severities.includes(input.severity as never))
    throw new InputError('Invalid severity.')
  const time = new Date().toISOString(),
    analysis = analyze(input.description as string)
  const data: Incident = {
    id: `INC-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4)}`,
    title: (input.title as string).trim(),
    description: input.description as string,
    service: input.service as string,
    severity: (input.severity || analysis.severity) as Incident['severity'],
    status: 'Detected',
    engineer: 'Unassigned',
    createdAt: time,
    updatedAt: time,
    analysis,
    timeline: [
      { time, message: 'Incident detected and AI Analysis completed' },
    ],
  }
  await repository.saveIncident(data)
  await ingest(data.description, data.service, data.id)
  await notify(`${data.severity} incident detected`, data.title, data.id)
  return data
}
export async function updateIncident(
  data: Incident,
  input: Record<string, unknown>,
) {
  if (input.status && !statuses.includes(input.status as never))
    throw new InputError('Invalid status.')
  if (input.severity && !severities.includes(input.severity as never))
    throw new InputError('Invalid severity.')
  const changes: Partial<Incident> = {}
  for (const key of ['title', 'description', 'service', 'engineer'] as const)
    if (input[key] !== undefined) {
      if (
        typeof input[key] !== 'string' ||
        !(input[key] as string).trim() ||
        (input[key] as string).length > 3000
      )
        throw new InputError(`Invalid ${key}.`)
      changes[key] = input[key] as string
    }
  if (input.status) changes.status = input.status as Incident['status']
  if (input.severity) changes.severity = input.severity as Incident['severity']
  const time = new Date().toISOString(),
    updated = {
      ...data,
      ...changes,
      updatedAt: time,
      timeline: [
        ...data.timeline,
        {
          time,
          message: input.status
            ? `Status changed to ${input.status}`
            : input.engineer
              ? `Assigned to ${input.engineer}`
              : 'Incident information updated',
        },
      ],
    }
  await repository.saveIncident(updated)
  await notify(
    input.status === 'Resolved'
      ? 'Incident resolved'
      : input.engineer
        ? 'Incident assigned'
        : 'Incident updated',
    updated.title,
    updated.id,
  )
  return updated
}
