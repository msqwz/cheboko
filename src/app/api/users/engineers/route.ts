import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: engineers, error } = await supabase
      .from('User')
      .select('id, name, email')
      .eq('role', 'ENGINEER');

    if (error) throw error;

    return NextResponse.json(engineers);
  } catch (error) {
    console.error("Error fetching engineers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
