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

    const { data: engineers, error: engineersError } = await supabase
      .from('User')
      .select('*')
      .eq('role', 'ENGINEER');

    if (engineersError) throw engineersError;

    const { data: allLocations, error: locationsError } = await supabase
      .from('Location')
      .select('*');

    if (locationsError) throw locationsError;

    return NextResponse.json({ engineers, locations: allLocations });
  } catch (error) {
    console.error("Error fetching map data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
