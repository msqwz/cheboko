import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    // Создаём тестового пользователя
    const password = await bcrypt.hash("12345678", 10);
    
    const { data, error } = await supabase
      .from('User')
      .insert({
        id: 'admin-' + Date.now(),
        email: 'admin@cheboko.ru',
        password,
        name: 'Администратор',
        role: 'ADMIN',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ 
        status: "error", 
        error: error.message 
      });
    }

    return NextResponse.json({ 
      status: "ok", 
      user: data,
      password: "12345678"
    });
  } catch (err: any) {
    return NextResponse.json({ 
      status: "error", 
      error: err.message 
    });
  }
}
