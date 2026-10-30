import type { Analysis } from '../../src/shared/models'
export function analyze(text: string): Analysis {
  const rules = [
    {
      test: /database|connection pool|postgres|sql/i,
      type: 'Database Failure',
      severity: 'Critical',
      rootCause: 'Database connection pool exhaustion',
      action:
        'Inspect active connections and long-running queries. Check pool limits, release idle connections, and restart the affected service if necessary.',
      confidence: 91,
    },
    {
      test: /auth|unauthorized|token|401/i,
      type: 'Authentication Failure',
      severity: 'High',
      rootCause: 'Token validation failures or expired signing credentials',
      action:
        'Check token expiration and signing key configuration. Review authentication service logs and rotate invalid credentials.',
      confidence: 88,
    },
    {
      test: /memory|heap|oom/i,
      type: 'Memory Pressure',
      severity: 'Medium',
      rootCause:
        'Growing heap usage from retained objects or an undersized memory limit',
      action:
        'Capture a heap profile, inspect retained objects, and increase memory limits while addressing the leak.',
      confidence: 86,
    },
    {
      test: /cpu|utilization/i,
      type: 'Resource Saturation',
      severity: 'Medium',
      rootCause: 'CPU saturation caused by elevated request processing',
      action:
        'Inspect expensive processes and request rates. Scale replicas and profile slow code paths.',
      confidence: 87,
    },
    {
      test: /timeout|network|504/i,
      type: 'Network Timeout',
      severity: 'High',
      rootCause: 'Upstream service latency exceeded the request timeout',
      action:
        'Check upstream availability, inspect network latency, enable circuit breaking, and retry with exponential backoff.',
      confidence: 89,
    },
    {
      test: /unavailable|503|critical/i,
      type: 'Service Unavailable',
      severity: 'Critical',
      rootCause: 'Service replicas are unhealthy or unavailable',
      action:
        'Inspect readiness probes and deployment events. Restore healthy replicas or roll back the recent deployment.',
      confidence: 90,
    },
    {
      test: /error|fail/i,
      type: 'Application Error',
      severity: 'Medium',
      rootCause:
        'An application operation failed; further diagnostic context is required',
      action:
        'Correlate request identifiers with stack traces and recent deployments. Reproduce the failure before applying a fix.',
      confidence: 73,
    },
  ] as const
  const match = rules.find((r) => r.test.test(text))
  return match
    ? {
        type: match.type,
        severity: match.severity,
        rootCause: match.rootCause,
        action: match.action,
        confidence: match.confidence,
        summary: `${match.type} detected in the supplied logs. ${match.rootCause}.`,
        engine: 'Local rule-based simulation',
      }
    : {
        type: 'Informational',
        severity: 'Low',
        rootCause: 'No recognized failure signature in the supplied logs',
        action:
          'Continue monitoring. Supply error logs and request context if unexpected behavior persists.',
        confidence: 58,
        summary:
          'No known failure pattern detected. This does not guarantee service health.',
        engine: 'Local rule-based simulation',
      }
}
