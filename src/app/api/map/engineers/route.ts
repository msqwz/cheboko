import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PATCH /api/map/engineers - обновить позицию инженера
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { lat, lng, region } = body;

    // Только инженер может обновлять свою позицию
    if ((session.user as any).role !== 'ENGINEER') {
      return NextResponse.json({ error: "Only engineers can update location" }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from('User')
      .update({
        latitude: lat ? lat.toString() : null,
        longitude: lng ? lng.toString() : null,
        address: region || null
      })
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating engineer location:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/map/engineers - получить всех инженеров с позициями
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: engineers, error } = await supabase
      .from('User')
      .select('*')
      .eq('role', 'ENGINEER')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) throw error;

    return NextResponse.json(engineers);
  } catch (error) {
    console.error("Error fetching engineers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
