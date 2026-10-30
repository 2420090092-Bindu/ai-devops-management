import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Bell,
  Blocks,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Database,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Upload,
  X,
  Zap,
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import { api } from '../lib/api'
import { severities, statuses } from '../shared/models'
import type { Analysis, Health, Incident, Log, Notice } from '../shared/models'
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Filler,
)
const nav = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Incidents', icon: CircleAlert },
  { name: 'Log Analyzer', icon: Terminal },
  { name: 'Services', icon: Blocks },
  { name: 'Notifications', icon: Bell },
  { name: 'Architecture', icon: GitBranch },
  { name: 'About Project', icon: BookOpen },
]
const colors = ['#ee6868', '#ed9a54', '#e6c356', '#52ae8d']
const fmt = (date: string) =>
  new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
function Badge({ value }: { value: string }) {
  return (
    <span className={`badge ${value.toLowerCase().replaceAll(' ', '-')}`}>
      <i />
      {value}
    </span>
  )
}
function Brand() {
  return (
    <div className="brand">
      <span className="brandmark">
        <Activity size={23} />
      </span>
      <span>
        OpsPilot<span className="brand-sub">AI INCIDENT MANAGEMENT</span>
      </span>
    </div>
  )
}
function AnalysisCard({ data }: { data: Analysis }) {
  return (
    <div className="analysis-card">
      <div className="section-title">
        <span>
          <Sparkles size={18} /> AI Analysis
        </span>
        <b className="confidence">{data.confidence}% confidence</b>
      </div>
      <p className="muted">{data.engine}</p>
      <h3>{data.type}</h3>
      <p>{data.summary}</p>
      <div className="analysis-grid">
        <div>
          <label>Possible root cause</label>
          <p>{data.rootCause}</p>
        </div>
        <div>
          <label>Recommended action</label>
          <p>{data.action}</p>
        </div>
      </div>
      <Badge value={data.severity} />
    </div>
  )
}
function Architecture() {
  return (
    <>
      <div className="panel architecture">
        <div className="eyebrow">SERVICE COMMUNICATION</div>
        <h2>One gateway. Focused services.</h2>
        <p className="muted">
          REST requests flow through a single entry point into independent
          business modules.
        </p>
        <div className="arch-node">
          <LayoutDashboard /> React + TypeScript frontend
        </div>
        <ArrowDown className="flow-arrow" />
        <div className="arch-node gateway">
          <GitBranch /> API Gateway <code>/api/*</code>
        </div>
        <div className="branch-line" />
        <div className="arch-services">
          {[
            'Incident Service',
            'Log Service',
            'AI Analysis Service',
            'Notification Service',
          ].map((s, i) => (
            <div className="arch-node" key={s}>
              {[<CircleAlert />, <Terminal />, <Sparkles />, <Bell />][i]}
              <b>{s}</b>
              <small>
                {
                  [
                    'Lifecycle & assignment',
                    'Ingestion & search',
                    'Pattern classification',
                    'Events & alerts',
                  ][i]
                }
              </small>
            </div>
          ))}
        </div>
        <ArrowDown className="flow-arrow" />
        <div className="arch-node">
          <Database /> Repository layer → PostgreSQL
        </div>
      </div>
      <div className="panel">
        <h3>Architecture Overview</h3>
        <p>
          The system follows a service-oriented architecture where individual
          business capabilities are separated into independent services. The API
          Gateway provides a single entry point for the frontend, while
          specialized services handle incidents, logs, AI analysis, and
          notifications.
        </p>
        <p className="muted">
          The logical services are separate TypeScript modules deployed within
          one Netlify Function. They communicate through typed internal calls;
          REST endpoints expose their capabilities through the gateway. They are
          not independently deployed microservices.
        </p>
      </div>
    </>
  )
}
export function App() {
  const [screen, setScreen] = useState('Landing'),
    [page, setPage] = useState('Dashboard'),
    [incidents, setIncidents] = useState<Incident[]>([]),
    [logs, setLogs] = useState<Log[]>([]),
    [notices, setNotices] = useState<Notice[]>([]),
    [health, setHealth] = useState<Health[]>([]),
    [selected, setSelected] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [toast, setToast] = useState(''),
    [search, setSearch] = useState(''),
    [severity, setSeverity] = useState(''),
    [status, setStatus] = useState(''),
    [service, setService] = useState(''),
    [date, setDate] = useState(''),
    [range, setRange] = useState('7'),
    [text, setText] = useState(''),
    [result, setResult] = useState<Analysis | null>(null),
    [level, setLevel] = useState(''),
    [create, setCreate] = useState(false),
    [mobile, setMobile] = useState(false),
    [loginError, setLoginError] = useState('')
  useEffect(() => {
    const hash = decodeURIComponent(location.hash.slice(1))
    if (sessionStorage.getItem('opspilot-demo')) {
      setScreen('App')
      if (nav.some((n) => n.name === hash)) setPage(hash)
    }
  }, [])
  useEffect(() => {
    if (screen === 'App') void refresh()
  }, [screen])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 4500)
    return () => clearTimeout(t)
  }, [toast])
  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const [i, l, n, h] = await Promise.all([
        api<Incident[]>('/incidents'),
        api<Log[]>('/logs'),
        api<Notice[]>('/notifications'),
        api<Health[]>('/services/health'),
      ])
      setIncidents(i)
      setLogs(l)
      setNotices(n)
      setHealth(h)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }
  function enter() {
    sessionStorage.setItem('opspilot-demo', 'true')
    setScreen('App')
    setPage('Dashboard')
    location.hash = 'Dashboard'
  }
  function go(name: string) {
    setPage(name)
    setSelected(null)
    setSearch('')
    setMobile(false)
    location.hash = encodeURIComponent(name)
  }
  async function action(fn: () => Promise<void>) {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function simulate() {
    await action(async () => {
      const item = await api<Incident>('/simulate', 'POST')
      await refresh()
      setToast(`${item.id} detected · AI analysis complete`)
      setSelected(item)
      setPage('Incidents')
    })
  }
  async function update(input: Record<string, string>) {
    if (!selected) return
    await action(async () => {
      const item = await api<Incident>(
        `/incidents/${selected.id}`,
        'PUT',
        input,
      )
      setSelected(item)
      setIncidents((old) => old.map((i) => (i.id === item.id ? item : i)))
      setNotices(await api('/notifications'))
      setToast('Incident updated successfully')
    })
  }
  const active = incidents.filter(
      (i) => !['Resolved', 'Closed'].includes(i.status),
    ),
    critical = active.filter((i) => i.severity === 'Critical'),
    resolved = incidents.filter(
      (i) =>
        i.status === 'Resolved' &&
        i.updatedAt.slice(0, 10) === new Date().toISOString().slice(0, 10),
    )
  const filtered = incidents.filter(
    (i) =>
      (!severity || i.severity === severity) &&
      (!status || i.status === status) &&
      (!service || i.service === service) &&
      (!date || i.createdAt.slice(0, 10) === date) &&
      `${i.id} ${i.title} ${i.service} ${i.engineer}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )
  const unread = notices.filter((n) => !n.read).length
  function table(items: Incident[], compact = false) {
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>INCIDENT</th>
              <th>SEVERITY</th>
              <th>STATUS</th>
              <th>SERVICE</th>
              <th>ASSIGNED TO</th>
              {!compact && <th>CREATED</th>}
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr
                key={i.id}
                onClick={() => {
                  setSelected(i)
                  setPage('Incidents')
                }}
              >
                <td>
                  <button
                    className="incident-link"
                    onClick={() => {
                      setSelected(i)
                      setPage('Incidents')
                    }}
                  >
                    <small>{i.id}</small>
                    <strong>{i.title}</strong>
                  </button>
                </td>
                <td>
                  <Badge value={i.severity} />
                </td>
                <td>
                  <Badge value={i.status} />
                </td>
                <td>
                  <span className="service-label">
                    <span className="tiny-square" />
                    {i.service}
                  </span>
                </td>
                <td>
                  <span className="avatar tiny">
                    {i.engineer
                      .split(' ')
                      .map((s) => s[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <span className="engineer">{i.engineer}</span>
                </td>
                {!compact && <td className="muted">{fmt(i.createdAt)}</td>}
                <td>
                  <ChevronRight size={16} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && (
          <div className="empty">
            <Search />
            <h3>No incidents found</h3>
            <p>Adjust your filters or create a new incident.</p>
          </div>
        )}
      </div>
    )
  }
  const recentDays = Array.from({ length: Number(range) }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - Number(range) + i + 1)
    return d.toISOString().slice(0, 10)
  })
  const chartIncidents = incidents.filter((i) =>
    recentDays.includes(i.createdAt.slice(0, 10)),
  )
  const lineData = {
    labels: recentDays.map((d) =>
      new Date(d + 'T12:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
    ),
    datasets: [
      {
        label: 'Detected',
        data: recentDays.map(
          (d) => incidents.filter((i) => i.createdAt.slice(0, 10) === d).length,
        ),
        borderColor: '#43a78d',
        backgroundColor: 'rgba(67,167,141,.09)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: 'Resolved',
        data: recentDays.map(
          (d) =>
            incidents.filter(
              (i) => i.status === 'Resolved' && i.updatedAt.slice(0, 10) === d,
            ).length,
        ),
        borderColor: '#b2bfce',
        borderDash: [4, 4],
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  }
  if (screen === 'Landing')
    return (
      <div className="landing">
        <nav>
          <Brand />
          <div>
            <a href="#features">Features</a>
            <a href="#architecture">Architecture</a>
            <button className="button ghost" onClick={() => setScreen('Login')}>
              Log in <ArrowRight size={16} />
            </button>
          </div>
        </nav>
        <section className="hero">
          <div>
            <div className="eyebrow">
              <span className="live-dot" /> BUILT FOR THE MOMENT THAT MATTERS
            </div>
            <h1>
              AI-Powered DevOps
              <br />
              Incident Management<span className="mint">.</span>
            </h1>
            <p>
              Detect, analyze, prioritize, and resolve software incidents faster
              with intelligent automation.
            </p>
            <div className="hero-actions">
              <button
                className="button primary"
                onClick={() => setScreen('Login')}
              >
                Get Started <ArrowRight size={17} />
              </button>
              <button className="button" onClick={enter}>
                <Zap size={17} /> View Demo
              </button>
            </div>
            <div className="hero-foot">
              <ShieldCheck size={17} /> Fictional data. Real workflows. No API
              keys required.
            </div>
          </div>
          <div className="hero-console">
            <div className="console-top">
              <i />
              <i />
              <i />
              <span>opspilot / incident pipeline</span>
            </div>
            <div className="eyebrow">FROM SIGNAL TO SOLUTION</div>
            {[
              ['01', 'Detect the signal', 'Payment API timeout · ERROR'],
              ['02', 'Understand the cause', 'AI Analysis · 89% confidence'],
              ['03', 'Take the next step', 'Investigate → Mitigate → Resolve'],
            ].map(([n, t, d]) => (
              <div className="pipeline" key={n}>
                <span>{n}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
                <CheckCircle2 size={20} />
              </div>
            ))}
            <div className="console-footer">
              <Activity size={17} /> Your incident response, connected.
            </div>
          </div>
        </section>
        <section id="features" className="landing-features">
          <div>
            <div className="eyebrow">AN OPERATIONAL WORKSPACE</div>
            <h2>
              Less noise.
              <br />
              More understanding.
            </h2>
          </div>
          {[
            [
              CircleAlert,
              'Manage the complete lifecycle',
              'Track ownership, severity, response actions, and a clear incident timeline.',
            ],
            [
              Sparkles,
              'Turn logs into next steps',
              'Classify failure patterns with explainable, simulated AI analysis.',
            ],
            [
              GitBranch,
              'See the architecture at work',
              'Explore focused services, a REST gateway, and persistent PostgreSQL data.',
            ],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Activity
            return (
              <article key={String(t)}>
                <I />
                <h3>{String(t)}</h3>
                <p>{String(d)}</p>
              </article>
            )
          })}
        </section>
        <section id="architecture" className="landing-architecture">
          <Architecture />
        </section>
        <footer>
          <Brand />
          <span>
            React · TypeScript · Tailwind CSS · Netlify Functions · PostgreSQL
          </span>
          <small>Academic SOA demonstration • All data is fictional</small>
        </footer>
      </div>
    )
  if (screen === 'Login')
    return (
      <div className="login-page">
        <button className="back-link" onClick={() => setScreen('Landing')}>
          ← Back to overview
        </button>
        <div className="login-card">
          <Brand />
          <div className="eyebrow">WELCOME TO YOUR WORKSPACE</div>
          <h1>Ready for the next signal.</h1>
          <p className="muted">
            Sign in to explore your incident operations console.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              if (
                f.get('email') === 'admin@devops-demo.com' &&
                f.get('password') === 'admin123'
              )
                enter()
              else
                setLoginError(
                  'Invalid demo credentials. Use the account shown below.',
                )
            }}
          >
            <label>
              Email address
              <input
                name="email"
                type="email"
                defaultValue="admin@devops-demo.com"
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                defaultValue="admin123"
                required
              />
            </label>
            {loginError && (
              <p role="alert" className="error">
                {loginError}
              </p>
            )}
            <button className="button primary">
              Sign in to demo <ArrowRight size={16} />
            </button>
          </form>
          <div className="demo-info">
            <ShieldCheck size={20} />
            <div>
              <b>Public demo account</b>
              <p>admin@devops-demo.com / admin123</p>
              <small>
                Demo access only. This is not production authentication.
              </small>
            </div>
          </div>
        </div>
      </div>
    )
  return (
    <div className="app-shell">
      <aside className={mobile ? 'sidebar open' : 'sidebar'}>
        <Brand />
        <div className="workspace">
          <span className="workspace-icon">
            <Blocks size={18} />
          </span>
          <div>
            Demo Workspace<small>Engineering operations</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(({ name, icon: Icon }, i) => (
            <button
              className={page === name ? 'nav-item active' : 'nav-item'}
              onClick={() => go(name)}
              key={name}
            >
              <Icon size={18} />
              {name}
              {name === 'Incidents' && (
                <span className="nav-count">{active.length}</span>
              )}
              {name === 'Notifications' && unread > 0 && (
                <span className="notification-dot" />
              )}
              {i === 4 && null}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-box">
            <span>
              <Zap size={15} /> Demo environment
            </span>
            <p>
              A safe space to investigate.
              <br />
              All data is fictional.
            </p>
            <button onClick={simulate} disabled={busy}>
              Simulate an incident <ArrowRight size={14} />
            </button>
          </div>
          <div className="user">
            <span className="avatar">AD</span>
            <div>
              Alex Demo<small>Demo administrator</small>
            </div>
            <button
              title="Sign out"
              onClick={() => {
                sessionStorage.removeItem('opspilot-demo')
                setScreen('Login')
                location.hash = ''
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="mobile-toggle"
              aria-label="Toggle navigation"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={20} />
            </button>
            <span className="muted">Workspace</span>
            <ChevronRight size={14} />
            <b>{selected ? 'Incident Details' : page}</b>
          </div>
          <div>
            <span className="demo-pill">
              <span className="live-dot" />
              Demo Mode
            </span>
            <button
              title="Notifications"
              onClick={() => go('Notifications')}
              className="bell-button"
            >
              <Bell size={19} />
              {unread > 0 && <i />}
            </button>
            <span className="avatar small">AD</span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {page === 'Dashboard'
                  ? 'YOUR OPERATIONS, AT A GLANCE'
                  : 'ENGINEERING WORKSPACE'}
              </div>
              <h1>
                {selected
                  ? selected.id
                  : page === 'Dashboard'
                    ? 'Incident overview'
                    : page}
              </h1>
              <p>
                {selected
                  ? selected.title
                  : page === 'Dashboard'
                    ? 'A clear view of your incidents, services, and what needs attention.'
                    : page === 'Incidents'
                      ? 'Track, prioritize, and resolve incidents across your services.'
                      : page === 'Log Analyzer'
                        ? 'Turn application logs into actionable incident insights.'
                        : page === 'Services'
                          ? 'Explore the health and responsibilities of each logical service.'
                          : page === 'Architecture'
                            ? 'A connected system. Clearly defined responsibilities.'
                            : page === 'Notifications'
                              ? 'Stay up to date with activity across your workspace.'
                              : 'Built to explain. Designed to demonstrate.'}
              </p>
            </div>
            <div className="heading-actions">
              {page === 'Dashboard' && (
                <>
                  <button className="button" disabled={busy} onClick={simulate}>
                    <Zap size={16} />
                    {busy ? 'Simulating…' : 'Simulate New Incident'}
                  </button>
                  <button
                    className="button primary"
                    onClick={() => setCreate(true)}
                  >
                    <Plus size={17} /> Create Incident
                  </button>
                </>
              )}
              {page === 'Incidents' && !selected && (
                <button
                  className="button primary"
                  onClick={() => setCreate(true)}
                >
                  <Plus size={17} /> Create Incident
                </button>
              )}
            </div>
          </div>
          {error && (
            <div className="error-banner" role="alert">
              <CircleAlert size={18} />
              {error}
              <button onClick={refresh}>Try again</button>
              <button aria-label="Dismiss error" onClick={() => setError('')}>
                <X size={16} />
              </button>
            </div>
          )}
          {loading && !incidents.length ? (
            <div className="skeleton-grid" aria-label="Loading workspace">
              {Array.from({ length: 6 }, (_, i) => (
                <div className="skeleton" key={i} />
              ))}
            </div>
          ) : (
            <>
              {page === 'Dashboard' && (
                <>
                  <div className="environment-bar">
                    <span>
                      <span className="live-dot" /> Demo workspace is connected{' '}
                      <span className="divider">|</span>
                      <span className="muted">
                        Fictional incidents · Live application workflows
                      </span>
                    </span>
                    <span className="muted">
                      <Clock3 size={13} /> Updated{' '}
                      {new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      <button title="Refresh dashboard" onClick={refresh}>
                        <Activity size={15} />
                      </button>
                    </span>
                  </div>
                  <div className="stats-grid">
                    {[
                      {
                        label: 'Total Incidents',
                        value: incidents.length,
                        icon: CircleAlert,
                        caption: 'Across all services',
                        tone: 'neutral',
                      },
                      {
                        label: 'Critical Incidents',
                        value: critical.length,
                        icon: CircleAlert,
                        caption: 'Require immediate attention',
                        tone: 'red',
                      },
                      {
                        label: 'Active Incidents',
                        value: active.length,
                        icon: Activity,
                        caption: 'Currently in progress',
                        tone: 'orange',
                      },
                      {
                        label: 'Resolved Today',
                        value: resolved.length,
                        icon: CheckCircle2,
                        caption: 'Back on track',
                        tone: 'green',
                      },
                      {
                        label: 'System Health',
                        value: health.length
                          ? `${Math.round((health.filter((h) => h.status === 'Operational').length / health.length) * 100)}%`
                          : '—',
                        icon: ShieldCheck,
                        caption: health.length
                          ? 'All logical services connected'
                          : 'Health unavailable',
                        tone: 'green',
                      },
                    ].map(({ label, value, icon: Icon, caption, tone }) => (
                      <div className="stat-card" key={label}>
                        <div>
                          <span>{label}</span>
                          <Icon size={17} />
                        </div>
                        <strong>{value}</strong>
                        <small className={tone}>
                          <span className="stat-dot" />
                          {caption}
                        </small>
                      </div>
                    ))}
                  </div>
                  <div className="charts-main">
                    <div className="panel trend">
                      <div className="section-title">
                        <span>
                          Incident activity{' '}
                          <span className="subtle-tag">{range} days</span>
                        </span>
                        <select
                          aria-label="Activity date range"
                          value={range}
                          onChange={(e) => setRange(e.target.value)}
                        >
                          <option value="7">Last 7 days</option>
                          <option value="14">Last 14 days</option>
                          <option value="30">Last 30 days</option>
                        </select>
                      </div>
                      <p className="muted chart-subtitle">
                        Detected and resolved incidents over time
                      </p>
                      <div className="line-chart">
                        <Line
                          data={lineData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              x: {
                                grid: { display: false },
                                border: { display: false },
                                ticks: {
                                  color: '#8b959f',
                                  font: { size: 10 },
                                  maxTicksLimit: 7,
                                },
                              },
                              y: {
                                beginAtZero: true,
                                border: { display: false },
                                ticks: {
                                  stepSize: 1,
                                  color: '#8b959f',
                                  font: { size: 10 },
                                },
                                grid: { color: '#f0f2f4' },
                              },
                            },
                          }}
                          aria-label="Incidents detected and resolved over time"
                        />
                      </div>
                      <div className="chart-legend">
                        <span>
                          <i style={{ background: '#43a78d' }} />
                          Detected
                        </span>
                        <span>
                          <i style={{ background: '#b2bfce' }} />
                          Resolved
                        </span>
                      </div>
                    </div>
                    <div className="panel severity-panel">
                      <div className="section-title">
                        <span>Incidents by severity</span>
                        <CircleAlert size={16} className="muted" />
                      </div>
                      <div className="donut">
                        <Doughnut
                          data={{
                            labels: [...severities],
                            datasets: [
                              {
                                data: severities.map(
                                  (s) =>
                                    chartIncidents.filter(
                                      (i) => i.severity === s,
                                    ).length,
                                ),
                                backgroundColor: colors,
                                borderWidth: 4,
                                borderColor: '#fff',
                                borderRadius: 5,
                              },
                            ],
                          }}
                          options={{
                            cutout: '78%',
                            plugins: { legend: { display: false } },
                            maintainAspectRatio: false,
                          }}
                          aria-label="Incident counts by severity"
                        />
                        <div>
                          <strong>{chartIncidents.length}</strong>
                          <small>total incidents</small>
                        </div>
                      </div>
                      <div className="severity-legend">
                        {severities.map((s, i) => (
                          <div key={s}>
                            <span>
                              <i style={{ background: colors[i] }} />
                              {s}
                            </span>
                            <b>
                              {
                                chartIncidents.filter(
                                  (item) => item.severity === s,
                                ).length
                              }
                            </b>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="dashboard-lower">
                    <div className="panel recent-panel">
                      <div className="section-title">
                        <span>
                          Recent incidents{' '}
                          <span className="subtle-tag">{incidents.length}</span>
                        </span>
                        <button
                          className="text-button"
                          onClick={() => go('Incidents')}
                        >
                          View all incidents <ArrowRight size={14} />
                        </button>
                      </div>
                      {table(incidents.slice(0, 5), true)}
                    </div>
                    <div className="panel service-summary">
                      <div className="section-title">
                        <span>Service health</span>
                        <button
                          className="icon-button"
                          title="View services"
                          onClick={() => go('Services')}
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                      {health.map((h) => (
                        <div className="health-row" key={h.name}>
                          <span className="service-icon">
                            {h.name === 'Database' ? (
                              <Database size={15} />
                            ) : (
                              <Server size={15} />
                            )}
                          </span>
                          <div>
                            <b>{h.name}</b>
                            <small>{h.responseTime} ms · gateway probe</small>
                          </div>
                          <span className="live-dot" />
                        </div>
                      ))}
                      <p className="muted footnote">
                        Logical module connectivity, not external uptime.
                      </p>
                    </div>
                  </div>
                  <div className="bottom-charts">
                    <div className="panel">
                      <div className="section-title">
                        <span>Incidents by service</span>
                      </div>
                      <div className="bar-chart">
                        <Bar
                          data={{
                            labels: [
                              ...new Set(incidents.map((i) => i.service)),
                            ],
                            datasets: [
                              {
                                label: 'Incidents',
                                data: [
                                  ...new Set(incidents.map((i) => i.service)),
                                ].map(
                                  (s) =>
                                    incidents.filter((i) => i.service === s)
                                      .length,
                                ),
                                backgroundColor: '#83c4b0',
                                borderRadius: 4,
                              },
                            ],
                          }}
                          options={{
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: { stepSize: 1 },
                                grid: { color: '#f1f3f4' },
                              },
                              x: {
                                grid: { display: false },
                                ticks: { font: { size: 10 } },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                    <div className="panel">
                      <div className="section-title">
                        <span>Status distribution</span>
                      </div>
                      <div className="status-distribution">
                        {statuses.map((s) => (
                          <div key={s}>
                            <Badge value={s} />
                            <div className="progress-track">
                              <span
                                style={{
                                  width: `${incidents.length ? (incidents.filter((i) => i.status === s).length / incidents.length) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <b>
                              {incidents.filter((i) => i.status === s).length}
                            </b>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="ai-strip">
                    <span className="ai-icon">
                      <Sparkles size={20} />
                    </span>
                    <div>
                      <b>A little context. A faster next step.</b>
                      <p>
                        Analyze your logs to find failure patterns, possible
                        causes, and recommended actions.
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => go('Log Analyzer')}
                    >
                      Open Log Analyzer <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}
              {page === 'Incidents' && !selected && (
                <div className="panel">
                  <div className="filter-bar">
                    <div className="search-field">
                      <Search size={17} />
                      <input
                        aria-label="Search incidents"
                        placeholder="Search incidents, IDs, or engineers…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <select
                      aria-label="Severity filter"
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                    >
                      <option value="">All severities</option>
                      {severities.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Status filter"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">All statuses</option>
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Service filter"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                    >
                      <option value="">All services</option>
                      {[...new Set(incidents.map((i) => i.service))].map(
                        (s) => (
                          <option key={s}>{s}</option>
                        ),
                      )}
                    </select>
                    <input
                      aria-label="Filter by creation date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                    <button
                      className="text-button"
                      onClick={() => {
                        setSeverity('')
                        setStatus('')
                        setService('')
                        setDate('')
                        setSearch('')
                      }}
                    >
                      Reset
                    </button>
                  </div>
                  {table(filtered)}
                  <div className="table-footer">
                    Showing {filtered.length} of {incidents.length} incidents ·
                    All sample data is fictional
                  </div>
                </div>
              )}
              {page === 'Incidents' && selected && (
                <>
                  <button
                    className="text-button back"
                    onClick={() => setSelected(null)}
                  >
                    ← All incidents
                  </button>
                  <div className="details-grid">
                    <div>
                      <div className="panel">
                        <div className="section-title">
                          <span>Incident information</span>
                          <Badge value={selected.severity} />
                        </div>
                        <h2>{selected.title}</h2>
                        <p>{selected.description}</p>
                        <div className="detail-meta">
                          <div>
                            <label>Status</label>
                            <select
                              disabled={busy}
                              value={selected.status}
                              onChange={(e) =>
                                update({ status: e.target.value })
                              }
                            >
                              {statuses.map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label>Severity</label>
                            <select
                              disabled={busy}
                              value={selected.severity}
                              onChange={(e) =>
                                update({ severity: e.target.value })
                              }
                            >
                              {severities.map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label>Assigned engineer</label>
                            <select
                              disabled={busy}
                              value={selected.engineer}
                              onChange={(e) =>
                                update({ engineer: e.target.value })
                              }
                            >
                              {[
                                'Unassigned',
                                'Maya Chen',
                                'Arjun Rao',
                                'Sofia Reyes',
                              ].map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label>Affected service</label>
                            <p>{selected.service}</p>
                          </div>
                          <div>
                            <label>Created</label>
                            <p>{fmt(selected.createdAt)}</p>
                          </div>
                          <div>
                            <label>Updated</label>
                            <p>{fmt(selected.updatedAt)}</p>
                          </div>
                        </div>
                        <div className="detail-actions">
                          <button
                            className="button"
                            disabled={busy || selected.status !== 'Detected'}
                            onClick={() => update({ status: 'Investigating' })}
                          >
                            Start Investigation
                          </button>
                          <button
                            className="button"
                            disabled={
                              busy ||
                              !['Detected', 'Investigating'].includes(
                                selected.status,
                              )
                            }
                            onClick={() => update({ status: 'Mitigating' })}
                          >
                            Mark as Mitigating
                          </button>
                          <button
                            className="button primary"
                            disabled={
                              busy ||
                              ['Resolved', 'Closed'].includes(selected.status)
                            }
                            onClick={() => update({ status: 'Resolved' })}
                          >
                            <Check size={16} /> Resolve Incident
                          </button>
                        </div>
                      </div>
                      <AnalysisCard data={selected.analysis} />
                      <div className="panel">
                        <h3>Related logs</h3>
                        {logs
                          .filter((l) => l.incidentId === selected.id)
                          .map((l) => (
                            <div className="log-entry" key={l.id}>
                              <Badge value={l.level} />
                              <code>{l.message}</code>
                              <small>{fmt(l.time)}</small>
                            </div>
                          ))}
                        {!logs.some((l) => l.incidentId === selected.id) && (
                          <p className="muted">No related logs recorded.</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="panel">
                        <h3>Incident timeline</h3>
                        <div className="timeline">
                          {selected.timeline.map((t, i) => (
                            <div key={i}>
                              <i />
                              <small>{fmt(t.time)}</small>
                              <p>{t.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="panel">
                        <h3>Manage incident</h3>
                        <p className="muted">
                          Delete this fictional incident and remove it from the
                          workspace.
                        </p>
                        <button
                          className="button danger"
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                'Delete this incident permanently?',
                              )
                            )
                              void action(async () => {
                                await api(`/incidents/${selected.id}`, 'DELETE')
                                setSelected(null)
                                await refresh()
                                setToast('Incident deleted')
                              })
                          }}
                        >
                          Delete Incident
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {page === 'Log Analyzer' && (
                <>
                  <div className="analyzer-grid">
                    <div className="panel">
                      <div className="section-title">
                        <span>
                          <Terminal size={18} /> Log input
                        </span>
                        <button
                          className="text-button"
                          onClick={() => {
                            setText(
                              'ERROR Database connection timeout.\nCRITICAL Connection pool exhausted.\nERROR API requests failing with status 503.',
                            )
                            setResult(null)
                          }}
                        >
                          Load sample logs
                        </button>
                      </div>
                      <p className="muted">
                        Paste application logs or upload a .log or .txt file (up
                        to 200 KB).
                      </p>
                      <label className="upload">
                        <Upload size={20} />
                        <b>Choose a log file</b>
                        <span>Plain text · .log or .txt</span>
                        <input
                          type="file"
                          accept=".log,.txt,text/plain"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            if (
                              !/\.(log|txt)$/i.test(file.name) ||
                              file.size > 200000
                            ) {
                              setError(
                                'Choose a .log or .txt file smaller than 200 KB.',
                              )
                              return
                            }
                            file
                              .text()
                              .then(setText)
                              .catch(() =>
                                setError('Unable to read this file.'),
                              )
                          }}
                        />
                      </label>
                      <textarea
                        aria-label="Application logs"
                        className="log-textarea"
                        value={text}
                        onChange={(e) => {
                          setText(e.target.value)
                          setResult(null)
                        }}
                        placeholder="Paste your sample application logs here…"
                        maxLength={200000}
                      />
                      <div className="section-title">
                        <span className="muted">
                          {text.split('\n').filter(Boolean).length} lines ·{' '}
                          {text.length} characters
                        </span>
                        <button
                          className="button primary"
                          disabled={busy}
                          onClick={() =>
                            action(async () => {
                              if (!text.trim())
                                throw new Error(
                                  'Enter or upload logs before analyzing.',
                                )
                              setResult(
                                await api('/logs/analyze', 'POST', { text }),
                              )
                              setLogs(await api('/logs'))
                              setToast('Log analysis complete')
                            })
                          }
                        >
                          <Sparkles size={16} />
                          {busy ? 'Analyzing…' : 'Analyze Logs'}
                        </button>
                      </div>
                    </div>
                    <div>
                      {result ? (
                        <>
                          <AnalysisCard data={result} />
                          <button
                            className="button"
                            disabled={busy}
                            onClick={() =>
                              action(async () => {
                                const item = await api<Incident>(
                                  '/incidents',
                                  'POST',
                                  {
                                    title: result.type,
                                    description: text.slice(0, 3000),
                                    service: 'Log Analyzer',
                                    severity: result.severity,
                                  },
                                )
                                await refresh()
                                setSelected(item)
                                setPage('Incidents')
                                setToast('Incident created from analysis')
                              })
                            }
                          >
                            <Plus size={16} /> Create incident from analysis
                          </button>
                        </>
                      ) : (
                        <div className="panel analysis-empty">
                          <div className="large-icon">
                            <Sparkles size={30} />
                          </div>
                          <h3>Find the story in your logs.</h3>
                          <p>
                            Analyze logs to see the incident type, severity,
                            root cause, confidence, and recommended action.
                          </p>
                          <small>
                            Local rule-based simulation · No external AI calls
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="section-title">
                      <span>
                        Recent logs{' '}
                        <span className="subtle-tag">{logs.length}</span>
                      </span>
                      <select
                        aria-label="Log level"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                      >
                        <option value="">All levels</option>
                        {['INFO', 'WARNING', 'ERROR', 'CRITICAL'].map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div className="search-field log-search">
                      <Search size={17} />
                      <input
                        aria-label="Search logs"
                        placeholder="Search log messages…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    {logs
                      .filter(
                        (l) =>
                          (!level || l.level === level) &&
                          l.message
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                      )
                      .map((l) => (
                        <div className="log-entry" key={l.id}>
                          <small>{fmt(l.time)}</small>
                          <Badge value={l.level} />
                          <code>{l.message}</code>
                        </div>
                      ))}
                    {!logs.filter(
                      (l) =>
                        (!level || l.level === level) &&
                        l.message.toLowerCase().includes(search.toLowerCase()),
                    ).length && (
                      <div className="empty">No logs match your filters.</div>
                    )}
                  </div>
                </>
              )}
              {page === 'Services' && (
                <>
                  <div className="info-banner">
                    <ShieldCheck size={20} />
                    <div>
                      <b>Logical services, working together</b>
                      <p>
                        These modules run within one serverless gateway.
                        Response times measure a shared repository probe, not
                        isolated service uptime.
                      </p>
                    </div>
                    <button className="button" onClick={refresh}>
                      Refresh health
                    </button>
                  </div>
                  <div className="services-grid">
                    {health.map((h, i) => (
                      <div className="panel service-card" key={h.name}>
                        <div className="section-title">
                          <span className="large-icon">
                            {i === 5 ? (
                              <Database />
                            ) : i === 3 ? (
                              <Sparkles />
                            ) : (
                              <Blocks />
                            )}
                          </span>
                          <Badge value={h.status} />
                        </div>
                        <h2>{h.name}</h2>
                        <p className="muted">{h.description}</p>
                        <code>{h.endpoint}</code>
                        <div className="service-card-footer">
                          <span>Repository probe</span>
                          <b>{h.responseTime} ms</b>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {page === 'Notifications' && (
                <div className="panel">
                  <div className="section-title">
                    <span>
                      Workspace activity{' '}
                      <span className="subtle-tag">{unread} unread</span>
                    </span>
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() =>
                        action(async () => {
                          await api('/notifications/read', 'PUT')
                          setNotices(await api('/notifications'))
                          setToast('All notifications marked as read')
                        })
                      }
                    >
                      <Check size={15} /> Mark all as read
                    </button>
                  </div>
                  {notices.map((n) => (
                    <div
                      className={`notice ${n.read ? '' : 'unread'}`}
                      key={n.id}
                    >
                      <span className="notice-icon">
                        <Bell size={19} />
                      </span>
                      <div>
                        <h3>
                          {n.title}
                          {!n.read && <span className="notification-dot" />}
                        </h3>
                        <p>{n.message}</p>
                        <small>{fmt(n.time)}</small>
                        {n.incidentId && (
                          <button
                            className="text-button"
                            onClick={() =>
                              action(async () => {
                                const item = await api<Incident>(
                                  `/incidents/${n.incidentId}`,
                                )
                                setSelected(item)
                                setPage('Incidents')
                              })
                            }
                          >
                            View incident <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!notices.length && (
                    <div className="empty">
                      <Bell />
                      <h3>You're all caught up</h3>
                      <p>
                        Incident activity appears here as your team takes
                        action.
                      </p>
                    </div>
                  )}
                </div>
              )}
              {page === 'Architecture' && <Architecture />}
              {page === 'About Project' && (
                <div className="about-grid">
                  <div className="panel about-intro">
                    <div className="eyebrow">AN ACADEMIC SOA PROJECT</div>
                    <h2>
                      AI-Powered DevOps
                      <br />
                      Incident Management System
                    </h2>
                    <p>
                      A functional demonstration of incident response, REST
                      APIs, persistent data, and service-oriented design.
                    </p>
                    <div className="about-tags">
                      {[
                        'React',
                        'TypeScript',
                        'Tailwind CSS',
                        'Netlify Functions',
                        'PostgreSQL',
                        'Drizzle ORM',
                      ].map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  </div>
                  {[
                    [
                      'Problem',
                      'DevOps teams often receive large volumes of logs and alerts, making incident identification and troubleshooting time-consuming.',
                    ],
                    [
                      'Solution',
                      'The system centralizes incident management and uses AI-assisted analysis to classify incidents, estimate severity, identify possible root causes, and recommend actions.',
                    ],
                    [
                      'SOA contribution',
                      'The application separates incident management, log processing, AI analysis, notifications, and API gateway responsibilities into independent logical services.',
                    ],
                    [
                      'Transparent demonstration',
                      'Analysis uses deterministic keyword rules and heuristic confidence scores. All incidents, engineers, and logs are fictional. Demo access is a presentation convenience, not a security boundary.',
                    ],
                  ].map(([t, d]) => (
                    <div className="panel" key={t}>
                      <h3>{t}</h3>
                      <p className="muted">{d}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          <div className="app-footer">
            <span>
              OpsPilot <span> / </span> AI-Powered DevOps Incident Management
            </span>
            <span>
              <span className="live-dot" /> SOA demonstration environment
            </span>
          </div>
        </main>
      </div>
      {toast && (
        <div role="status" className="toast">
          <CheckCircle2 size={19} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {create && (
        <div className="modal-overlay">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-title"
          >
            <div className="section-title">
              <h2 id="create-title">Create incident</h2>
              <button
                aria-label="Close dialog"
                onClick={() => setCreate(false)}
              >
                <X size={21} />
              </button>
            </div>
            <p className="muted">
              Record an issue and start the response workflow.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const f = new FormData(e.currentTarget)
                void action(async () => {
                  const item = await api<Incident>(
                    '/incidents',
                    'POST',
                    Object.fromEntries(f),
                  )
                  setCreate(false)
                  await refresh()
                  setSelected(item)
                  setPage('Incidents')
                  setToast('Incident created and analyzed')
                })
              }}
            >
              <label>
                Incident title
                <input
                  name="title"
                  required
                  maxLength={160}
                  placeholder="e.g. Elevated API response times"
                />
              </label>
              <label>
                Affected service
                <select name="service">
                  {[
                    'API Gateway',
                    'Payment API',
                    'Auth Service',
                    'Database',
                    'Worker Service',
                    'Cache Service',
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Severity
                <select name="severity">
                  <option value="">Predict from description</option>
                  {severities.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Description / sample logs
                <textarea
                  name="description"
                  required
                  maxLength={3000}
                  placeholder="Describe the issue and include relevant sample log messages."
                />
              </label>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="button"
                  onClick={() => setCreate(false)}
                >
                  Cancel
                </button>
                <button className="button primary" disabled={busy}>
                  {busy ? 'Creating…' : 'Create Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
