import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { setUserAsDriver } from '../features/fleet/fleetSlice';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// Define our App's Role types
export type UserRole = 'ADMIN' | 'DRIVER';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Hardcoded admin email as per requirements
const ADMIN_EMAIL = 'umeshtejas2004@gmail.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const handleSession = (session: Session | null) => {
    if (session?.user) {
      const u = session.user;
      const role: UserRole = u.email === ADMIN_EMAIL ? 'ADMIN' : 'DRIVER';
      const name = u.user_metadata?.name || u.email || 'User';
      
      const appUser: AppUser = {
        id: u.id,
        email: u.email || '',
        name: name,
        role: role
      };
      
      setUser(appUser);
      
      if (role === 'DRIVER') {
        dispatch(setUserAsDriver({ name }));
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string) => {
    // If someone tries to sign up as admin, we can block it or let it proceed 
    // and naturally get assigned the ADMIN role due to our logic.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    if (error) throw error;
  };

  const signInGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
  };

  const logOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
