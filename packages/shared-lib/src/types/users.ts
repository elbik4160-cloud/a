export interface UserDTO {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
  status: string;
  requestedRole: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "admin" | "sales";
