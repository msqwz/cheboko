import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Укажите токен восстановления"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Валидация через Zod
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { token, password } = validation.data;

    // 1. Find user by token
    const { data: user, error: findError } = await supabase
      .from('User')
      .select('id, resetExpires')
      .eq('resetToken', token)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: "Недействительная или устаревшая ссылка" }, { status: 400 });
    }

    // 2. Check expiration
    if (new Date(user.resetExpires) < new Date()) {
      return NextResponse.json({ error: "Срок действия ссылки истек" }, { status: 400 });
    }

    // 3. Update password
    const hashedPassword = await bcrypt.hash(password, 10);
    const { error: updateError } = await supabase
      .from('User')
      .update({ 
        password: hashedPassword,
        resetToken: null,
        resetExpires: null,
        isVerified: true // If they reset password, we can assume they have access to email
      })
      .eq('id', user.id);

    if (updateError) {
      console.error("[RESET-PASSWORD] Update error:", updateError);
      return NextResponse.json({ error: "Ошибка при обновлении пароля" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Пароль успешно изменен" 
    });

  } catch (error) {
    console.error("[RESET-PASSWORD] General error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
