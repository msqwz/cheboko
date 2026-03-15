import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role as string;
    const { pathname } = req.nextUrl;

    // Защита админ-панели
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Защита панели оператора
    if (pathname.startsWith("/operator") && role !== "OPERATOR" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Защита панели инженера
    if (pathname.startsWith("/engineer") && role !== "ENGINEER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Защита панели менеджера региона
    if (pathname.startsWith("/manager") && role !== "REGIONAL_MANAGER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Защита панели руководителя сети
    if (pathname.startsWith("/network") && role !== "CLIENT_NETWORK_HEAD" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Защита панели управляющего точкой
    if (pathname.startsWith("/point") && role !== "CLIENT_POINT_MANAGER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Защита общих клиентских страниц
    const clientRoles = ['CLIENT_MANAGER', 'CLIENT_SPECIALIST', 'CLIENT_NETWORK_HEAD', 'CLIENT_POINT_MANAGER', 'ADMIN'];
    if (pathname.startsWith("/tickets") && !clientRoles.includes(role)) {
       // Инженеры и операторы имеют свои спец. разделы для заявок, но если вдруг лезут в /tickets
       if (role === 'ENGINEER') return NextResponse.redirect(new URL("/engineer/tasks", req.url));
       if (role === 'OPERATOR') return NextResponse.redirect(new URL("/operator", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/operator/:path*",
    "/engineer/:path*",
    "/manager/:path*",
    "/network/:path*",
    "/point/:path*",
    "/tickets/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/api/((?!auth|register|verify|invite/verify|invite/activate).*)",
  ],
};

