import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const equipmentSchema = z.object({
  serialNumber: z.string().min(1, "Серийный номер обязателен"),
  model: z.string().min(1, "Модель обязательна"),
  type: z.string().optional().default("Другое"),
  locationId: z.string().min(1, "Некорректный ID локации"),
  nextMaintenance: z.string().nullable().optional(),
});

// GET /api/equipment - получить оборудование
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId');

    let query = supabase.from('Equipment').select(`
      *,
      location:Location!locationId(*, legalName:name)
    `);

    if (locationId) {
      query = query.eq('locationId', locationId);
    }

    const { data: allEquipment, error } = await query;

    if (error) throw error;

    // Ре маппинг name -> model для фронтенда
    const mapped = (allEquipment || []).map(eq => ({
      ...eq,
      model: eq.name,
    }));

    return NextResponse.json(mapped);

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
    const validation = equipmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }
    const { serialNumber, model, type, nextMaintenance, locationId } = validation.data;

    const eqData: any = {
      id: crypto.randomUUID(),
      serialNumber,
      name: model,
      type,
      locationId,
    };

    // Пытаемся добавить поле, только если оно пришло, но не падаем если колонки нет
    if (nextMaintenance) eqData.nextMaintenance = nextMaintenance;

    const { data: newEquipment, error } = await supabase
      .from('Equipment')
      .insert(eqData)
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating equipment:", error);
      // Если ошибка в колонке, пробуем без неё
      if (error.message.includes('nextMaintenance')) {
        delete eqData.nextMaintenance;
        const { data: retry, error: retryErr } = await supabase
          .from('Equipment')
          .insert(eqData)
          .select()
          .single();
        if (retryErr) throw retryErr;
        return NextResponse.json({ ...retry, model: retry.name }, { status: 201 });
      }
      throw error;
    }


    return NextResponse.json({ ...newEquipment, model: newEquipment.name }, { status: 201 });

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
    if (body.nextMaintenance !== undefined) updateData.nextMaintenance = body.nextMaintenance;

    const { data: updated, error } = await supabase
      .from('Equipment')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error updating equipment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }


    return NextResponse.json({ ...updated, model: updated.name });

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

    if (error) {
      console.error("Supabase error deleting equipment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }


    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
