import { NextResponse } from "next/server"

export function middleware(req) {
  const userCookie = req.cookies.get("user")
  const { pathname } = req.nextUrl

  // Allow public routes
  if (pathname === "/login" || pathname.startsWith("/api/auth") || pathname.startsWith("/api/access-request")) {
    return NextResponse.next()
  }

  // If no cookie, redirect to login
  if (!userCookie) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const user = JSON.parse(userCookie.value)

  // If staff tries to access admin, redirect to staff
  if (pathname.startsWith("/admin") && user.role !== "admin") {
    return NextResponse.redirect(new URL("/staff", req.url))
  }

  // If admin tries to access staff, redirect to admin
  if (pathname.startsWith("/staff") && user.role !== "staff") {
    return NextResponse.redirect(new URL("/admin", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ]
}