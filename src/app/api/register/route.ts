import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Имя слишком короткое"),
  email: z.string().email("Некорректный email"),
  phone: z.string().min(5, "Укажите корректный телефон"),
  role: z.enum(["OPERATOR", "REGIONAL_MANAGER", "CLIENT_NETWORK_HEAD"]),
  password: z
    .string()
    .min(8, "Пароль должен быть не менее 8 символов")
    .regex(/[a-zA-Zа-яА-Я]/, "Пароль должен содержать хотя бы одну букву")
    .regex(
      /[!@#$%^&*()\-_=+\\|[\]{};:/?.><]/,
      "Пароль должен содержать хотя бы один специальный символ"
    ),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[REGISTER] Request body keys:", Object.keys(body));

    // 1. Проверка на повторную отправку кода (только email в body)
    if (body.email && Object.keys(body).length === 1) {
      console.log("[REGISTER] Resend code requested for:", body.email);
      const { data: user, error: findError } = await supabase
        .from('User')
        .select('id, isVerified')
        .eq('email', body.email)
        .maybeSingle();

      if (findError || !user) {
        return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
      }

      if (user.isVerified) {
        return NextResponse.json({ error: "Аккаунт уже подтвержден" }, { status: 400 });
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error: updateError } = await supabase
        .from('User')
        .update({ verificationCode, verificationExpires })
        .eq('id', user.id);

      if (updateError) {
        console.error("[REGISTER] Resend update error:", updateError);
        return NextResponse.json({ error: "Ошибка при обновлении кода" }, { status: 500 });
      }

      console.log(`[EMAIL MOCK] New verification code for ${body.email}: ${verificationCode}`);
      return NextResponse.json({ success: true, message: "Код отправлен повторно", debugCode: verificationCode });
    }

    // 2. Валидация данных через Zod для полной регистрации
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0].message;
      console.warn("[REGISTER] Validation failed:", firstError);
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, phone, role, password } = validation.data;

    // 3. Hash password
    console.log("[REGISTER] Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // 5. Create user in DB (isVerified: false)
    console.log("[REGISTER] Attempting to upsert user into DB...");
    const { data: newUser, error: createError } = await supabase
      .from('User')
      .upsert({
        name,
        email,
        phone,
        password: hashedPassword,
        role: role,
        isVerified: false,
        verificationCode,
        verificationExpires,
      }, { onConflict: 'email' })
      .select()
      .maybeSingle();

    if (createError) {
      console.error("[REGISTER] Create error details:", createError);
      return NextResponse.json({
        error: "Ошибка при создании пользователя",
        details: createError.message,
        code: createError.code
      }, { status: 500 });
    }

    // 7. Mock sending email (In reality, would use Resend/SendGrid)
    console.log(`[EMAIL MOCK] Verification code for ${email}: ${verificationCode}`);
    // Here we can also send to Telegram for debug if token exists

    return NextResponse.json({
      success: true,
      message: "Регистрация успешна. Подтвердите email.",
    });

  } catch (error) {
    console.error("[REGISTER] General error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
