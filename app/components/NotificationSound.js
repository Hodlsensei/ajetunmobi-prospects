"use client"
import { useEffect, useRef, useState } from "react"

export default function NotificationSound() {
  const [prevCount, setPrevCount] = useState(null)
  const audioCtx = useRef(null)

  const playSound = () => {
    try {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = audioCtx.current

      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)
      oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1)

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.4)
    } catch (err) {
      console.error("Sound error:", err)
    }
  }

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const res = await fetch("/api/notifications")
        if (!res.ok) return
        const data = await res.json()
        if (data.notifications) {
          const unread = data.notifications.filter(n => !n.read).length
          if (prevCount !== null && unread > prevCount) {
            playSound()
          }
          setPrevCount(unread)
        }
      } catch (err) {
        console.error(err)
      }
    }

    checkNotifications()
    const interval = setInterval(checkNotifications, 15000)
    return () => clearInterval(interval)
  }, [prevCount])

  return null
}