import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

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
  userRole: '',
  setUserRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const navigate = useNavigate();

  // Fetch user role from database whenever user changes
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole('');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          return;
        }

        if (data) {
          console.log('User role fetched:', data.role);
          setUserRole(data.role);
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
      }
    };

    fetchUserRole();
  }, [user]);

  useEffect(() => {
    // Get persistence preference
    const persistSession = localStorage.getItem('persistSession') === 'true';

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          setUserRole('');
          navigate('/auth');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Role-based navigation will happen after role is fetched in the useEffect above
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
  }, [navigate]);

  // Add effect to navigate based on role changes
  useEffect(() => {
    if (user && userRole && !loading) {
      console.log('Navigating based on role:', userRole);
      
      // Only navigate if the user is on a route they shouldn't be on
      const currentPath = window.location.pathname;
      const isOnAdminRoute = currentPath === '/' || currentPath.startsWith('/customers') || 
                            currentPath.startsWith('/shipments') || currentPath.startsWith('/proof-of-delivery');
      const isOnUserRoute = currentPath.startsWith('/user-dashboard');
      
      if ((userRole === 'admin' && isOnUserRoute) || (userRole === 'user' && isOnAdminRoute)) {
        const redirectPath = userRole === 'admin' ? '/' : '/user-dashboard';
        navigate(redirectPath);
      }
    }
  }, [user, userRole, loading, navigate]);

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
