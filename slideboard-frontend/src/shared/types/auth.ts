import { Session } from '@supabase/supabase-js';
import { User } from './user';

export * from './user';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
}

export interface LoginCredentials {
  phone: string;
  password?: string;
  verificationCode?: string;
}

export interface RegisterData {
  phone: string;
  password?: string;
  name: string;
  email?: string;
}
