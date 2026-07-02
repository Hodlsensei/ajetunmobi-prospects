"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import NotificationSound from "../components/NotificationSound"
import ChatBot from "../components/ChatBot"

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [prospects, setProspects] = useState([])
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [requests, setRequests] = useState([])
  const [staffList, setStaffList] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [approveModal, setApproveModal] = useState(null)
  const [approvePassword, setApprovePassword] = useState("")
  const [approveLoading, setApproveLoading] = useState(false)
  const [addStaffForm, setAddStaffForm] = useState({ name: "", email: "", password: "" })
  const [addStaffLoading, setAddStaffLoading] = useState(false)
  const [addStaffSuccess, setAddStaffSuccess] = useState("")
  const [addStaffError, setAddStaffError] = useState("")
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
    const res = await fetch("/api/leaderboard")
    const data = await res.json()
    if (data.leaderboard) setLeaderboard(data.leaderboard)
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

  const getWhatsAppMessage = (prospect) => {
    return `Hello ${prospect.firstName},`
  }

  const openWhatsApp = (p) => {
    const message = getWhatsAppMessage(p)
    const phone = p.phone.replace(/\D/g, "")
    const formattedPhone = phone.startsWith("0") ? "234" + phone.slice(1) : phone
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, "_blank")
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
    width: "100%",
    padding: "11px 14px",
    backgroundColor: "#f0ebe3",
    border: "1px solid #d0c8be",
    borderRadius: "8px",
    color: "#1a1a1a",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box"
  }

  const tabStyle = (tab) => ({
    padding: "12px 20px",
    border: "none",
    borderBottom: activeTab === tab ? "2px solid #2db973" : "2px solid transparent",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    backgroundColor: "transparent",
    color: activeTab === tab ? "#0d2b1d" : "#6b7280",
  })

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0ebe3", fontFamily: "sans-serif", color: "#1a1a1a" }}>

      {/* Approve Modal */}
      {approveModal && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300
        }}>
          <div style={{
            backgroundColor: "#ffffff", border: "1px solid #e0d8ce",
            borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "400px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", color: "#1a1a1a" }}>Approve Request</h3>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 20px" }}>
              Set a password for <strong style={{ color: "#0d2b1d" }}>{approveModal.name}</strong>
            </p>
            <input
              type="password"
              placeholder="Set password for staff"
              value={approvePassword}
              onChange={(e) => setApprovePassword(e.target.value)}
              style={{ ...inputStyle, marginBottom: "16px" }}
            />
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={submitApprove} disabled={approveLoading} style={{
                flex: 1, padding: "11px", backgroundColor: "#0d2b1d",
                color: "#2db973", border: "none", borderRadius: "8px",
                cursor: "pointer", fontWeight: "700"
              }}>
                {approveLoading ? "Approving..." : "Approve"}
              </button>
              <button onClick={() => setApproveModal(null)} style={{
                flex: 1, padding: "11px", backgroundColor: "#f0ebe3",
                color: "#6b7280", border: "1px solid #d0c8be", borderRadius: "8px", cursor: "pointer"
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <div style={{
        backgroundColor: "#0d2b1d", borderBottom: "1px solid #1a4a2e",
        padding: "16px 32px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            backgroundColor: "#2db973", display: "flex", alignItems: "center",
            justifyContent: "center", fontWeight: "bold", fontSize: "16px", color: "#0d2b1d"
          }}>A</div>
          <div>
            <div style={{ fontWeight: "700", fontSize: "15px", color: "#ffffff" }}>Ajetunmobi Office</div>
            <div style={{ color: "#2db973", fontSize: "12px" }}>Admin Dashboard</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); markAllRead() }}
              style={{
                backgroundColor: "#1a4a2e", border: "1px solid #2db97344",
                color: "#e8f5ee", padding: "8px 12px", borderRadius: "8px",
                cursor: "pointer", fontSize: "18px", position: "relative"
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: "-6px", right: "-6px",
                  backgroundColor: "#2db973", color: "#0d2b1d", borderRadius: "50%",
                  width: "18px", height: "18px", fontSize: "11px",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold"
                }}>{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div style={{
                position: "absolute", right: 0, top: "48px",
                backgroundColor: "#ffffff", border: "1px solid #e0d8ce",
                borderRadius: "12px", width: "320px", zIndex: 200,
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
              }}>
                <div style={{
                  padding: "16px", borderBottom: "1px solid #e0d8ce",
                  fontWeight: "600", display: "flex",
                  justifyContent: "space-between", alignItems: "center", color: "#1a1a1a"
                }}>
                  <span>Notifications</span>
                  <button onClick={clearNotifications} style={{
                    background: "none", border: "none",
                    color: "#dc2626", fontSize: "12px", cursor: "pointer"
                  }}>Clear All</button>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: "20px", color: "#9ca3af", textAlign: "center", fontSize: "14px" }}>
                    No notifications yet
                  </div>
                ) : notifications.slice(0, 10).map(n => (
                  <div key={n.id} style={{
                    padding: "12px 16px", borderBottom: "1px solid #f0ebe3",
                    fontSize: "13px", color: n.read ? "#9ca3af" : "#1a1a1a",
                    backgroundColor: n.read ? "transparent" : "#f0fdf4"
                  }}>
                    {n.message}
                    <div style={{ color: "#9ca3af", fontSize: "11px", marginTop: "4px" }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" })
              router.push("/login")
            }}
            style={{
              backgroundColor: "#1a4a2e", border: "1px solid #2db97344",
              color: "#e8f5ee", padding: "8px 16px", borderRadius: "8px",
              cursor: "pointer", fontSize: "13px"
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        backgroundColor: "#ffffff", borderBottom: "1px solid #e0d8ce",
        padding: "0 32px", display: "flex", gap: "4px"
      }}>
        <button style={tabStyle("dashboard")} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button style={tabStyle("staff")} onClick={() => setActiveTab("staff")}>
          Manage Staff
          {pendingRequests > 0 && (
            <span style={{
              marginLeft: "8px", backgroundColor: "#dc2626", color: "white",
              borderRadius: "50%", width: "18px", height: "18px", fontSize: "11px",
              display: "inline-flex", alignItems: "center", justifyContent: "center"
            }}>{pendingRequests}</span>
          )}
        </button>
        <button style={tabStyle("leaderboard")} onClick={() => setActiveTab("leaderboard")}>
          🏆 Leaderboard
        </button>
      </div>

      <div style={{ padding: "32px" }}>

        {/* DASHBOARD TAB */}
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
                <div key={i} style={{
                  backgroundColor: "#ffffff", border: "1px solid #e0d8ce",
                  borderRadius: "12px", padding: "20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}>
                  <div style={{ color: "#6b7280", fontSize: "11px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>{stat.label}</div>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div style={{
              backgroundColor: "#ffffff", border: "1px solid #e0d8ce",
              borderRadius: "12px", padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h3 style={{ margin: "0", fontSize: "15px", fontWeight: "700", color: "#0d2b1d" }}>All Prospects</h3>
                <span style={{ fontSize: "11px", color: "#6b7280", backgroundColor: "#f0ebe3", padding: "3px 10px", borderRadius: "20px", fontWeight: "600" }}>
                  {prospects.length} total
                </span>
              </div>

              {prospects.length === 0 ? (
                <div style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>No prospects yet.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e0d8ce" }}>
                        {["Name", "Phone", "Company", "Score", "Status", "Added By", "Date", "WhatsApp", "Action"].map(h => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#6b7280", fontWeight: "600", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {prospects.map(p => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #f0ebe3" }}>
                          <td style={{ padding: "12px", color: "#0d2b1d", fontWeight: "600" }}>{p.firstName} {p.lastName}</td>
                          <td style={{ padding: "12px", color: "#4a5568" }}>{p.phone}</td>
                          <td style={{ padding: "12px", color: "#4a5568" }}>{p.company || "—"}</td>
                          <td style={{ padding: "12px" }}>
                            <span style={{
                              backgroundColor: scoreColor(p.score) + "18",
                              color: scoreColor(p.score),
                              padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "600"
                            }}>{p.score}</span>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <span style={{
                              backgroundColor: statusColor(p.status) + "18",
                              color: statusColor(p.status),
                              padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "600"
                            }}>{p.status}</span>
                          </td>
                          <td style={{ padding: "12px", color: "#4a5568" }}>{p.addedBy?.name}</td>
                          <td style={{ padding: "12px", color: "#9ca3af", fontSize: "12px" }}>
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <button
                              onClick={() => openWhatsApp(p)}
                              style={{
                                backgroundColor: "#25d366", color: "#ffffff",
                                border: "none", padding: "6px 12px",
                                borderRadius: "8px", cursor: "pointer",
                                fontSize: "12px", fontWeight: "700",
                                display: "flex", alignItems: "center", gap: "5px",
                                whiteSpace: "nowrap"
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              Follow Up
                            </button>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <button onClick={() => deleteProspect(p.id)} style={{
                              backgroundColor: "#fef2f2", color: "#dc2626",
                              border: "1px solid #fecaca", padding: "4px 10px",
                              borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "600"
                            }}>
                              Delete
                            </button>
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

        {/* MANAGE STAFF TAB */}
        {activeTab === "staff" && (
          <>
            <div style={{
              backgroundColor: "#ffffff", border: "1px solid #e0d8ce",
              borderRadius: "12px", padding: "24px", marginBottom: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: "700", color: "#0d2b1d" }}>
                Access Requests
              </h3>
              {requests.length === 0 ? (
                <div style={{ color: "#9ca3af", textAlign: "center", padding: "20px 0", fontSize: "14px" }}>
                  No access requests yet
                </div>
              ) : requests.map(r => (
                <div key={r.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px", backgroundColor: "#f0ebe3", borderRadius: "10px",
                  marginBottom: "10px", border: "1px solid #e0d8ce"
                }}>
                  <div>
                    <div style={{ fontWeight: "600", marginBottom: "2px", color: "#0d2b1d" }}>{r.name}</div>
                    <div style={{ color: "#4a5568", fontSize: "13px" }}>{r.email}</div>
                    <div style={{ color: "#9ca3af", fontSize: "12px", marginTop: "2px" }}>
                      {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {r.status === "Pending" ? (
                      <>
                        <button onClick={() => handleApprove(r)} style={{
                          padding: "7px 16px", backgroundColor: "#0d2b1d",
                          color: "#2db973", border: "none", borderRadius: "8px",
                          cursor: "pointer", fontSize: "13px", fontWeight: "600"
                        }}>Approve</button>
                        <button onClick={() => handleReject(r.id)} style={{
                          padding: "7px 16px", backgroundColor: "#fef2f2",
                          color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px",
                          cursor: "pointer", fontSize: "13px", fontWeight: "600"
                        }}>Reject</button>
                      </>
                    ) : (
                      <span style={{
                        padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                        backgroundColor: r.status === "Approved" ? "#f0fdf4" : "#fef2f2",
                        color: r.status === "Approved" ? "#15803d" : "#dc2626"
                      }}>{r.status}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              backgroundColor: "#ffffff", border: "1px solid #e0d8ce",
              borderRadius: "12px", padding: "24px", marginBottom: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: "700", color: "#0d2b1d" }}>
                Add Staff Directly
              </h3>
              {addStaffSuccess && (
                <div style={{
                  backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
                  borderRadius: "8px", padding: "12px 16px", marginBottom: "16px",
                  color: "#15803d", fontSize: "14px"
                }}>{addStaffSuccess}</div>
              )}
              {addStaffError && (
                <div style={{
                  backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: "8px", padding: "12px 16px", marginBottom: "16px",
                  color: "#dc2626", fontSize: "14px"
                }}>{addStaffError}</div>
              )}
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
                <button type="submit" disabled={addStaffLoading} style={{
                  padding: "11px 24px", backgroundColor: "#0d2b1d",
                  color: "#2db973", border: "none", borderRadius: "8px",
                  cursor: "pointer", fontWeight: "700", fontSize: "14px"
                }}>
                  {addStaffLoading ? "Adding..." : "Add Staff"}
                </button>
              </form>
            </div>

            <div style={{
              backgroundColor: "#ffffff", border: "1px solid #e0d8ce",
              borderRadius: "12px", padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: "700", color: "#0d2b1d" }}>
                All Staff ({staffList.length})
              </h3>
              {staffList.length === 0 ? (
                <div style={{ color: "#9ca3af", textAlign: "center", padding: "20px 0", fontSize: "14px" }}>
                  No staff members yet
                </div>
              ) : staffList.map(s => (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px", backgroundColor: "#f0ebe3", borderRadius: "10px",
                  marginBottom: "10px", border: "1px solid #e0d8ce"
                }}>
                  <div>
                    <div style={{ fontWeight: "600", marginBottom: "2px", color: "#0d2b1d" }}>{s.name}</div>
                    <div style={{ color: "#4a5568", fontSize: "13px" }}>{s.email}</div>
                    <div style={{ color: "#9ca3af", fontSize: "12px", marginTop: "2px" }}>
                      {s._count?.prospects || 0} prospects added
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                      backgroundColor: s.active ? "#f0fdf4" : "#fef2f2",
                      color: s.active ? "#15803d" : "#dc2626"
                    }}>
                      {s.active ? "Active" : "Inactive"}
                    </span>
                    <button onClick={() => toggleStaffActive(s.id, s.active)} style={{
                      padding: "7px 16px",
                      backgroundColor: s.active ? "#fef2f2" : "#f0fdf4",
                      color: s.active ? "#dc2626" : "#15803d",
                      border: `1px solid ${s.active ? "#fecaca" : "#bbf7d0"}`,
                      borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600"
                    }}>
                      {s.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === "leaderboard" && (
          <>
            <div style={{ fontSize: "11px", color: "#2db973", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", fontWeight: "700" }}>Rankings</div>
            <h2 style={{ margin: "0 0 24px", fontSize: "20px", fontWeight: "700", color: "#0d2b1d" }}>Staff Leaderboard</h2>

            {leaderboard.length === 0 ? (
              <div style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>No staff data yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {leaderboard.map((s, index) => (
                  <div key={s.id} style={{
                    backgroundColor: "#ffffff",
                    border: index === 0 ? "2px solid #2db973" : "1px solid #e0d8ce",
                    borderRadius: "16px", padding: "24px",
                    display: "flex", alignItems: "center", gap: "20px",
                    boxShadow: index === 0 ? "0 4px 16px rgba(45,185,115,0.15)" : "0 2px 8px rgba(0,0,0,0.04)"
                  }}>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "50%",
                      backgroundColor: index === 0 ? "#2db973" : index === 1 ? "#d97706" : index === 2 ? "#6b7280" : "#f0ebe3",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: index === 0 ? "22px" : "18px", fontWeight: "700",
                      color: index < 3 ? "white" : "#9ca3af", flexShrink: 0
                    }}>
                      {index === 0 ? "🏆" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "700", fontSize: "15px", color: "#0d2b1d", marginBottom: "2px" }}>
                        {s.name}
                        {index === 0 && (
                          <span style={{
                            marginLeft: "8px", backgroundColor: "#f0fdf4", color: "#15803d",
                            fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: "600"
                          }}>Top Performer</span>
                        )}
                      </div>
                      <div style={{ color: "#6b7280", fontSize: "13px" }}>{s.email}</div>
                    </div>
                    <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "22px", fontWeight: "700", color: "#0d2b1d" }}>{s.total}</div>
                        <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px" }}>Total</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "22px", fontWeight: "700", color: "#2db973" }}>{s.converted}</div>
                        <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px" }}>Converted</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "22px", fontWeight: "700", color: "#d97706" }}>{s.conversionRate}%</div>
                        <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px" }}>Rate</div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ backgroundColor: "#dc262618", color: "#dc2626", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>🔥 {s.hot}</span>
                        <span style={{ backgroundColor: "#d9770618", color: "#d97706", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>⚡ {s.warm}</span>
                        <span style={{ backgroundColor: "#2563eb18", color: "#2563eb", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>❄️ {s.cold}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <NotificationSound />
      <ChatBot />
    </div>
  )
}