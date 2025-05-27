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
  const [userRole, setUserRole] = useState<string>(() => {
    try {
      return localStorage.getItem('userRole') || 'admin';
    } catch {
      return 'admin';
    }
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Store role in localStorage when it changes
  useEffect(() => {
    if (userRole) {
      try {
        localStorage.setItem('userRole', userRole);
      } catch (err) {
        console.warn("Failed to save user role to localStorage:", err);
      }
    }
  }, [userRole]);

  // Single fallback timeout to prevent infinite loading
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      console.warn("Auth initialization timeout - forcing loading to false");
      setLoading(false);
    }, 8000); // 8 second timeout

    return () => clearTimeout(fallbackTimeout);
  }, []);  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    // Get persistence preference
    const persistSession = (() => {
      try {
        return localStorage.getItem('persistSession') === 'true';
      } catch {
        return false;
      }
    })();

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
          return 'user';
        }
        
        return data?.role || 'user';
      } catch (err) {
        console.error("Unexpected error fetching role:", err);
        return 'user';
      }
    };

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth state...");
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          try {
            const currentRole = await fetchUserRole(session.user.id);
            if (mounted) {
              setUserRole(currentRole);
              try {
                localStorage.setItem('userRole', currentRole);
              } catch (err) {
                console.warn("Failed to save user role to localStorage:", err);
              }
            }
          } catch (roleError) {
            console.error("Error fetching role during initialization:", roleError);
            const cachedRole = (() => {
              try {
                return localStorage.getItem('userRole') || 'user';
              } catch {
                return 'user';
              }
            })();
            if (mounted) {
              setUserRole(cachedRole);
            }
          }
        }
        
        if (mounted) {
          console.log("Auth initialization complete, setting loading to false");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error during auth initialization:", err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const setupAuthListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;
          
          console.log("Auth state change event:", event, "Session:", !!session);
          
          try {
            setSession(session);
            setUser(session?.user ?? null);
            
            if (event === 'SIGNED_OUT') {
              try {
                localStorage.removeItem('userRole');
              } catch (err) {
                console.warn("Failed to remove user role from localStorage:", err);
              }
              setUserRole('');
              navigate('/auth');
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              if (session?.user?.id) {
                const currentRole = await fetchUserRole(session.user.id);
                if (mounted) {
                  setUserRole(currentRole);
                  try {
                    localStorage.setItem('userRole', currentRole);
                  } catch (err) {
                    console.warn("Failed to save user role to localStorage:", err);
                  }
                  
                  const isOnCongratulationsPage = location.pathname.includes('/congratulations');
                  
                  if (!isOnCongratulationsPage) {
                    console.log("Redirecting based on role:", currentRole);
                    if (currentRole === 'admin') {
                      navigate('/');
                    } else {
                      navigate('/user-dashboard');
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error("Error in auth state change handler:", err);
          } finally {
            if (mounted && event !== 'TOKEN_REFRESHED') {
              setLoading(false);
            }
          }
        }
      );
      
      authSubscription = subscription;
      return subscription;
    };

    // Initialize auth and set up listener
    initializeAuth().then(() => {
      if (mounted) {
        setupAuthListener();
      }
    });

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
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
