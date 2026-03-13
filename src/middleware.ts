import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Защищаем все страницы кроме логина и API
  matcher: [
    "/",
    "/tickets/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/api/((?!auth).*)", // Защищаем API кроме /api/auth
  ],
};
