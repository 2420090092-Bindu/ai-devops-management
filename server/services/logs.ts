import { repository } from '../repository'
export async function ingest(
  text: string,
  service = 'Log Analyzer',
  incidentId = '',
) {
  const time = new Date().toISOString()
  await repository.addLogs(
    text
      .split('\n')
      .filter((line) => line.trim())
      .slice(0, 200)
      .map((message) => ({
        id: crypto.randomUUID(),
        incidentId,
        service,
        message,
        time,
        level: /CRITICAL/i.test(message)
          ? 'CRITICAL'
          : /ERROR|fail/i.test(message)
            ? 'ERROR'
            : /WARN/i.test(message)
              ? 'WARNING'
              : 'INFO',
      })),
  )
}
