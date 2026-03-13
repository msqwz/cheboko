import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/notifications - получить уведомления пользователя
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: allNotifications, error } = await supabase
      .from('Notification')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })
      .limit(50);

    if (error) throw error;

    const unreadNotifications = allNotifications.filter(n => !n.read);

    return NextResponse.json({
      notifications: allNotifications,
      unreadCount: unreadNotifications.length
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/notifications - отметить как прочитанные
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      const { error } = await supabase
        .from('Notification')
        .update({ read: true })
        .eq('userId', session.user.id);

      if (error) throw error;
    } else if (notificationId) {
      const { error } = await supabase
        .from('Notification')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/notifications - создать уведомление (для внутренних событий)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'OPERATOR'].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, type, title, description } = body;

    if (!userId || !title) {
      return NextResponse.json(
        { error: "userId и title обязательны" },
        { status: 400 }
      );
    }

    const { data: notification, error } = await supabase
      .from('Notification')
      .insert({
        id: crypto.randomUUID(),
        userId,
        message: `${title}: ${description || ''}`,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/notifications - удалить уведомление
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: "notificationId required" }, { status: 400 });
    }

    const { data: notification } = await supabase
      .from('Notification')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from('Notification')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
