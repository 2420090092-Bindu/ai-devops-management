import { repository } from '../repository'
export async function notify(
  title: string,
  message: string,
  incidentId?: string,
) {
  return repository.notice({
    id: crypto.randomUUID(),
    title,
    message,
    incidentId,
    time: new Date().toISOString(),
    read: false,
  })
}
