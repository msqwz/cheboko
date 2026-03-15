import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const allowedRoles = ['ADMIN', 'OPERATOR', 'REGIONAL_MANAGER'];

    if (!session?.user || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from('User')
      .select('*')
      .order('createdAt', { ascending: true });

    // Изоляция для менеджера региона
    if (session.user.role === 'REGIONAL_MANAGER') {
      const region = session.user.region;
      if (region) {
        query = query.eq('address', region);
      } else {
        return NextResponse.json([]);
      }
    }

    const { data: allUsers, error } = await query;



    if (error) throw error;

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const allowedRoles = ['ADMIN', 'REGIONAL_MANAGER'];
    if (!session?.user || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const body = await req.json();
    const { name, email, role, phone, region } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Name, email and role are required" }, { status: 400 });
    }

    // Дополнительные проверки для Менеджера Региона
    if ((session.user.role as string) === 'REGIONAL_MANAGER') {

      if (role !== 'ENGINEER') {
        return NextResponse.json({ error: "Менеджер региона может приглашать только Инженеров" }, { status: 403 });
      }
      if (region !== session.user.region) {
        return NextResponse.json({ error: "Менеджер региона может приглашать сотрудников только в свой регион" }, { status: 403 });
      }
    }


    const { data: existing } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Создаём пользователя через систему приглашений (без пароля)
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: newUser, error } = await supabase
      .from('User')
      .insert({
        id: crypto.randomUUID(),
        name,
        email,
        role,
        phone,
        address: region,
        password: "INVITED_USER",
        isVerified: false,
        invitationToken,
        invitationExpires,
      })
      .select()
      .single();

    if (error) throw error;

    const inviteLink = `${process.env.NEXTAUTH_URL}/invite/${invitationToken}`;
    return NextResponse.json({ ...newUser, inviteLink }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const allowedRoles = ['ADMIN', 'OPERATOR', 'REGIONAL_MANAGER'];
    if (!session?.user || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const body = await req.json();
    const { id, name, email, role, phone, region } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (phone) updateData.phone = phone;
    if (region) updateData.address = region;

    // Проверка прав на редактирование для Регионального менеджера
    if (session.user.role === 'REGIONAL_MANAGER') {
       const { data: targetUser } = await supabase.from('User').select('role, address').eq('id', id).single();
       if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
       if (targetUser.role !== 'ENGINEER' || targetUser.address !== session.user.region) {
         return NextResponse.json({ error: "Вы можете редактировать только инженеров вашего региона" }, { status: 403 });
       }
       // Запрещаем менять роль на что-то кроме инженера
       if (role && role !== 'ENGINEER') {
          return NextResponse.json({ error: "Вы не можете изменить роль на отличную от Инженера" }, { status: 403 });
       }
       // Запрещаем менять регион
       if (region && region !== session.user.region) {
          return NextResponse.json({ error: "Вы не можете изменить регион" }, { status: 403 });
       }
    }

    const { data: updated, error } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();


    if (error) throw error;

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const allowedRoles = ['ADMIN', 'REGIONAL_MANAGER'];
    if (!session?.user || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Проверка прав на удаление для Регионального менеджера
    if ((session.user.role as string) === 'REGIONAL_MANAGER') {

       const { data: targetUser } = await supabase.from('User').select('role, address').eq('id', id).single();
       if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
       if (targetUser.role !== 'ENGINEER' || targetUser.address !== session.user.region) {
         return NextResponse.json({ error: "Вы можете удалять только инженеров вашего региона" }, { status: 403 });
       }
    }

    const { error } = await supabase
      .from('User')
      .delete()
      .eq('id', id);


    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
