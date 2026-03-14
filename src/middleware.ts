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
    "/api/((?!auth|register|verify|invite/verify|invite/activate).*)", // Защищаем API кроме публичных верификаций и регистрации
  ],
};
