import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/components/AuthProvider';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [role, setRole] = useState('admin');
  const navigate = useNavigate();
  const { setUserRole } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const {
          data: { session },
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Store persist session preference
        localStorage.setItem('persistSession', rememberMe ? 'true' : 'false');
        
        // Fetch the user's role from the database
        const { data: userData, error: userError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        if (userError) {
          console.error("Error fetching user role:", userError);
          // Default to user role if there's an error
          localStorage.setItem('userRole', 'user');
          setUserRole('user');
          navigate('/user-dashboard');
          return;
        }
        
        const userRole = userData?.role || 'user'; // Default to 'user' if no role found
        
        // Store the fetched role
        localStorage.setItem('userRole', userRole);
        setUserRole(userRole);
        
        console.log("Login successful with fetched role:", userRole);
        
        // Navigate based on the fetched role
        if (userRole === 'admin') {
          navigate('/');
        } else {
          navigate('/user-dashboard');
        }
      } else {
        const {
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role,
              emailRedirectTo:'https://logistics-and-distributions-cyber-route.vercel.app/congratulations'
            }
          }
        });
        if (error) throw error;
        toast({
          title: "Success!",
          description: "Please check your email to confirm your account."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative before:content-[''] before:absolute before:inset-0 before:bg-black before:opacity-50" style={{ backgroundImage: 'url("/background-theme.png")' }}>
      <div className="w-full max-w-md p-8 space-y-6 bg-white/5 backdrop-blur-lg rounded-lg border border-cyber-neon/20 px-[32px] mx-[32px] my-0 relative z-10">
        <h2 className="text-2xl font-bold text-center text-white">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-white/10 border-cyber-neon/30 text-white" />
          </div>
          <div>
            <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-white/10 border-cyber-neon/30 text-white" />
          </div>

          {/* <div className="space-y-3">
            <Label className="text-white">Select Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-white/10 border-cyber-neon/30 text-white">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-white/90 text-black border-cyber-neon/30">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
          
          {isLogin && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="rememberMe" 
                checked={rememberMe} 
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <label htmlFor="rememberMe" className="text-sm text-white cursor-pointer">
                Remember me
              </label>
            </div>
          )}
          
          <Button type="submit" disabled={loading} className="w-full bg-cyber-neon text-black hover:bg-cyber-neon/80">
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full text-sm text-cyber-neon hover:underline">
          {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>;
}
