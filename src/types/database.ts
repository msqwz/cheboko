export interface User {
  id: string;
  name: string | null;
  email: string;
  password: string;
  role: 'ADMIN' | 'OPERATOR' | 'REGIONAL_MANAGER' | 'CLIENT_NETWORK_HEAD' | 'CLIENT_POINT_MANAGER' | 'CLIENT_SPECIALIST' | 'ENGINEER' | 'CLIENT_MANAGER';
  phone: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  
  // Verification fields
  isVerified?: boolean;
  verificationCode?: string | null;
  verificationExpires?: string | null;
  invitationToken?: string | null;
  invitationExpires?: string | null;
  isDeleted?: boolean;
  resetToken?: string | null;
  resetExpires?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  name: string;
  legalName?: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  serialNumber: string | null;
  locationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: 'CREATED' | 'OPENED' | 'REJECTED' | 'ASSIGNED' | 'ENROUTE' | 'IN_WORK' | 'COMPLETED' | 'ON_HOLD' | 'CANCELED' | 'OPEN';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  clientId: string;
  creatorId: string | null;
  engineerId: string | null;
  locationId: string | null;
  equipmentId: string | null;
  attachments: string[] | null;
  photos?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  ticketId: string | null;
  createdAt: string;
}

export interface Settings {
  id: string;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  notificationsEnabled: boolean;
  updatedAt: string;
}
