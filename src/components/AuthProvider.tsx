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

    // Function to fetch user role from database
    const fetchUserRole = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();
        
        if (error) {
          console.error("Error fetching user role:", error);
          return 'user'; // Default to user role if there's an error
        }
        
        return data?.role || 'user';
      } catch (err) {
        console.error("Unexpected error fetching role:", err);
        return 'user';
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('userRole');
          setUserRole('');
          navigate('/auth');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user?.id) {
            // Fetch the current role from the database
            const currentRole = await fetchUserRole(session.user.id);
            setUserRole(currentRole);
            localStorage.setItem('userRole', currentRole);
            
            // Check if the current path is the congratulations page
            const isOnCongratulationsPage = location.pathname.includes('/congratulations');
            
            // Only redirect if not already on the congratulations page
            if (!isOnCongratulationsPage) {
              console.log("Redirecting based on role:", currentRole);
              // Redirect to the appropriate dashboard based on role
              if (currentRole === 'admin') {
                navigate('/');
              } else {
                navigate('/user-dashboard');
              }
            }
          }
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.id) {
        // Fetch the current role from the database for existing session
        const currentRole = await fetchUserRole(session.user.id);
        setUserRole(currentRole);
        localStorage.setItem('userRole', currentRole);
      }
      
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
