
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Store role and persist session if remember me is checked
        if (rememberMe) {
          localStorage.setItem('persistSession', 'true');
        } else {
          localStorage.removeItem('persistSession');
        }
        
        localStorage.setItem('userRole', role);
        setUserRole(role);
        
        // Navigate based on role
        if (role === 'admin') {
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

  return <div className="min-h-screen flex items-center justify-center bg-cyber-dark">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/5 backdrop-blur-lg rounded-lg border border-cyber-neon/20 px-[32px] mx-[32px] my-0">
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

          <div className="space-y-3">
            <Label className="text-white">Select Role</Label>
            <RadioGroup value={role} onValueChange={setRole} className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin" className="text-white">Admin</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="user" />
                <Label htmlFor="user" className="text-white">User</Label>
              </div>
            </RadioGroup>
          </div>
          
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
