export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  roles: Role[];
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING'
}