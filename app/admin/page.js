"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import ChatBot from "../components/ChatBot"
import NotificationSound from "../components/NotificationSound"

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase()

const firstNameLast = (name = "") => {
  const parts = name.split(" ")
  return `${parts[0]} ${parts[1]?.[0] ? parts[1][0] + "." : ""}`.trim()
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [prospects, setProspects] = useState([])
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [requests, setRequests] = useState([])
  const [staffList, setStaffList] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [prevLeaderboard, setPrevLeaderboard] = useState([])
  const [leaderboardMounted, setLeaderboardMounted] = useState(false)
  const [leaderboardSearch, setLeaderboardSearch] = useState("")
  const [approveModal, setApproveModal] = useState(null)
  const [approvePassword, setApprovePassword] = useState("")
  const [approveLoading, setApproveLoading] = useState(false)
  const [addStaffForm, setAddStaffForm] = useState({ name: "", email: "", password: "" })
  const [addStaffLoading, setAddStaffLoading] = useState(false)
  const [addStaffSuccess, setAddStaffSuccess] = useState("")
  const [addStaffError, setAddStaffError] = useState("")
  const [typerKey, setTyperKey] = useState(0)
  const [stats, setStats] = useState({
    total: 0, newThisWeek: 0, converted: 0, followUpsDue: 0
  })

  useEffect(() => {
    fetchProspects()
    fetchNotifications()
    fetchRequests()
    fetchStaff()
    fetchLeaderboard()
  }, [])

  useEffect(() => {
    if (activeTab === "leaderboard") {
      setLeaderboardMounted(false)
      const t = setTimeout(() => setLeaderboardMounted(true), 60)
      return () => clearTimeout(t)
    }
  }, [activeTab, leaderboard])

  const fetchProspects = async () => {
    const res = await fetch("/api/prospects")
    const data = await res.json()
    if (data.prospects) {
      setProspects(data.prospects)
      const now = new Date()
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
      setStats({
        total: data.prospects.length,
        newThisWeek: data.prospects.filter(p => new Date(p.createdAt) > weekAgo).length,
        converted: data.prospects.filter(p => p.status === "Converted").length,
        followUpsDue: data.prospects.filter(p => p.status === "New" || p.status === "Contacted").length
      })
    }
  }

  const fetchNotifications = async () => {
    await fetch("/api/reminders/auto")
    const res = await fetch("/api/notifications")
    const data = await res.json()
    if (data.notifications) setNotifications(data.notifications)
  }

  const fetchRequests = async () => {
    const res = await fetch("/api/access-request")
    const data = await res.json()
    if (data.requests) setRequests(data.requests)
  }

  const fetchStaff = async () => {
    const res = await fetch("/api/staff")
    const data = await res.json()
    if (data.staff) setStaffList(data.staff)
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

  const deleteProspect = async (id) => {
    if (!confirm("Are you sure you want to delete this prospect?")) return
    await fetch(`/api/prospects/${id}`, { method: "DELETE" })
    fetchProspects()
  }

  const handleApprove = async (request) => {
    setApproveModal(request)
    setApprovePassword("")
  }

  const submitApprove = async () => {
    if (!approvePassword) return
    setApproveLoading(true)
    await fetch(`/api/access-request/${approveModal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", password: approvePassword })
    })
    setApproveModal(null)
    setApproveLoading(false)
    fetchRequests()
    fetchStaff()
  }

  const handleReject = async (id) => {
    await fetch(`/api/access-request/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" })
    })
    fetchRequests()
  }

  const handleAddStaff = async (e) => {
    e.preventDefault()
    setAddStaffLoading(true)
    setAddStaffSuccess("")
    setAddStaffError("")
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addStaffForm)
    })
    const data = await res.json()
    if (!res.ok) {
      setAddStaffError(data.error || "Failed to add staff")
    } else {
      setAddStaffSuccess("Staff account created successfully!")
      setAddStaffForm({ name: "", email: "", password: "" })
      fetchStaff()
    }
    setAddStaffLoading(false)
  }

  const toggleStaffActive = async (id, active) => {
    await fetch(`/api/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active })
    })
    fetchStaff()
  }

  const getWhatsAppMessage = (p) => `Hello ${p.firstName},`

  const openWhatsApp = (p) => {
    const message = getWhatsAppMessage(p)
    const phone = p.phone.replace(/\D/g, "")
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

  const unreadCount = notifications.filter(n => !n.read).length
  const pendingRequests = requests.filter(r => r.status === "Pending").length

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

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    backgroundColor: "#f0ebe3", border: "1px solid #d0c8be",
    borderRadius: "8px", color: "#1a1a1a", fontSize: "14px",
    outline: "none", boxSizing: "border-box"
  }

  const tabStyle = (tab) => ({
    padding: "12px 20px", border: "none",
    borderBottom: activeTab === tab ? "2px solid #2db973" : "2px solid transparent",
    cursor: "pointer", fontSize: "13px", fontWeight: "600",
    backgroundColor: "transparent",
    color: activeTab === tab ? "#0d2b1d" : "#6b7280",
  })

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
      <div style={{
        backgroundColor: "#0d2b1d", borderRadius: "16px",
        padding: "32px 40px", marginBottom: "24px",
        border: "1px solid #1a4a2e"
      }}>
        <div style={{
          fontFamily: "monospace", fontSize: "22px", fontWeight: "700",
          color: "#2db973", letterSpacing: "2px", lineHeight: "1.8",
          whiteSpace: "pre-line", minHeight: "120px"
        }}>
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
        <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "800", display: "flex", alignItems: "center", gap: "1px" }}>
          ↑{change}
        </span>
      )
      return (
        <span style={{ fontSize: "11px", color: "#dc2626", fontWeight: "800", display: "flex", alignItems: "center", gap: "1px" }}>
          ↓{Math.abs(change)}
        </span>
      )
    }

    return (
      <div className={`lb-root${leaderboardMounted ? " mounted" : ""}`}>
        <style jsx>{`
          .lb-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 24px;
          }
          .lb-eyebrow {
            font-size: 11px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .lb-total {
            display: flex;
            align-items: baseline;
            gap: 10px;
          }
          .lb-total-num {
            font-size: 40px;
            font-weight: 800;
            color: #0d2b1d;
            line-height: 1;
          }
          .lb-total-rate {
            font-size: 13px;
            font-weight: 700;
            color: #2db973;
          }
          .lb-total-sub {
            font-size: 13px;
            color: #9ca3af;
            margin-top: 6px;
          }
          .lb-top-card {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #ffffff;
            border: 1px solid #e0d8ce;
            border-radius: 14px;
            padding: 10px 16px 10px 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }
          .lb-top-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #0d2b1d;
            color: #2db973;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 14px;
            flex-shrink: 0;
          }
          .lb-top-label {
            font-size: 10px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            font-weight: 700;
          }
          .lb-top-name {
            font-size: 14px;
            font-weight: 700;
            color: #0d2b1d;
          }
          .lb-search-row {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
          }
          .lb-search-input {
            flex: 1;
            padding: 13px 16px;
            background: #ffffff;
            border: 1px solid #e0d8ce;
            border-radius: 12px;
            font-size: 14px;
            color: #1a1a1a;
            outline: none;
            box-sizing: border-box;
          }
          .lb-search-input::placeholder { color: #9ca3af; }
          .lb-list {
            background: #ffffff;
            border-radius: 14px;
            overflow: hidden;
            border: 1px solid #e0d8ce;
          }
          .lb-row {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 16px 20px;
            border-bottom: 1px solid #f0ebe3;
            opacity: 0;
            transform: translateY(8px);
            transition: opacity 0.4s ease, transform 0.4s ease, background 0.15s ease;
          }
          .lb-root.mounted .lb-row { opacity: 1; transform: translateY(0); }
          .lb-row:hover { background: #f8f5f0; }
          .lb-row:last-child { border-bottom: none; }
          .lb-badge-num {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 800;
            color: #0d2b1d;
            background: #f0ebe3;
            border: 1px solid #e0d8ce;
            flex-shrink: 0;
          }
          .lb-badge-num.rank-1 {
            width: 42px; height: 42px; font-size: 17px;
            color: #6b4400;
            background: linear-gradient(135deg, #fde68a, #d97706);
            border: 1px solid #d97706;
            box-shadow: 0 4px 12px rgba(217,119,6,0.35);
          }
          .lb-badge-num.rank-2 {
            width: 40px; height: 40px; font-size: 16px;
            color: #374151;
            background: linear-gradient(135deg, #f1f2f4, #b6bac1);
            border: 1px solid #9ca3af;
            box-shadow: 0 4px 10px rgba(156,163,175,0.3);
          }
          .lb-badge-num.rank-3 {
            width: 40px; height: 40px; font-size: 16px;
            color: #5a3315;
            background: linear-gradient(135deg, #f0c48a, #cd7f32);
            border: 1px solid #cd7f32;
            box-shadow: 0 4px 10px rgba(205,127,50,0.3);
          }
          .lb-info { flex: 1; min-width: 0; }
          .lb-name-row { display: flex; align-items: center; gap: 6px; }
          .lb-name {
            font-size: 14px; font-weight: 700; color: #0d2b1d;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .lb-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
          .lb-count { text-align: right; flex-shrink: 0; }
          .lb-count-num { font-size: 18px; font-weight: 800; color: #0d2b1d; }
          .lb-count-label {
            font-size: 9px; color: #9ca3af;
            text-transform: uppercase; letter-spacing: 0.6px;
            font-weight: 700; margin-top: 1px;
          }
          .lb-empty {
            color: #9ca3af; text-align: center; padding: 60px 0;
            background: #ffffff; border-radius: 14px; border: 1px solid #e0d8ce;
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

      {approveModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e0d8ce", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "400px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", color: "#1a1a1a" }}>Approve Request</h3>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 20px" }}>
              Set a password for <strong style={{ color: "#0d2b1d" }}>{approveModal.name}</strong>
            </p>
            <input type="password" placeholder="Set password for staff" value={approvePassword} onChange={(e) => setApprovePassword(e.target.value)} style={{ ...inputStyle, marginBottom: "16px" }} />
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={submitApprove} disabled={approveLoading} style={{ flex: 1, padding: "11px", backgroundColor: "#0d2b1d", color: "#2db973", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>
                {approveLoading ? "Approving..." : "Approve"}
              </button>
              <button onClick={() => setApproveModal(null)} style={{ flex: 1, padding: "11px", backgroundColor: "#f0ebe3", color: "#6b7280", border: "1px solid #d0c8be", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: "#0d2b1d", borderBottom: "1px solid #1a4a2e", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#2db973", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px", color: "#0d2b1d" }}>A</div>
          <div>
            <div style={{ fontWeight: "700", fontSize: "15px", color: "#ffffff" }}>Ajetunmobi Office</div>
            <div style={{ color: "#2db973", fontSize: "12px" }}>Admin Dashboard</div>
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
        <button style={tabStyle("dashboard")} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button style={tabStyle("staff")} onClick={() => setActiveTab("staff")}>
          Manage Staff
          {pendingRequests > 0 && <span style={{ marginLeft: "8px", backgroundColor: "#dc2626", color: "white", borderRadius: "50%", width: "18px", height: "18px", fontSize: "11px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{pendingRequests}</span>}
        </button>
        <button style={tabStyle("leaderboard")} onClick={() => { setActiveTab("leaderboard"); setTyperKey(prev => prev + 1) }}>🏆 Leaderboard</button>
      </div>

      <div style={{ padding: "32px" }}>
        {activeTab === "dashboard" && (
          <>
            <div style={{ fontSize: "11px", color: "#2db973", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", fontWeight: "700" }}>Overview</div>
            <h2 style={{ margin: "0 0 24px", fontSize: "20px", fontWeight: "700", color: "#0d2b1d" }}>This week at a glance</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
              {[
                { label: "Total Prospects", value: stats.total, color: "#0d2b1d" },
                { label: "New This Week", value: stats.newThisWeek, color: "#2db973" },
                { label: "Converted", value: stats.converted, color: "#1d4ed8" },
                { label: "Follow Ups Due", value: stats.followUpsDue, color: "#d97706" },
              ].map((stat, i) => (
                <div key={i} style={{ backgroundColor: "#ffffff", border: "1px solid #e0d8ce", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ color: "#6b7280", fontSize: "11px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>{stat.label}</div>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e0d8ce", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700", color: "#0d2b1d" }}>All Prospects</h3>
                <span style={{ fontSize: "11px", color: "#6b7280", backgroundColor: "#f0ebe3", padding: "3px 10px", borderRadius: "20px", fontWeight: "600" }}>{prospects.length} total</span>
              </div>
              {prospects.length === 0 ? (
                <div style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>No prospects yet.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e0d8ce" }}>
                        {["Name", "Phone", "Company", "Score", "Status", "Added By", "Date", "WhatsApp", "Action"].map(h => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#6b7280", fontWeight: "600", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {prospects.map(p => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #f0ebe3" }}>
                          <td style={{ padding: "12px", color: "#0d2b1d", fontWeight: "600" }}>{p.firstName} {p.lastName}</td>
                          <td style={{ padding: "12px", color: "#4a5568" }}>{p.phone}</td>
                          <td style={{ padding: "12px", color: "#4a5568" }}>{p.company || "—"}</td>
                          <td style={{ padding: "12px" }}><span style={{ backgroundColor: scoreColor(p.score) + "18", color: scoreColor(p.score), padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>{p.score}</span></td>
                          <td style={{ padding: "12px" }}><span style={{ backgroundColor: statusColor(p.status) + "18", color: statusColor(p.status), padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>{p.status}</span></td>
                          <td style={{ padding: "12px", color: "#4a5568" }}>{p.addedBy?.name}</td>
                          <td style={{ padding: "12px", color: "#9ca3af", fontSize: "12px" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: "12px" }}>
                            <button onClick={() => openWhatsApp(p)} style={{ backgroundColor: "#25d366", color: "#ffffff", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              Follow Up
                            </button>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <button onClick={() => deleteProspect(p.id)} style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "staff" && (
          <>
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e0d8ce", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: "700", color: "#0d2b1d" }}>Access Requests</h3>
              {requests.length === 0 ? (
                <div style={{ color: "#9ca3af", textAlign: "center", padding: "20px 0", fontSize: "14px" }}>No access requests yet</div>
              ) : requests.map(r => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", backgroundColor: "#f0ebe3", borderRadius: "10px", marginBottom: "10px", border: "1px solid #e0d8ce" }}>
                  <div>
                    <div style={{ fontWeight: "600", marginBottom: "2px", color: "#0d2b1d" }}>{r.name}</div>
                    <div style={{ color: "#4a5568", fontSize: "13px" }}>{r.email}</div>
                    <div style={{ color: "#9ca3af", fontSize: "12px", marginTop: "2px" }}>{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {r.status === "Pending" ? (
                      <>
                        <button onClick={() => handleApprove(r)} style={{ padding: "7px 16px", backgroundColor: "#0d2b1d", color: "#2db973", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>Approve</button>
                        <button onClick={() => handleReject(r.id)} style={{ padding: "7px 16px", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>Reject</button>
                      </>
                    ) : (
                      <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: r.status === "Approved" ? "#f0fdf4" : "#fef2f2", color: r.status === "Approved" ? "#15803d" : "#dc2626" }}>{r.status}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e0d8ce", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: "700", color: "#0d2b1d" }}>Add Staff Directly</h3>
              {addStaffSuccess && <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", color: "#15803d", fontSize: "14px" }}>{addStaffSuccess}</div>}
              {addStaffError && <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", color: "#dc2626", fontSize: "14px" }}>{addStaffError}</div>}
              <form onSubmit={handleAddStaff}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ color: "#6b7280", fontSize: "12px", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px", fontWeight: "600" }}>Full Name</label>
                    <input required value={addStaffForm.name} onChange={(e) => setAddStaffForm({ ...addStaffForm, name: e.target.value })} placeholder="John Adeyemi" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ color: "#6b7280", fontSize: "12px", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px", fontWeight: "600" }}>Email</label>
                    <input required type="email" value={addStaffForm.email} onChange={(e) => setAddStaffForm({ ...addStaffForm, email: e.target.value })} placeholder="john@ajetunmobi.com" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ color: "#6b7280", fontSize: "12px", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px", fontWeight: "600" }}>Password</label>
                    <input required type="password" value={addStaffForm.password} onChange={(e) => setAddStaffForm({ ...addStaffForm, password: e.target.value })} placeholder="Set password" style={inputStyle} />
                  </div>
                </div>
                <button type="submit" disabled={addStaffLoading} style={{ padding: "11px 24px", backgroundColor: "#0d2b1d", color: "#2db973", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
                  {addStaffLoading ? "Adding..." : "Add Staff"}
                </button>
              </form>
            </div>

            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e0d8ce", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: "700", color: "#0d2b1d" }}>All Staff ({staffList.length})</h3>
              {staffList.length === 0 ? (
                <div style={{ color: "#9ca3af", textAlign: "center", padding: "20px 0", fontSize: "14px" }}>No staff members yet</div>
              ) : staffList.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", backgroundColor: "#f0ebe3", borderRadius: "10px", marginBottom: "10px", border: "1px solid #e0d8ce" }}>
                  <div>
                    <div style={{ fontWeight: "600", marginBottom: "2px", color: "#0d2b1d" }}>{s.name}</div>
                    <div style={{ color: "#4a5568", fontSize: "13px" }}>{s.email}</div>
                    <div style={{ color: "#9ca3af", fontSize: "12px", marginTop: "2px" }}>{s._count?.prospects || 0} prospects added</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: s.active ? "#f0fdf4" : "#fef2f2", color: s.active ? "#15803d" : "#dc2626" }}>
                      {s.active ? "Active" : "Inactive"}
                    </span>
                    <button onClick={() => toggleStaffActive(s.id, s.active)} style={{ padding: "7px 16px", backgroundColor: s.active ? "#fef2f2" : "#f0fdf4", color: s.active ? "#dc2626" : "#15803d", border: `1px solid ${s.active ? "#fecaca" : "#bbf7d0"}`, borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                      {s.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "leaderboard" && (
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