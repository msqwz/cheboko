import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Проверяем подключение
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .limit(1);

    if (error) {
      return NextResponse.json({ 
        status: "error", 
        error: error.message,
        details: error 
      });
    }

    return NextResponse.json({ 
      status: "ok", 
      userCount: data?.length || 0,
      sample: data?.[0] || null
    });
  } catch (err: any) {
    return NextResponse.json({ 
      status: "error", 
      error: err.message 
    });
  }
}
