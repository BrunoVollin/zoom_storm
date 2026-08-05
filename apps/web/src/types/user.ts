export interface SessionUser {
  subject: string;
  name?: string;
  email?: string;
  roles: string[];
}
