"use client"
import { useState, useRef, useEffect } from "react"

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I am your AI assistant. Ask me anything about your prospects or how to follow up with them!" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", text: userMessage }])
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      })

      const data = await res.json()
      setMessages(prev => [...prev, { role: "assistant", text: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, something went wrong. Try again." }])
    }

    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {open && (
        <div style={{
          position: "fixed", bottom: "90px", right: "24px",
          width: "360px", height: "480px",
          backgroundColor: "#0d2b1d", border: "1px solid #2a2a2a",
          borderRadius: "16px", zIndex: 1000,
          display: "flex", flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
        }}>
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid #2a2a2a",
            display: "flex", alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                backgroundColor: "#7c3aed", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "16px"
              }}>🤖</div>
              <div>
                <div style={{ fontWeight: "600", fontSize: "14px", color: "white" }}>AI Assistant</div>
                <div style={{ fontSize: "11px", color: "#059669" }}>● Online</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "none", border: "none",
                color: "#888", fontSize: "18px", cursor: "pointer"
              }}
            >✕</button>
          </div>

          <div style={{
            flex: 1, overflowY: "auto", padding: "16px",
            display: "flex", flexDirection: "column", gap: "12px"
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
              }}>
                <div style={{
                  maxWidth: "80%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  backgroundColor: msg.role === "user" ? "#7c3aed" : "#0f0f0f",
                  color: "white", fontSize: "13px", lineHeight: "1.5",
                  border: msg.role === "assistant" ? "1px solid #2a2a2a" : "none"
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "10px 14px", borderRadius: "14px 14px 14px 4px",
                  backgroundColor: "#0f0f0f", border: "1px solid #2a2a2a",
                  color: "#888", fontSize: "13px"
                }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{
            padding: "12px 16px", borderTop: "1px solid #2a2a2a",
            display: "flex", gap: "8px"
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              style={{
                flex: 1, padding: "10px 14px",
                backgroundColor: "#f0ebe3",
                border: "1px solid #2a2a2a",
                borderRadius: "8px", color: "white",
                fontSize: "13px", outline: "none"
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                padding: "10px 16px", backgroundColor: "#7c3aed",
                color: "white", border: "none", borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer", fontSize: "16px"
              }}
            >➤</button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed", bottom: "24px", right: "24px",
          width: "56px", height: "56px", borderRadius: "50%",
          backgroundColor: "#7c3aed", border: "none",
          color: "white", fontSize: "24px", cursor: "pointer",
          boxShadow: "0 4px 16px rgba(124,58,237,0.5)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
        }}
      >
        {open ? "✕" : "🤖"}
      </button>
    </>
  )
}