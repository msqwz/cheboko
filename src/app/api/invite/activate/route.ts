import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { validatePassword } from "@/lib/passwordValidator";

export async function POST(request: Request) {
  try {
    const { token, password, name, phone } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Данные неполны" }, { status: 400 });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return NextResponse.json({ error: passwordCheck.message }, { status: 400 });
    }

    // 1. Find user by token
    const { data: user, error: findError } = await supabase
      .from('User')
      .select('id, invitationExpires')
      .eq('invitationToken', token)
      .single();

    if (findError || !user) {
      return NextResponse.json({ error: "Ссылка недействительна" }, { status: 404 });
    }

    if (user.invitationExpires && new Date(user.invitationExpires) < new Date()) {
      return NextResponse.json({ error: "Срок действия ссылки истек" }, { status: 400 });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Update user: set password, verify, clear token
    const { error: updateError } = await supabase
      .from('User')
      .update({
        password: hashedPassword,
        name: name,
        phone: phone,
        isVerified: true,
        invitationToken: null,
        invitationExpires: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error("[ACTIVATE] Update error:", updateError);
      return NextResponse.json({ error: "Ошибка при активации аккаунта" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[ACTIVATE] General error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
