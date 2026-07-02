"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
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

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0f0f0f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "sans-serif"
    }}>
      <div style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid #2a2a2a",
        borderRadius: "16px",
        padding: "48px 40px",
        width: "100%",
        maxWidth: "420px",
      }}>

        {/* Logo & Title */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            backgroundColor: "#7c3aed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "24px",
            fontWeight: "bold",
            color: "white"
          }}>A</div>
          <h1 style={{ color: "white", fontSize: "22px", fontWeight: "600", margin: "0 0 6px" }}>
            Ajetunmobi Office
          </h1>
          <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>
            Prospect Management System
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: "#2a1a1a",
            border: "1px solid #5a2020",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "20px",
            color: "#f87171",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ color: "#aaa", fontSize: "13px", display: "block", marginBottom: "8px" }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@ajetunmobi.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                backgroundColor: "#0f0f0f",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                color: "white",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ color: "#aaa", fontSize: "13px", display: "block", marginBottom: "8px" }}>
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "12px 14px",
                backgroundColor: "#0f0f0f",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                color: "white",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              backgroundColor: loading ? "#4c1d95" : "#7c3aed",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s"
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ color: "#555", fontSize: "12px", textAlign: "center", marginTop: "24px" }}>
          Contact your admin if you don't have an account
        </p>
      </div>
    </div>
  )
}