"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: "", password: "" })
  const [requestForm, setRequestForm] = useState({ name: "", email: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showRequest, setShowRequest] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState("")
  const [requestError, setRequestError] = useState("")
  const [requestLoading, setRequestLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invalid credentials")
        setLoading(false)
        return
      }

      if (data.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/staff")
      }
    } catch (err) {
      setError("Something went wrong. Try again.")
      setLoading(false)
    }
  }

  const handleRequest = async (e) => {
    e.preventDefault()
    setRequestLoading(true)
    setRequestError("")
    setRequestSuccess("")

    try {
      const res = await fetch("/api/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestForm),
      })

      const data = await res.json()

      if (!res.ok) {
        setRequestError(data.error || "Failed to send request")
        setRequestLoading(false)
        return
      }

      setRequestSuccess("Request sent! Admin will review and get back to you.")
      setRequestForm({ name: "", email: "" })
    } catch (err) {
      setRequestError("Something went wrong. Try again.")
    }

    setRequestLoading(false)
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    backgroundColor: "#f0ebe3",
    border: "1px solid #d0c8be",
    borderRadius: "8px",
    color: "#1a1a1a",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box"
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f0ebe3",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "sans-serif"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e0d8ce",
        borderRadius: "16px",
        padding: "48px 40px",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)"
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "14px",
            backgroundColor: "#0d2b1d", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 16px",
            fontSize: "24px", fontWeight: "bold", color: "#2db973"
          }}>A</div>
          <h1 style={{ color: "#1a1a1a", fontSize: "22px", fontWeight: "700", margin: "0 0 6px" }}>
            Ajetunmobi Office
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>
            Prospect Management System
          </p>
        </div>

        {!showRequest ? (
          <>
            {error && (
              <div style={{
                backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: "8px", padding: "12px 16px", marginBottom: "20px",
                color: "#dc2626", fontSize: "14px"
              }}>{error}</div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ color: "#4a5568", fontSize: "13px", display: "block", marginBottom: "8px", fontWeight: "500" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@ajetunmobi.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ color: "#4a5568", fontSize: "13px", display: "block", marginBottom: "8px", fontWeight: "500" }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "13px",
                  backgroundColor: loading ? "#1a6b3f" : "#0d2b1d",
                  color: "#2db973", border: "none", borderRadius: "8px",
                  fontSize: "15px", fontWeight: "700",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                onClick={() => setShowRequest(true)}
                style={{
                  background: "none", border: "none",
                  color: "#2db973", fontSize: "13px",
                  cursor: "pointer", textDecoration: "underline",
                  fontWeight: "500"
                }}
              >
                Don't have an account? Request Access
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "600", color: "#1a1a1a" }}>
              Request Access
            </h3>

            {requestSuccess && (
              <div style={{
                backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
                borderRadius: "8px", padding: "12px 16px", marginBottom: "20px",
                color: "#15803d", fontSize: "14px"
              }}>{requestSuccess}</div>
            )}

            {requestError && (
              <div style={{
                backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: "8px", padding: "12px 16px", marginBottom: "20px",
                color: "#dc2626", fontSize: "14px"
              }}>{requestError}</div>
            )}

            <form onSubmit={handleRequest}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ color: "#4a5568", fontSize: "13px", display: "block", marginBottom: "8px", fontWeight: "500" }}>
                  Full Name
                </label>
                <input
                  required
                  value={requestForm.name}
                  onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
                  placeholder="John Adeyemi"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ color: "#4a5568", fontSize: "13px", display: "block", marginBottom: "8px", fontWeight: "500" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={requestForm.email}
                  onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
                  placeholder="john@ajetunmobi.com"
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={requestLoading}
                style={{
                  width: "100%", padding: "13px",
                  backgroundColor: requestLoading ? "#1a6b3f" : "#0d2b1d",
                  color: "#2db973", border: "none", borderRadius: "8px",
                  fontSize: "15px", fontWeight: "700",
                  cursor: requestLoading ? "not-allowed" : "pointer",
                }}
              >
                {requestLoading ? "Sending..." : "Send Request"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                onClick={() => setShowRequest(false)}
                style={{
                  background: "none", border: "none",
                  color: "#6b7280", fontSize: "13px",
                  cursor: "pointer", textDecoration: "underline"
                }}
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}