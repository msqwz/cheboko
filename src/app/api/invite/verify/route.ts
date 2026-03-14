import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Токен отсутствует" }, { status: 400 });
  }

  const { data: user, error } = await supabase
    .from('User')
    .select('email, role, name, phone, invitationExpires')
    .eq('invitationToken', token)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "Неверная ссылка" }, { status: 404 });
  }

  if (user.invitationExpires && new Date(user.invitationExpires) < new Date()) {
    return NextResponse.json({ error: "Ссылка истекла" }, { status: 400 });
  }

  return NextResponse.json({
    email: user.email,
    role: user.role,
    name: user.name,
    phone: user.phone
  });
}
