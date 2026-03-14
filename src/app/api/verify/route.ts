import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email и код обязательны" }, { status: 400 });
    }

    // 1. Find user by email and non-expired code
    const { data: user, error: findError } = await supabase
      .from('User')
      .select('id, verificationCode, verificationExpires')
      .eq('email', email)
      .single();

    if (findError || !user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // 2. Check code
    if (user.verificationCode !== code) {
      return NextResponse.json({ error: "Неверный код" }, { status: 400 });
    }

    // 3. Check expiration
    if (user.verificationExpires && new Date(user.verificationExpires) < new Date()) {
      return NextResponse.json({ error: "Срок действия кода истек" }, { status: 400 });
    }

    // 4. Mark user as verified
    const { error: updateError } = await supabase
      .from('User')
      .update({
        isVerified: true,
        verificationCode: null,
        verificationExpires: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error("[VERIFY] Update error:", updateError);
      return NextResponse.json({ error: "Ошибка при активации аккаунта" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Аккаунт подтвержден" });

  } catch (error) {
    console.error("[VERIFY] General error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
