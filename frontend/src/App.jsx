import { useEffect, useState } from 'react'
import './App.css'

const API = 'http://localhost:8080/api/machines'

const emptyForm = {
  machineName: '',
  machineCode: '',
  machineType: '',
  location: '',
  status: 'Healthy',
  installationDate: '',
}

const emptyReading = {
  temperature: '',
  vibration: '',
  operatingHours: '',
}

function TrendChart({ readings, field, label, unit }) {
  const points = [...readings].sort((a, b) => a.id - b.id).slice(-8)
  const values = points.map((item) => Number(item[field] ?? 0))
  const width = 560
  const height = 190
  const pad = 24
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const range = max - min || 1
  const coords = values.map((value, index) => ({
    x: pad + (points.length <= 1 ? 0 : index * (width - pad * 2) / (points.length - 1)),
    y: height - pad - ((value - min) / range) * (height - pad * 2),
    value,
  }))
  const path = coords.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ')

  return (
    <div className="chart-card">
      <div className="chart-title">
        <div><h3>{label}</h3><p>Most recent {points.length} readings</p></div>
        {coords.length > 0 && <strong>{coords[coords.length - 1].value}{unit}</strong>}
      </div>
      {points.length === 0 ? (
        <div className="chart-empty">Add sensor readings to see the trend.</div>
      ) : (
        <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${label} trend chart`}>
          {[0, 1, 2, 3].map((line) => {
            const y = pad + line * (height - pad * 2) / 3
            return <line key={line} x1={pad} x2={width - pad} y1={y} y2={y} className="chart-grid-line" />
          })}
          <path d={path} className="chart-line" />
          {coords.map((point, index) => (
            <circle key={`${points[index].id}-${index}`} cx={point.x} cy={point.y} r="4" className="chart-point">
              <title>{point.value}{unit}</title>
            </circle>
          ))}
        </svg>
      )}
    </div>
  )
}

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [machines, setMachines] = useState([])
  const [latestHealthByMachine, setLatestHealthByMachine] = useState({})
  const [form, setForm] = useState(emptyForm)
  const [readingForm, setReadingForm] = useState(emptyReading)
  const [selectedMachineId, setSelectedMachineId] = useState('')
  const [readings, setReadings] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [readingError, setReadingError] = useState('')
  const [readingMessage, setReadingMessage] = useState('')
  const [readingLoading, setReadingLoading] = useState(false)

  const loadMachines = async () => {
    try {
      const response = await fetch(API)
      if (!response.ok) throw new Error('Could not load machines')
      const data = await response.json()
      setMachines(data)
      if (data.length > 0) {
        setSelectedMachineId((currentId) => currentId || String(data[0].id))
      }
    } catch {
      setError('Cannot connect to backend. Check Spring Boot.')
    } finally {
      setLoading(false)
    }
  }

  const loadReadings = async (machineId) => {
    if (!machineId) {
      setReadings([])
      return
    }

    try {
      const response = await fetch(`${API}/${machineId}/readings`)
      if (!response.ok) throw new Error('Could not load sensor readings')
      const data = await response.json()
      setReadings([...data].sort((a, b) => b.id - a.id))
    } catch (err) {
      setReadingError(err.message)
    }
  }

  const loadLatestHealth = async (machineList) => {
    const healthData = {}

    await Promise.all(
      machineList.map(async (machine) => {
        try {
          const response = await fetch(`${API}/${machine.id}/readings`)
          if (!response.ok) return
          const data = await response.json()

          if (data.length > 0) {
            const latest = data.reduce((currentLatest, current) =>
              current.id > currentLatest.id ? current : currentLatest
            )
            healthData[machine.id] = latest.healthScore
          }
        } catch (err) {
          console.error(`Could not load health for machine ${machine.id}`, err)
        }
      })
    )

    setLatestHealthByMachine(healthData)
  }

  useEffect(() => {
    loadMachines()
  }, [])

  useEffect(() => {
    if (machines.length > 0) loadLatestHealth(machines)
    else setLatestHealthByMachine({})
  }, [machines])

  useEffect(() => {
    loadReadings(selectedMachineId)
  }, [selectedMachineId])

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleReadingChange = (event) => {
    setReadingForm({ ...readingForm, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Could not add machine')
      }

      setMessage('Machine added successfully!')
      setForm(emptyForm)
      await loadMachines()
    } catch (err) {
      setError(err.message || 'Something went wrong')
    }
  }

  const handleReadingSubmit = async (event) => {
    event.preventDefault()
    setReadingError('')
    setReadingMessage('')

    if (!selectedMachineId) {
      setReadingError('Please select a machine.')
      return
    }

    setReadingLoading(true)

    try {
      const response = await fetch(`${API}/${selectedMachineId}/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature: Number(readingForm.temperature),
          vibration: Number(readingForm.vibration),
          operatingHours: Number(readingForm.operatingHours),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Could not save sensor reading')
      }

      const savedReading = await response.json()
      setReadingMessage(
        `Reading saved! Health Score: ${savedReading.healthScore}`
      )
      setLatestHealthByMachine((current) => ({
        ...current,
        [selectedMachineId]: savedReading.healthScore,
      }))
      setReadingForm(emptyReading)
      await loadReadings(selectedMachineId)
    } catch (err) {
      setReadingError(err.message || 'Something went wrong')
    } finally {
      setReadingLoading(false)
    }
  }

  const getHealthStatus = (machine) => {
    const score = latestHealthByMachine[machine.id]
    if (score === undefined || score === null) return machine.status || 'No reading'
    if (score >= 70) return 'Healthy'
    if (score >= 40) return 'Warning'
    return 'Critical'
  }

  const healthAlerts = machines.flatMap((machine) => {
    const score = latestHealthByMachine[machine.id]
    const latestReading = readings.find((reading) => String(reading.machine?.id ?? reading.machineId) === String(machine.id))
    const alerts = []

    if (score !== undefined && score < 40) {
      alerts.push({ id: `${machine.id}-critical`, level: 'critical', machine: machine.machineName, text: `Critical health score (${score}). Maintenance should be prioritized.` })
    } else if (score !== undefined && score < 70) {
      alerts.push({ id: `${machine.id}-warning`, level: 'warning', machine: machine.machineName, text: `Health score is ${score}. Check the latest condition.` })
    }

    if (latestReading && Number(latestReading.temperature) >= 70) {
      alerts.push({ id: `${machine.id}-temperature`, level: 'warning', machine: machine.machineName, text: `Temperature is high (${latestReading.temperature}). Review operating conditions.` })
    }
    if (latestReading && Number(latestReading.vibration) >= 5) {
      alerts.push({ id: `${machine.id}-vibration`, level: 'critical', machine: machine.machineName, text: `Vibration is high (${latestReading.vibration}). Inspect the machine.` })
    }
    return alerts
  })

  const healthyCount = machines.filter((machine) => {
    const score = latestHealthByMachine[machine.id]
    return score === undefined ? machine.status === 'Healthy' : score >= 70
  }).length

  const warningCount = machines.filter(
    (machine) => latestHealthByMachine[machine.id] >= 40 &&
      latestHealthByMachine[machine.id] < 70
  ).length

  const criticalCount = machines.filter(
    (machine) => latestHealthByMachine[machine.id] < 40
  ).length

  const renderMachineCards = () => (
    <>
      {loading && <p>Loading machines...</p>}
      {!loading && machines.length === 0 && (
        <p>No machines found. Add your first machine from the Dashboard.</p>
      )}

      <div className="machine-list">
        {machines.map((machine) => {
          const score = latestHealthByMachine[machine.id]
          const status = getHealthStatus(machine)

          return (
            <article className="machine-card" key={machine.id}>
              <div className="machine-card-top">
                <div>
                  <h3>{machine.machineName}</h3>
                  <p className="machine-code">{machine.machineCode}</p>
                </div>
                <span className={`health-badge ${status.toLowerCase().replace(' ', '-')}`}>
                  {status}
                </span>
              </div>
              <p><strong>Type:</strong> {machine.machineType || 'Not specified'}</p>
              <p><strong>Location:</strong> {machine.location || 'Not specified'}</p>
              <p><strong>Health score:</strong> {score ?? 'No reading yet'}</p>
              <p><strong>Installed:</strong> {machine.installationDate || 'Not specified'}</p>
              <button
                className="secondary-button"
                onClick={() => {
                  setSelectedMachineId(String(machine.id))
                  setActivePage('Machines')
                }}
              >
                View sensor readings
              </button>
            </article>
          )
        })}
      </div>
    </>
  )

  const renderAddMachineForm = () => (
    <section className="panel">
      <div className="section-heading">
        <span className="section-icon">＋</span>
        <div>
          <h2>Add New Machine</h2>
          <p>Register a machine to monitor its condition.</p>
        </div>
      </div>

      <form className="machine-form" onSubmit={handleSubmit}>
        <input name="machineName" placeholder="Machine Name" value={form.machineName} onChange={handleChange} required />
        <input name="machineCode" placeholder="Machine Code (e.g. MC-001)" value={form.machineCode} onChange={handleChange} required />
        <input name="machineType" placeholder="Machine Type" value={form.machineType} onChange={handleChange} />
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} />
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="Healthy">Healthy</option>
          <option value="Warning">Warning</option>
          <option value="Critical">Critical</option>
          <option value="Maintenance">Maintenance</option>
        </select>
        <input type="date" name="installationDate" value={form.installationDate} onChange={handleChange} />
        <button type="submit">＋ Add Machine</button>
      </form>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  )

  const renderSensorForm = () => (
    <section className="panel">
      <div className="section-heading">
        <span className="section-icon">⌁</span>
        <div>
          <h2>Add Sensor Reading</h2>
          <p>Enter a new temperature, vibration, and operating-hours reading.</p>
        </div>
      </div>

      <form className="machine-form" onSubmit={handleReadingSubmit}>
        <select value={selectedMachineId} onChange={(event) => setSelectedMachineId(event.target.value)} required>
          <option value="">Select Machine</option>
          {machines.map((machine) => (
            <option key={machine.id} value={machine.id}>
              {machine.machineName} ({machine.machineCode})
            </option>
          ))}
        </select>
        <input type="number" name="temperature" placeholder="Temperature" value={readingForm.temperature} onChange={handleReadingChange} step="any" required />
        <input type="number" name="vibration" placeholder="Vibration" value={readingForm.vibration} onChange={handleReadingChange} step="any" required />
        <input type="number" name="operatingHours" placeholder="Operating Hours" value={readingForm.operatingHours} onChange={handleReadingChange} step="any" required />
        <button type="submit" disabled={readingLoading}>
          {readingLoading ? 'Saving...' : '+ Add Sensor Reading'}
        </button>
      </form>

      {readingMessage && <p className="success">{readingMessage}</p>}
      {readingError && <p className="error">{readingError}</p>}
    </section>
  )

  const renderReadingHistory = () => (
    <section className="panel">
      <div className="section-heading">
        <span className="section-icon">▤</span>
        <div>
          <h2>Sensor Reading History</h2>
          <p>Latest sensor readings for the selected machine.</p>
        </div>
      </div>

      {readings.length === 0 && <p>No sensor readings found for this machine.</p>}
      <div className="machine-list">
        {readings.map((reading) => (
          <article className="machine-card reading-card" key={reading.id}>
            <h3>Reading #{reading.id}</h3>
            <div className="reading-values">
              <p><strong>Temperature</strong><span>{reading.temperature}</span></p>
              <p><strong>Vibration</strong><span>{reading.vibration}</span></p>
              <p><strong>Operating hours</strong><span>{reading.operatingHours}</span></p>
              <p><strong>Health score</strong><span>{reading.healthScore}</span></p>
            </div>
            <p className="reading-time">{reading.readingTime}</p>
          </article>
        ))}
      </div>
    </section>
  )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">⚙</span>
          <span>PredictiveCare</span>
        </div>

        <p className="nav-label">WORKSPACE</p>
        <nav className="sidebar-nav">
          {[
            { label: 'Dashboard', icon: '▦' },
            { label: 'Machines', icon: '⚙' },
            { label: 'Predictions', icon: '⌁' },
            { label: 'Maintenance', icon: '▣' },
          ].map((item) => (
            <button
              key={item.label}
              className={`nav-item ${activePage === item.label ? 'active' : ''}`}
              onClick={() => setActivePage(item.label)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {activePage === item.label && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="online-dot" />
          <span>System online</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">PREDICTIVE MAINTENANCE</p>
            <h1>{activePage}</h1>
            <p className="page-subtitle">
              {activePage === 'Dashboard' && 'Monitor machine health and predict possible failures.'}
              {activePage === 'Machines' && 'Manage equipment and review sensor readings.'}
              {activePage === 'Predictions' && 'Review machine condition based on the latest demo health score.'}
              {activePage === 'Maintenance' && 'Track maintenance needs and service activities.'}
            </p>
          </div>
          <div className="system-status"><span className="online-dot" /> System Online</div>
        </header>

        {activePage === 'Dashboard' && (
          <>
            <section className="stats">
              <article className="stat-card">
                <div className="stat-card-heading"><span className="stat-icon blue">▦</span><span>Total Machines</span></div>
                <h2>{machines.length}</h2>
                <p className="stat-note">Registered equipment</p>
              </article>
              <article className="stat-card">
                <div className="stat-card-heading"><span className="stat-icon green">✓</span><span>Healthy Machines</span></div>
                <h2>{healthyCount}</h2>
                <p className="stat-note">Health score 70 or above</p>
              </article>
              <article className="stat-card">
                <div className="stat-card-heading"><span className="stat-icon red">!</span><span>Predicted Failures</span></div>
                <h2>{criticalCount}</h2>
                <p className="stat-note">Critical demo score below 40</p>
              </article>
              <article className="stat-card">
                <div className="stat-card-heading"><span className="stat-icon amber">▣</span><span>Maintenance Requests</span></div>
                <h2>0</h2>
                <p className="stat-note">Requests tracked in this demo</p>
              </article>
            </section>

            <div className="dashboard-grid">
              {renderAddMachineForm()}
              <section className="panel status-panel">
                <div className="section-heading">
                  <span className="section-icon">◉</span>
                  <div><h2>Health Summary</h2><p>Machine status from latest readings.</p></div>
                </div>
                <div className="health-summary-row"><span className="health-badge healthy">Healthy</span><strong>{healthyCount}</strong></div>
                <div className="health-summary-row"><span className="health-badge warning">Warning</span><strong>{warningCount}</strong></div>
                <div className="health-summary-row"><span className="health-badge critical">Critical</span><strong>{criticalCount}</strong></div>
                <p className="demo-note">Demo rules: Healthy ≥ 70, Warning 40–69, Critical &lt; 40.</p>
              </section>
            </div>

            <section className="panel">
              <div className="section-heading">
                <span className="section-icon">⚡</span>
                <div><h2>Health Alerts</h2><p>Rule-based alerts from current demo readings.</p></div>
              </div>
              {healthAlerts.length === 0 ? (
                <div className="alert-empty"><span>✓</span><div><strong>No active alerts</strong><p>No sample thresholds are currently crossed. New alerts appear when readings are added.</p></div></div>
              ) : (
                <div className="alert-list">
                  {healthAlerts.map((alert) => (
                    <div className={`alert-item ${alert.level}`} key={alert.id}>
                      <span className="alert-symbol">{alert.level === 'critical' ? '!' : '⚠'}</span>
                      <div><strong>{alert.machine}</strong><p>{alert.text}</p></div>
                      <span className={`health-badge ${alert.level}`}>{alert.level === 'critical' ? 'Critical' : 'Warning'}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="demo-note">These are sample threshold alerts, not live sensor-device notifications.</p>
            </section>

            <section className="panel">
              <div className="section-heading">
                <span className="section-icon">⌁</span>
                <div><h2>Sensor Trends</h2><p>Temperature and vibration over the recent readings for the selected machine.</p></div>
              </div>
              <div className="trend-grid">
                <TrendChart readings={readings} field="temperature" label="Temperature" unit="°" />
                <TrendChart readings={readings} field="vibration" label="Vibration" unit="" />
              </div>
            </section>

            <section className="panel">
              <div className="section-heading">
                <span className="section-icon">⚙</span>
                <div><h2>Machine Overview</h2><p>A quick look at your registered machines.</p></div>
                <button className="text-button" onClick={() => setActivePage('Machines')}>View all →</button>
              </div>
              {renderMachineCards()}
            </section>
          </>
        )}

        {activePage === 'Machines' && (
          <>
            {renderSensorForm()}
            {renderReadingHistory()}
            <section className="panel">
              <div className="section-heading"><span className="section-icon">⚙</span><div><h2>All Machines</h2><p>Machine records from your database.</p></div></div>
              {renderMachineCards()}
            </section>
          </>
        )}

        {activePage === 'Predictions' && (
          <section className="panel">
            <div className="section-heading"><span className="section-icon">⌁</span><div><h2>Machine Risk Overview</h2><p>Risk labels currently use the sample health-score thresholds.</p></div></div>
            {machines.length === 0 ? <p>Add a machine to see its status.</p> : (
              <div className="machine-list">
                {machines.map((machine) => {
                  const score = latestHealthByMachine[machine.id]
                  const status = getHealthStatus(machine)
                  return (
                    <article className="machine-card" key={machine.id}>
                      <div className="machine-card-top"><div><h3>{machine.machineName}</h3><p className="machine-code">{machine.machineCode}</p></div><span className={`health-badge ${status.toLowerCase().replace(' ', '-')}`}>{status}</span></div>
                      <p><strong>Latest health score:</strong> {score ?? 'No sensor data yet'}</p>
                      <p><strong>Risk:</strong> {score === undefined ? 'Awaiting reading' : score < 40 ? 'High' : score < 70 ? 'Medium' : 'Low'}</p>
                      <button className="secondary-button" onClick={() => { setSelectedMachineId(String(machine.id)); setActivePage('Machines') }}>Add / view readings</button>
                    </article>
                  )
                })}
              </div>
            )}
            <p className="demo-note">Important: this is threshold-based demo logic, not a trained machine-learning model.</p>
          </section>
        )}

        {activePage === 'Maintenance' && (
          <section className="panel">
            <div className="section-heading"><span className="section-icon">▣</span><div><h2>Maintenance Requests</h2><p>Maintenance request tracking will be connected in the next development step.</p></div></div>
            <div className="empty-state">
              <span className="empty-state-icon">🛠</span>
              <h3>No maintenance requests yet</h3>
              <p>When we add the maintenance feature, you will be able to create service requests, assign technicians, and track completion.</p>
              <button onClick={() => setActivePage('Predictions')}>Review machine risks</button>
            </div>
          </section>
        )}

        <footer className="page-footer">PredictiveCare · Predictive Maintenance System</footer>
      </main>
    </div>
  )
}

export default App
