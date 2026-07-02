"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import NotificationSound from "../components/NotificationSound"
import ChatBot from "../components/ChatBot"

export default function StaffDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(null)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    company: "",
    notes: "",
    score: "Warm"
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [prospects, setProspects] = useState([])
  const [fetchingProspects, setFetchingProspects] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    fetchCurrentUser()
    fetchMyProspects()
    fetchNotifications()
  }, [])

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
      setForm({
        firstName: "", lastName: "", phone: "",
        email: "", company: "", notes: "", score: "Warm"
      })
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

  const getWhatsAppMessage = (prospect) => {
    return `Hello ${prospect.firstName},`
  }

  const openWhatsApp = (prospect) => {
    const message = getWhatsAppMessage(prospect)
    const phone = prospect.phone.replace(/\D/g, "")
    const formattedPhone = phone.startsWith("0") ? "234" + phone.slice(1) : phone
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, "_blank")
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

  const labelStyle = {
    color: "#6b7280",
    fontSize: "12px",
    display: "block",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    fontWeight: "600"
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0ebe3", fontFamily: "sans-serif", color: "#1a1a1a" }}>

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
            <div style={{ color: "#2db973", fontSize: "12px" }}>
              Staff Portal {currentUser && `— ${currentUser.name}`}
            </div>
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

      <div style={{ padding: "32px", maxWidth: "820px", margin: "0 auto" }}>

        {/* Form */}
        <div style={{ fontSize: "11px", color: "#2db973", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", fontWeight: "700" }}>New Entry</div>
        <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "700", color: "#0d2b1d" }}>Add New Prospect</h2>
        <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 28px" }}>Fill in the details of the person you prospected</p>

        {success && (
          <div style={{
            backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: "8px", padding: "12px 16px", marginBottom: "20px",
            color: "#15803d", fontSize: "14px", fontWeight: "500"
          }}>✅ {success}</div>
        )}

        {error && (
          <div style={{
            backgroundColor: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: "8px", padding: "12px 16px", marginBottom: "20px",
            color: "#dc2626", fontSize: "14px"
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{
          backgroundColor: "#ffffff", border: "1px solid #e0d8ce",
          borderRadius: "16px", padding: "28px", marginBottom: "32px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08012345678" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Company / Organization</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="ABC Ltd" style={inputStyle} />
            </div>
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

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "13px",
            backgroundColor: loading ? "#1a6b3f" : "#0d2b1d",
            color: "#2db973", border: "none", borderRadius: "8px",
            fontSize: "15px", fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? "Submitting..." : "Add Prospect"}
          </button>
        </form>

        {/* My Prospects */}
        <div style={{
          backgroundColor: "#ffffff", border: "1px solid #e0d8ce",
          borderRadius: "16px", padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: "700", color: "#0d2b1d" }}>
            My Prospects ({prospects.length})
          </h3>

          {fetchingProspects ? (
            <div style={{ color: "#9ca3af", textAlign: "center", padding: "30px 0" }}>Loading...</div>
          ) : prospects.length === 0 ? (
            <div style={{ color: "#9ca3af", textAlign: "center", padding: "30px 0" }}>
              You haven't added any prospects yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {prospects.map(p => (
                <div key={p.id} style={{
                  backgroundColor: "#f0ebe3", border: "1px solid #e0d8ce",
                  borderRadius: "10px", padding: "16px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div>
                      <div style={{ fontWeight: "700", color: "#0d2b1d", marginBottom: "2px" }}>
                        {p.firstName} {p.lastName}
                      </div>
                      <div style={{ color: "#4a5568", fontSize: "13px" }}>
                        {p.phone} {p.company ? `• ${p.company}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{
                        backgroundColor: scoreColor(p.score) + "18",
                        color: scoreColor(p.score),
                        padding: "3px 10px", borderRadius: "20px",
                        fontSize: "12px", fontWeight: "600"
                      }}>{p.score}</span>
                      <div style={{ color: "#9ca3af", fontSize: "11px" }}>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {p.notes && (
                    <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "12px", fontStyle: "italic" }}>
                      "{p.notes}"
                    </div>
                  )}

                  {/* Status + Actions Row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>Status:</span>
                      <select
                        value={p.status}
                        onChange={(e) => handleStatusUpdate(p.id, e.target.value)}
                        style={{
                          backgroundColor: statusColor(p.status) + "18",
                          color: statusColor(p.status),
                          padding: "4px 10px", borderRadius: "20px",
                          fontSize: "12px", border: "none",
                          cursor: "pointer", outline: "none", fontWeight: "600"
                        }}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Interested">Interested</option>
                        <option value="Converted">Converted</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </div>

                    <button
                      onClick={() => openWhatsApp(p)}
                      style={{
                        backgroundColor: "#25d366", color: "#ffffff",
                        border: "none", padding: "7px 14px",
                        borderRadius: "8px", cursor: "pointer",
                        fontSize: "12px", fontWeight: "700",
                        display: "flex", alignItems: "center", gap: "6px"
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Follow Up on WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <NotificationSound />
      <ChatBot />
    </div>
  )
}