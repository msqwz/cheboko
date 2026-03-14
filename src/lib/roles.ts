export const ROLE_HIERARCHY: Record<string, string[]> = {
  ADMIN: ["OPERATOR", "REGIONAL_MANAGER", "CLIENT_NETWORK_HEAD", "ENGINEER", "CLIENT_POINT_MANAGER", "CLIENT_SPECIALIST"],
  OPERATOR: ["CLIENT_NETWORK_HEAD", "ENGINEER", "CLIENT_POINT_MANAGER", "CLIENT_SPECIALIST"], // Не может приглашать REGIONAL_MANAGER
  REGIONAL_MANAGER: ["ENGINEER"],
  CLIENT_NETWORK_HEAD: ["CLIENT_POINT_MANAGER"],
  CLIENT_POINT_MANAGER: ["CLIENT_SPECIALIST"],
};

export function getRoleText(role: string): string {
  switch (role) {
    case 'ADMIN': return 'Администратор';
    case 'OPERATOR': return 'Оператор';
    case 'ENGINEER': return 'Инженер';
    case 'REGIONAL_MANAGER': return 'Менеджер региона';
    case 'CLIENT_NETWORK_HEAD': return 'Руководитель сети';
    case 'CLIENT_POINT_MANAGER': return 'Управляющий';
    case 'CLIENT_SPECIALIST': return 'Специалист';
    default: return role;
  }
}
