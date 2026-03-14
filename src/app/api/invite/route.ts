import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ROLE_HIERARCHY } from "@/lib/roles";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, role, phone, region } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email и роль обязательны" }, { status: 400 });
    }

    // Role safety check - can the invoker invite this role?
    const invokerRole = (session.user as any).role;
    const allowedRoles = ROLE_HIERARCHY[invokerRole] || [];
    
    // Admin can do anything, or we check against hierarchy
    if (invokerRole !== 'ADMIN' && !allowedRoles.includes(role)) {
       return NextResponse.json({ error: `Роль '${invokerRole}' не имеет прав приглашать '${role}'` }, { status: 403 });
    }

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
       // If exists, maybe we should just update invitation token if not verified?
       // For now, return error as per usual business logic
       return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 400 });
    }

    // 2. Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // 3. Create user in DB (isVerified: false, has no password yet)
    const { data: newUser, error: createError } = await supabase
      .from('User')
      .insert({
        id: crypto.randomUUID(),
        name,
        email,
        phone,
        role,
        address: region,
        password: "INVITED_USER", // Placeholder until they set it
        isVerified: false,
        invitationToken,
        invitationExpires,
      })
      .select()
      .single();

    if (createError) {
      console.error("[INVITE] Create error:", createError);
      return NextResponse.json({ error: createError.message || "Ошибка при создании приглашения" }, { status: 500 });
    }

    const inviteLink = `${process.env.NEXTAUTH_URL}/invite/${invitationToken}`;

    return NextResponse.json({ 
      success: true, 
      inviteLink 
    });

  } catch (error) {
    console.error("[INVITE] General error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
