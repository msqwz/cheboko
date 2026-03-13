import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const newPassword = await bcrypt.hash("admin", 10);
    
    // Обновляем пароль для существующего админа или создаем нового
    const { data, error } = await supabase
      .from('User')
      .upsert({
        id: 'admin-fixed',
        email: 'admin@cheboko.ru',
        password: newPassword,
        name: 'Администратор',
        role: 'ADMIN',
      }, { onConflict: 'email' })
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    return NextResponse.json({ 
      message: "Пароль администратора сброшен на 'admin'",
      user: data[0].email
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
