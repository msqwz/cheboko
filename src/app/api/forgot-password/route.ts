import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Введите корректный e-mail" }, { status: 400 });
    }

    // 1. Find user
    const { data: user, error: findError } = await supabase
      .from('User')
      .select('id, name')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      // Per security best practices, we might want to say "Check email" even if not found,
      // but TZ might demand specific error for non-existent. Usually it's better to just log.
      console.log(`[FORGOT-PASSWORD] Email not found: ${email}`);
      return NextResponse.json({ success: true, message: "Если email зарегистрирован, ссылка придет на почту" });
    }

    // 2. Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(); // 1 hour

    // 3. Update user
    const { error: updateError } = await supabase
      .from('User')
      .update({ resetToken, resetExpires })
      .eq('id', user.id);

    if (updateError) {
      console.error("[FORGOT-PASSWORD] Update error:", updateError);
      return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
    }

    // 4. Mock send email
    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password/${resetToken}`;
    console.log(`[EMAIL MOCK] Password recovery for ${email}: ${resetLink}`);

    return NextResponse.json({ 
      success: true, 
      message: "Ссылка для восстановления направлена на почту" 
    });

  } catch (error) {
    console.error("[FORGOT-PASSWORD] General error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
