import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const url = request.nextUrl.clone()

  // Handle admin subdomain (admin.giftus.in)
  if (hostname.startsWith("admin.") || hostname.startsWith("admin.localhost")) {
    // Rewrite to /admin routes
    if (url.pathname === "/") {
      url.pathname = "/admin/bulk-upload"
      return NextResponse.rewrite(url)
    }
    
    // If not already on /admin path, prepend /admin
    if (!url.pathname.startsWith("/admin")) {
      url.pathname = `/admin${url.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // Block direct access to /admin routes on main domain
  if (!hostname.startsWith("admin.") && url.pathname.startsWith("/admin")) {
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
}
