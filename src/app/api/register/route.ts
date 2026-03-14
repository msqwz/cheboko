import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { validatePassword } from "@/lib/passwordValidator";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { name, email, phone, role, password } = await request.json();
    console.log("[REGISTER] Data received:", { name, email, phone, role });
    
    if (!email) {
      return NextResponse.json({ error: "Email обязателен" }, { status: 400 });
    }

    // Role safety check
    const allowedRoles = ["OPERATOR", "REGIONAL_MANAGER", "CLIENT_NETWORK_HEAD"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Недопустимая роль для регистрации" }, { status: 400 });
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Введите корректный e-mail" }, { status: 400 });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      console.log("[REGISTER] Password validation failed:", passwordCheck.message);
      return NextResponse.json({ error: passwordCheck.message }, { status: 400 });
    }

    // 2. Check if user already exists
    console.log("[REGISTER] Checking if user exists in Supabase...");
    const { data: existingUser, error: checkError } = await supabase
      .from('User')
      .select('id, isVerified')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error("[REGISTER] Supabase check error:", checkError);
      return NextResponse.json({ error: "Ошибка базы данных при проверке" }, { status: 500 });
    }

    if (existingUser) {
      // ПРОВЕРКА: Если пользователь уже есть, но не верифицирован — генерируем новый код
      if (!existingUser.isVerified) {
        console.log("[REGISTER] User exists but not verified. Regenerating code...");
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        await supabase
          .from('User')
          .update({ verificationCode: newCode })
          .eq('email', email);
          
        return NextResponse.json({ 
          success: true, 
          message: "Новый код подтверждения отправлен (временно возвращен в ответе)",
          debugCode: newCode
        });
      }

      console.log("[REGISTER] User already exists and verified:", email);
      return NextResponse.json({ error: "E-mail уже используется, войдите или восстановите доступ" }, { status: 400 });
    }

    // 3. Hash password
    if (!name || !phone || !role || !password) {
      return NextResponse.json({ error: "Для регистрации нового пользователя заполните все поля" }, { status: 400 });
    }

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
