"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ChatBot from "../components/ChatBot"
import NotificationSound from "../components/NotificationSound"

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase()

const firstNameLast = (name = "") => {
  const parts = name.split(" ")
  return `${parts[0]} ${parts[1]?.[0] ? parts[1][0] + "." : ""}`.trim()
}

export default function StaffDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(null)
  const [activeStaffTab, setActiveStaffTab] = useState("prospects")
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "",
    email: "", company: "", notes: "", score: "Warm"
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [prospects, setProspects] = useState([])
  const [fetchingProspects, setFetchingProspects] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [prevLeaderboard, setPrevLeaderboard] = useState([])
  const [leaderboardMounted, setLeaderboardMounted] = useState(false)
  const [leaderboardSearch, setLeaderboardSearch] = useState("")
  const [typerKey, setTyperKey] = useState(0)

  useEffect(() => {
    fetchCurrentUser()
    fetchMyProspects()
    fetchNotifications()
    fetchLeaderboard()
  }, [])

  useEffect(() => {
    if (activeStaffTab === "leaderboard") {
      setLeaderboardMounted(false)
      const t = setTimeout(() => setLeaderboardMounted(true), 60)
      return () => clearTimeout(t)
    }
  }, [activeStaffTab, leaderboard])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/me")
      const data = await res.json()
      if (data.user) setCurrentUser(data.user)
      await fetch("/api/reminders/auto")
    } catch (err) {
      console.error(err)
    }
  }

  const fetchMyProspects = async () => {
    try {
      const res = await fetch("/api/prospects/mine")
      const data = await res.json()
      if (data.prospects) setProspects(data.prospects)
    } catch (err) {
      console.error(err)
    } finally {
      setFetchingProspects(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      if (data.notifications) setNotifications(data.notifications)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard")
      const data = await res.json()
      if (data.leaderboard) {
        const stored = localStorage.getItem("prevLeaderboard")
        if (stored) {
          setPrevLeaderboard(JSON.parse(stored))
        }
        localStorage.setItem("prevLeaderboard", JSON.stringify(leaderboard))
        setLeaderboard(data.leaderboard)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" })
    fetchNotifications()
  }

  const clearNotifications = async () => {
    await fetch("/api/notifications", { method: "DELETE" })
    fetchNotifications()
    setShowNotifications(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess("")
    setError("")
    try {
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to add prospect")
        setLoading(false)
        return
      }
      setSuccess("Prospect added successfully!")
      setForm({ firstName: "", lastName: "", phone: "", email: "", company: "", notes: "", score: "Warm" })
      fetchMyProspects()
    } catch (err) {
      setError("Something went wrong. Try again.")
    }
    setLoading(false)
  }

  const handleStatusUpdate = async (id, status) => {
    await fetch(`/api/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    })
    fetchMyProspects()
  }

  const getWhatsAppMessage = (prospect) => `Hello ${prospect.firstName},`

  const openWhatsApp = (prospect) => {
    const message = getWhatsAppMessage(prospect)
    const phone = prospect.phone.replace(/\D/g, "")
    const formattedPhone = phone.startsWith("0") ? "234" + phone.slice(1) : phone
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, "_blank")
  }

  const getRankChange = (s) => {
    if (prevLeaderboard.length === 0) return null
    const prevIndex = prevLeaderboard.findIndex(p => p.id === s.id)
    const currIndex = leaderboard.findIndex(p => p.id === s.id)
    if (prevIndex === -1) return "new"
    return prevIndex - currIndex
  }

  const scoreColor = (score) => {
    if (score === "Hot") return "#dc2626"
    if (score === "Warm") return "#d97706"
    return "#2563eb"
  }

  const statusColor = (status) => {
    if (status === "New") return "#0d2b1d"
    if (status === "Contacted") return "#1d4ed8"
    if (status === "Interested") return "#15803d"
    if (status === "Converted") return "#2db973"
    return "#dc2626"
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    backgroundColor: "#f0ebe3", border: "1px solid #d0c8be",
    borderRadius: "8px", color: "#1a1a1a", fontSize: "14px",
    outline: "none", boxSizing: "border-box"
  }

  const labelStyle = {
    color: "#6b7280", fontSize: "12px", display: "block",
    marginBottom: "6px", textTransform: "uppercase",
    letterSpacing: "0.4px", fontWeight: "600"
  }

  const TypewriterBanner = () => {
    const [displayText, setDisplayText] = useState("")
    const [currentLine, setCurrentLine] = useState(0)
    const [currentChar, setCurrentChar] = useState(0)
    const [showCursor, setShowCursor] = useState(true)
    const [done, setDone] = useState(false)
    const lines = ["USE THE PRODUCT", "SHARE THE PRODUCT", "SHARE THE OPPORTUNITY"]

    useEffect(() => {
      if (done) return
      if (currentLine >= lines.length) { setDone(true); return }
      const currentText = lines[currentLine]
      if (currentChar < currentText.length) {
        const timeout = setTimeout(() => {
          setDisplayText(prev => prev + currentText[currentChar])
          setCurrentChar(prev => prev + 1)
        }, 80)
        return () => clearTimeout(timeout)
      } else {
        const timeout = setTimeout(() => {
          if (currentLine < lines.length - 1) {
            setDisplayText(prev => prev + "\n")
            setCurrentLine(prev => prev + 1)
            setCurrentChar(0)
          } else { setDone(true) }
        }, 400)
        return () => clearTimeout(timeout)
      }
    }, [currentChar, currentLine, done])

    useEffect(() => {
      const interval = setInterval(() => setShowCursor(prev => !prev), 500)
      return () => clearInterval(interval)
    }, [])

    return (
      <div style={{ backgroundColor: "#0d2b1d", borderRadius: "16px", padding: "32px 40px", marginBottom: "24px", border: "1px solid #1a4a2e" }}>
        <div style={{ fontFamily: "monospace", fontSize: "22px", fontWeight: "700", color: "#2db973", letterSpacing: "2px", lineHeight: "1.8", whiteSpace: "pre-line", minHeight: "120px" }}>
          {displayText}
          <span style={{ opacity: showCursor ? 1 : 0, color: "#2db973" }}>|</span>
        </div>
        <div style={{ marginTop: "16px", fontSize: "12px", color: "#4a7c5e", textTransform: "uppercase", letterSpacing: "1px" }}>
          NeoLife Ajetunmobi Office — Team Motto
        </div>
      </div>
    )
  }

  const LeaderboardView = () => {
    const top = leaderboard[0]
    const teamTotals = leaderboard.reduce(
      (acc, s) => ({ total: acc.total + (s.total || 0), converted: acc.converted + (s.converted || 0) }),
      { total: 0, converted: 0 }
    )
    const teamRate = teamTotals.total > 0 ? Math.round((teamTotals.converted / teamTotals.total) * 100) : 0

    const filtered = leaderboard.filter((s) => {
      const q = leaderboardSearch.trim().toLowerCase()
      if (!q) return true
      return s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    })

    const RankChange = ({ s }) => {
      const change = getRankChange(s)
      if (change === null || change === 0) return null
      if (change === "new") return (
        <span style={{ fontSize: "10px", backgroundColor: "#f0fdf4", color: "#15803d", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>NEW</span>
      )
      if (change > 0) return (
        <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "800", display: "flex", alignItems: "center" }}>↑{change}</span>
      )
      return (
        <span style={{ fontSize: "11px", color: "#dc2626", fontWeight: "800", display: "flex", alignItems: "center" }}>↓{Math.abs(change)}</span>
      )
    }

    return (
      <div className={`lb-root${leaderboardMounted ? " mounted" : ""}`} style={{ fontFamily: "sans-serif" }}>
        <style jsx>{`
          .lb-header {
            display: flex; align-items: flex-start;
            justify-content: space-between; flex-wrap: wrap;
            gap: 16px; margin-bottom: 24px;
          }
          .lb-eyebrow {
            font-size: 11px; color: #9ca3af;
            text-transform: uppercase; letter-spacing: 1px;
            font-weight: 700; margin-bottom: 8px;
          }
          .lb-total { display: flex; align-items: baseline; gap: 10px; }
          .lb-total-num { font-size: 40px; font-weight: 800; color: #0d2b1d; line-height: 1; }
          .lb-total-rate { font-size: 13px; font-weight: 700; color: #2db973; }
          .lb-total-sub { font-size: 13px; color: #9ca3af; margin-top: 6px; }
          .lb-top-card {
            display: flex; align-items: center; gap: 10px;
            background: #ffffff; border: 1px solid #e0d8ce;
            border-radius: 14px; padding: 10px 16px 10px 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }
          .lb-top-avatar {
            width: 40px; height: 40px; border-radius: 50%;
            background: #0d2b1d; color: #2db973;
            display: flex; align-items: center; justify-content: center;
            font-weight: 800; font-size: 14px; flex-shrink: 0;
          }
          .lb-top-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 700; }
          .lb-top-name { font-size: 14px; font-weight: 700; color: #0d2b1d; }
          .lb-search-row { display: flex; gap: 12px; margin-bottom: 20px; }
          .lb-search-input {
            flex: 1; padding: 13px 16px; background: #ffffff;
            border: 1px solid #e0d8ce; border-radius: 12px;
            font-size: 14px; color: #1a1a1a; outline: none; box-sizing: border-box;
          }
          .lb-search-input::placeholder { color: #9ca3af; }
          .lb-list { background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e0d8ce; }
          .lb-row {
            display: flex; align-items: center; gap: 14px;
            padding: 16px 20px; border-bottom: 1px solid #f0ebe3;
            opacity: 0; transform: translateY(8px);
            transition: opacity 0.4s ease, transform 0.4s ease, background 0.15s ease;
          }
          .lb-root.mounted .lb-row { opacity: 1; transform: translateY(0); }
          .lb-row:hover { background: #f8f5f0; }
          .lb-row:last-child { border-bottom: none; }
          .lb-badge-num {
            width: 38px; height: 38px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; font-weight: 800; color: #0d2b1d;
            background: #f0ebe3; border: 1px solid #e0d8ce; flex-shrink: 0;
          }
          .lb-badge-num.rank-1 {
            width: 42px; height: 42px; font-size: 17px; color: #6b4400;
            background: linear-gradient(135deg, #fde68a, #d97706);
            border: 1px solid #d97706; box-shadow: 0 4px 12px rgba(217,119,6,0.35);
          }
          .lb-badge-num.rank-2 {
            width: 40px; height: 40px; font-size: 16px; color: #374151;
            background: linear-gradient(135deg, #f1f2f4, #b6bac1);
            border: 1px solid #9ca3af; box-shadow: 0 4px 10px rgba(156,163,175,0.3);
          }
          .lb-badge-num.rank-3 {
            width: 40px; height: 40px; font-size: 16px; color: #5a3315;
            background: linear-gradient(135deg, #f0c48a, #cd7f32);
            border: 1px solid #cd7f32; box-shadow: 0 4px 10px rgba(205,127,50,0.3);
          }
          .lb-info { flex: 1; min-width: 0; }
          .lb-name-row { display: flex; align-items: center; gap: 6px; }
          .lb-name { font-size: 14px; font-weight: 700; color: #0d2b1d; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .lb-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
          .lb-count { text-align: right; flex-shrink: 0; }
          .lb-count-num { font-size: 18px; font-weight: 800; color: #0d2b1d; }
          .lb-count-label { font-size: 9px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 700; margin-top: 1px; }
          .lb-empty { color: #9ca3af; text-align: center; padding: 60px 0; background: #ffffff; border-radius: 14px; border: 1px solid #e0d8ce; }
          @media (max-width: 640px) {
            .lb-total-num { font-size: 32px; }
            .lb-top-card { width: 100%; }
          }
        `}</style>

        <div className="lb-header">
          <div>
            <div className="lb-eyebrow">Prospecting Leaderboard</div>
            <div className="lb-total">
              <div className="lb-total-num">{teamTotals.total.toLocaleString()}</div>
              {teamTotals.total > 0 && <div className="lb-total-rate">↑ {teamRate}% conversion</div>}
            </div>
            <div className="lb-total-sub">Total network prospects generated</div>
          </div>
          {top && (
            <div className="lb-top-card">
              <div className="lb-top-avatar">{initials(top.name)}</div>
              <div>
                <div className="lb-top-label">Top Performer</div>
                <div className="lb-top-name">{firstNameLast(top.name)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="lb-search-row">
          <input
            className="lb-search-input"
            placeholder="Search staff member..."
            value={leaderboardSearch}
            onChange={(e) => setLeaderboardSearch(e.target.value)}
          />
        </div>

        {leaderboard.length === 0 ? (
          <div className="lb-empty">No staff data yet.</div>
        ) : (
          <div className="lb-list">
            {filtered.map((s, i) => {
              const rank = leaderboard.indexOf(s) + 1
              return (
                <div key={s.id} className="lb-row" style={{ transitionDelay: `${Math.min(i, 8) * 40}ms` }}>
                  <div className={`lb-badge-num${rank <= 3 ? ` rank-${rank}` : ""}`}>{rank}</div>
                  <div className="lb-info">
                    <div className="lb-name-row">
                      <span className="lb-name">{s.name}</span>
                      <span className="lb-dot" style={{ background: s.hot > 0 ? "#dc2626" : "#2db973" }} />
                      <RankChange s={s} />
                    </div>
                  </div>
                  <div className="lb-count">
                    <div className="lb-count-num">{s.total}</div>
                    <div className="lb-count-label">Prospects</div>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
                No matches for "{leaderboardSearch}"
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0ebe3", fontFamily: "sans-serif", color: "#1a1a1a" }}>

      <div style={{ backgroundColor: "#0d2b1d", borderBottom: "1px solid #1a4a2e", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#2db973", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px", color: "#0d2b1d" }}>A</div>
          <div>
            <div style={{ fontWeight: "700", fontSize: "15px", color: "#ffffff" }}>Ajetunmobi Office</div>
            <div style={{ color: "#2db973", fontSize: "12px" }}>Staff Portal {currentUser && `— ${currentUser.name}`}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowNotifications(!showNotifications); markAllRead() }} style={{ backgroundColor: "#1a4a2e", border: "1px solid #2db97344", color: "#e8f5ee", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "18px", position: "relative" }}>
              🔔
              {unreadCount > 0 && <span style={{ position: "absolute", top: "-6px", right: "-6px", backgroundColor: "#2db973", color: "#0d2b1d", borderRadius: "50%", width: "18px", height: "18px", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>{unreadCount}</span>}
            </button>
            {showNotifications && (
              <div style={{ position: "absolute", right: 0, top: "48px", backgroundColor: "#ffffff", border: "1px solid #e0d8ce", borderRadius: "12px", width: "320px", zIndex: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
                <div style={{ padding: "16px", borderBottom: "1px solid #e0d8ce", fontWeight: "600", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#1a1a1a" }}>
                  <span>Notifications</span>
                  <button onClick={clearNotifications} style={{ background: "none", border: "none", color: "#dc2626", fontSize: "12px", cursor: "pointer" }}>Clear All</button>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: "20px", color: "#9ca3af", textAlign: "center", fontSize: "14px" }}>No notifications yet</div>
                ) : notifications.slice(0, 10).map(n => (
                  <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid #f0ebe3", fontSize: "13px", color: n.read ? "#9ca3af" : "#1a1a1a", backgroundColor: n.read ? "transparent" : "#f0fdf4" }}>
                    {n.message}
                    <div style={{ color: "#9ca3af", fontSize: "11px", marginTop: "4px" }}>{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login") }} style={{ backgroundColor: "#1a4a2e", border: "1px solid #2db97344", color: "#e8f5ee", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Logout</button>
        </div>
      </div>

      <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e0d8ce", padding: "0 32px", display: "flex", gap: "4px" }}>
        <button onClick={() => setActiveStaffTab("prospects")} style={{ padding: "12px 20px", border: "none", borderBottom: activeStaffTab === "prospects" ? "2px solid #2db973" : "2px solid transparent", cursor: "pointer", fontSize: "13px", fontWeight: "600", backgroundColor: "transparent", color: activeStaffTab === "prospects" ? "#0d2b1d" : "#6b7280" }}>My Prospects</button>
        <button onClick={() => { setActiveStaffTab("leaderboard"); setTyperKey(prev => prev + 1) }} style={{ padding: "12px 20px", border: "none", borderBottom: activeStaffTab === "leaderboard" ? "2px solid #2db973" : "2px solid transparent", cursor: "pointer", fontSize: "13px", fontWeight: "600", backgroundColor: "transparent", color: activeStaffTab === "leaderboard" ? "#0d2b1d" : "#6b7280" }}>🏆 Leaderboard</button>
      </div>

      <div style={activeStaffTab === "prospects" ? { padding: "32px", maxWidth: "820px", margin: "0 auto" } : { padding: "32px" }}>

        {activeStaffTab === "prospects" && (
          <>
            <div style={{ fontSize: "11px", color: "#2db973", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", fontWeight: "700" }}>New Entry</div>
            <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "700", color: "#0d2b1d" }}>Add New Prospect</h2>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 28px" }}>Fill in the details of the person you prospected</p>

            {success && <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "#15803d", fontSize: "14px", fontWeight: "500" }}>✅ {success}</div>}
            {error && <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "#dc2626", fontSize: "14px" }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ backgroundColor: "#ffffff", border: "1px solid #e0d8ce", borderRadius: "16px", padding: "28px", marginBottom: "32px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div><label style={labelStyle}>First Name *</label><input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" style={inputStyle} /></div>
                <div><label style={labelStyle}>Last Name *</label><input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" style={inputStyle} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div><label style={labelStyle}>Phone Number *</label><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08012345678" style={inputStyle} /></div>
                <div><label style={labelStyle}>Email Address</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" style={inputStyle} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div><label style={labelStyle}>Company / Organization</label><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="ABC Ltd" style={inputStyle} /></div>
                <div>
                  <label style={labelStyle}>Prospect Score</label>
                  <select value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="Hot">🔥 Hot</option>
                    <option value="Warm">⚡ Warm</option>
                    <option value="Cold">❄️ Cold</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Notes / Additional Info</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="How did you meet them? What are they interested in?" rows={4} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", backgroundColor: loading ? "#1a6b3f" : "#0d2b1d", color: "#2db973", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Submitting..." : "Add Prospect"}
              </button>
            </form>

            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e0d8ce", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: "700", color: "#0d2b1d" }}>My Prospects ({prospects.length})</h3>
              {fetchingProspects ? (
                <div style={{ color: "#9ca3af", textAlign: "center", padding: "30px 0" }}>Loading...</div>
              ) : prospects.length === 0 ? (
                <div style={{ color: "#9ca3af", textAlign: "center", padding: "30px 0" }}>You haven't added any prospects yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {prospects.map(p => (
                    <div key={p.id} style={{ backgroundColor: "#f0ebe3", border: "1px solid #e0d8ce", borderRadius: "10px", padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <div>
                          <div style={{ fontWeight: "700", color: "#0d2b1d", marginBottom: "2px" }}>{p.firstName} {p.lastName}</div>
                          <div style={{ color: "#4a5568", fontSize: "13px" }}>{p.phone} {p.company ? `• ${p.company}` : ""}</div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ backgroundColor: scoreColor(p.score) + "18", color: scoreColor(p.score), padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>{p.score}</span>
                          <div style={{ color: "#9ca3af", fontSize: "11px" }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      {p.notes && <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "12px", fontStyle: "italic" }}>"{p.notes}"</div>}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>Status:</span>
                          <select value={p.status} onChange={(e) => handleStatusUpdate(p.id, e.target.value)} style={{ backgroundColor: statusColor(p.status) + "18", color: statusColor(p.status), padding: "4px 10px", borderRadius: "20px", fontSize: "12px", border: "none", cursor: "pointer", outline: "none", fontWeight: "600" }}>
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Interested">Interested</option>
                            <option value="Converted">Converted</option>
                            <option value="Lost">Lost</option>
                          </select>
                        </div>
                        <button onClick={() => openWhatsApp(p)} style={{ backgroundColor: "#25d366", color: "#ffffff", border: "none", padding: "7px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          Follow Up on WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeStaffTab === "leaderboard" && (
          <>
            <TypewriterBanner key={typerKey} />
            <LeaderboardView />
          </>
        )}
      </div>
      <NotificationSound />
      <ChatBot />
    </div>
  )
}