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

    const { data: allLocations, error } = await supabase
      .from('Location')
      .select('*');

    if (error) throw error;

    return NextResponse.json(allLocations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { legalName, address, lat, lng, managerId } = body;

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    const { data: newLocation, error } = await supabase
      .from('Location')
      .insert({
        id: crypto.randomUUID(),
        name: legalName,
        address,
        latitude: lat ? lat.toString() : null,
        longitude: lng ? lng.toString() : null,
        clientId: managerId,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(newLocation, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'OPERATOR'].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, legalName, address, lat, lng, managerId } = body;

    if (!id) {
      return NextResponse.json({ error: "Location ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (legalName) updateData.name = legalName;
    if (address) updateData.address = address;
    if (lat !== undefined) updateData.latitude = lat?.toString();
    if (lng !== undefined) updateData.longitude = lng?.toString();
    if (managerId !== undefined) updateData.clientId = managerId;

    const { data: updated, error } = await supabase
      .from('Location')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error updating location:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }


    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Location ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from('Location')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Supabase error deleting location:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }


    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

