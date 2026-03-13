import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/equipment - получить оборудование
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId');

    let query = supabase.from('Equipment').select('*');

    if (locationId) {
      query = query.eq('locationId', locationId);
    }

    const { data: allEquipment, error } = await query;

    if (error) throw error;

    return NextResponse.json(allEquipment);
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/equipment - создать оборудование
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { serialNumber, model, type, nextMaintenance, locationId, lat, lng } = body;

    if (!serialNumber || !model || !locationId) {
      return NextResponse.json({ error: "Serial number, model and location are required" }, { status: 400 });
    }

    const { data: newEquipment, error } = await supabase
      .from('Equipment')
      .insert({
        id: crypto.randomUUID(),
        serialNumber,
        name: model,
        type: type || 'Другое',
        locationId,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(newEquipment, { status: 201 });
  } catch (error) {
    console.error("Error creating equipment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/equipment - обновить оборудование
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, serialNumber, model, type, locationId } = body;

    if (!id) {
      return NextResponse.json({ error: "Equipment ID required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (serialNumber) updateData.serialNumber = serialNumber;
    if (model) updateData.name = model;
    if (type) updateData.type = type;
    if (locationId) updateData.locationId = locationId;

    const { data: updated, error } = await supabase
      .from('Equipment')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating equipment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/equipment - удалить оборудование
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'OPERATOR'].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Equipment ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from('Equipment')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
