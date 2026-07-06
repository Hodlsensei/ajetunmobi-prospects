"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// Each line's trailing word gets the green highlight, matching the reference:
// plain bold white text, with the key word picked out in green.
const LINES = [
  { text: "USE THE PRODUCT", highlight: "PRODUCT" },
  { text: "SHARE THE PRODUCT", highlight: "PRODUCT" },
  { text: "SHARE THE OPPORTUNITY", highlight: "OPPORTUNITY" }
]

const renderLine = (line, typedLength) => {
  const hlStart = line.text.length - line.highlight.length
  const typed = line.text.slice(0, typedLength)

  if (typedLength <= hlStart) {
    return <span style={{ color: "#f2f2ee" }}>{typed}</span>
  }

  return (
    <>
      <span style={{ color: "#f2f2ee" }}>{line.text.slice(0, hlStart)}</span>
      <span style={{ color: "#4fae76", fontWeight: 800 }}>{typed.slice(hlStart)}</span>
    </>
  )
}

const IntroScreen = ({ onDone }) => {
  const [lineIndex, setLineIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [completedLines, setCompletedLines] = useState([])
  const [showCursor, setShowCursor] = useState(true)
  const [done, setDone] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    if (done) return
    if (lineIndex >= LINES.length) {
      setDone(true)
      return
    }
    const currentText = LINES[lineIndex].text
    if (charIndex < currentText.length) {
      const timeout = setTimeout(() => {
        setCharIndex(prev => prev + 1)
      }, 80)
      return () => clearTimeout(timeout)
    } else {
      const timeout = setTimeout(() => {
        if (lineIndex < LINES.length - 1) {
          setCompletedLines(prev => [...prev, LINES[lineIndex].text])
          setLineIndex(prev => prev + 1)
          setCharIndex(0)
        } else {
          setDone(true)
        }
      }, 400)
      return () => clearTimeout(timeout)
    }
  }, [charIndex, lineIndex, done])

  useEffect(() => {
    const interval = setInterval(() => setShowCursor(prev => !prev), 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!done) return
    const timeout = setTimeout(() => {
      setFadeOut(true)
      setTimeout(onDone, 600)
    }, 1500)
    return () => clearTimeout(timeout)
  }, [done])

  return (
    <div style={{
      position: "fixed", inset: 0,
      backgroundColor: "#101210",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999,
      opacity: fadeOut ? 0 : 1,
      transition: "opacity 0.6s ease"
    }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: "560px", padding: "0 24px", boxSizing: "border-box" }}>

        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          marginBottom: "28px"
        }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "8px",
            backgroundColor: "#4fae76", display: "flex", alignItems: "center",
            justifyContent: "center", fontWeight: "800", fontSize: "13px", color: "#101210"
          }}>A</div>
          <span style={{
            fontSize: "12px", color: "#6b8f78", fontWeight: "700",
            textTransform: "uppercase", letterSpacing: "1.5px"
          }}>Ajetunmobi Office</span>
        </div>

        <div style={{
          fontFamily: "'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', monospace",
          fontSize: "clamp(26px, 5vw, 42px)",
          fontWeight: 800,
          letterSpacing: "0px",
          lineHeight: "1.25",
          whiteSpace: "pre-line"
        }}>
          {completedLines.map((text, i) => (
            <div key={i}>{renderLine(LINES[i], text.length)}</div>
          ))}
          {lineIndex < LINES.length && (
            <div>
              {renderLine(LINES[lineIndex], charIndex)}
              <span style={{
                opacity: showCursor && !done ? 1 : 0,
                color: "#4fae76",
                fontWeight: 300,
                transition: "opacity 0.1s"
              }}>|</span>
            </div>
          )}
        </div>

        {done && (
          <div style={{
            marginTop: "24px",
            fontSize: "12px",
            color: "#5c7d68",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            fontWeight: "600",
            animation: "fadeInUp 0.5s ease forwards"
          }}>
            NeoLife · Ajetunmobi Office
          </div>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [showIntro, setShowIntro] = useState(true)
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
    <>
      {showIntro && <IntroScreen onDone={() => setShowIntro(false)} />}

      <div style={{
        minHeight: "100vh",
        backgroundColor: "#f0ebe3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        opacity: showIntro ? 0 : 1,
        transition: "opacity 0.6s ease"
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
                    type="email" required value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@ajetunmobi.com" style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ color: "#4a5568", fontSize: "13px", display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    Password
                  </label>
                  <input
                    type="password" required value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••" style={inputStyle}
                  />
                </div>

                <button type="submit" disabled={loading} style={{
                  width: "100%", padding: "13px",
                  backgroundColor: loading ? "#1a6b3f" : "#0d2b1d",
                  color: "#2db973", border: "none", borderRadius: "8px",
                  fontSize: "15px", fontWeight: "700",
                  cursor: loading ? "not-allowed" : "pointer",
                }}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button onClick={() => setShowRequest(true)} style={{
                  background: "none", border: "none",
                  color: "#2db973", fontSize: "13px",
                  cursor: "pointer", textDecoration: "underline", fontWeight: "500"
                }}>
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
                    required value={requestForm.name}
                    onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
                    placeholder="John Adeyemi" style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ color: "#4a5568", fontSize: "13px", display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    Email Address
                  </label>
                  <input
                    type="email" required value={requestForm.email}
                    onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
                    placeholder="john@ajetunmobi.com" style={inputStyle}
                  />
                </div>

                <button type="submit" disabled={requestLoading} style={{
                  width: "100%", padding: "13px",
                  backgroundColor: requestLoading ? "#1a6b3f" : "#0d2b1d",
                  color: "#2db973", border: "none", borderRadius: "8px",
                  fontSize: "15px", fontWeight: "700",
                  cursor: requestLoading ? "not-allowed" : "pointer",
                }}>
                  {requestLoading ? "Sending..." : "Send Request"}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button onClick={() => setShowRequest(false)} style={{
                  background: "none", border: "none",
                  color: "#6b7280", fontSize: "13px",
                  cursor: "pointer", textDecoration: "underline"
                }}>
                  Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}