import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string;
  setUserRole: (role: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: 'admin',
  setUserRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>(localStorage.getItem('userRole') || 'admin');
  const navigate = useNavigate();
  const location = useLocation();

  // Store role in localStorage when it changes
  useEffect(() => {
    if (userRole) {
      localStorage.setItem('userRole', userRole);
    }
  }, [userRole]);

  useEffect(() => {
    // Get persistence preference
    const persistSession = localStorage.getItem('persistSession') === 'true';

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('userRole');
          navigate('/auth');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Get role from localStorage
          const storedRole = localStorage.getItem('userRole') || 'admin';
          setUserRole(storedRole);
          
          // Check if the current path is the congratulations page
          const isOnCongratulationsPage = location.pathname.includes('/congratulations');
          
          // Only redirect if not already on the congratulations page
          if (!isOnCongratulationsPage) {
            // Redirect to the appropriate dashboard based on role
            if (storedRole === 'admin') {
              navigate('/');
            } else {
              navigate('/user-dashboard');
            }
          }
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // If there's a session but we're not supposed to persist,
      // sign out if that preference was changed
      if (session && !persistSession) {
        // Keep session for current browser session but don't persist on reload
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
