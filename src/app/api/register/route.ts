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
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Валидация данных через Zod
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0].message;
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, phone, role, password } = validation.data;
    
    // 2. Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('User')
      .select('id, isVerified')
      .eq('email', email)
      .maybeSingle();

    // 3. Hash password
    console.log("[REGISTER] Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // 5. Determine default role
    const defaultRole = "OPERATOR"; 

    // 6. Create user in DB (isVerified: false)
    console.log("[REGISTER] Attempting to insert user into DB...");
    const { data: newUser, error: createError } = await supabase
      .from('User')
      .insert({
        id: crypto.randomUUID(),
        name,
        email,
        phone,
        password: hashedPassword,
        role: role,
        isVerified: false,
        verificationCode,
        verificationExpires,
      })
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
      debugCode: verificationCode // Временно для тестирования
    });

  } catch (error) {
    console.error("[REGISTER] General error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
