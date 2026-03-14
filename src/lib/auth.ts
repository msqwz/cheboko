import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase, User } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] No credentials');
          throw new Error("Заполните Email и Пароль");
        }

        const { data, error } = await supabase
          .from('User')
          .select('*')
          .eq('email', credentials.email)
          .limit(1);

        if (error) {
          console.error('[AUTH] Supabase error:', error);
          throw new Error("Ошибка базы данных: " + error.message);
        }
        
        if (!data || data.length === 0) {
          throw new Error("Неверный Email или пароль");
        }

        const user = data[0] as User;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isValid) {
          throw new Error("Неверный Email или пароль");
        }

        if (user.isVerified === false) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        if (user.isDeleted === true) {
          throw new Error("PROFILE_DELETED");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone ?? null,
        };
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.phone = token.phone;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  secret: process.env.NEXTAUTH_SECRET
};
