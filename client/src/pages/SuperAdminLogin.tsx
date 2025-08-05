import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';

export default function SuperAdminLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Login successful'
      });
      
      // Only allow superadmin users
      if (data.user?.role === 'superadmin') {
        navigate('/superadmin');
      } else {
        toast({
          title: 'Access Denied',
          description: 'This login is only for superadmin users. Restaurant admin and kitchen staff should use the restaurant admin login page.',
          variant: 'destructive'
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Login failed',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    loginMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">BeU Delivery</CardTitle>
          <CardDescription>
            Superadmin Login Only
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          
          <div className="mt-6 space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Superadmin Credentials:</h4>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Email: alm@gmail.com<br />
                Password: beu123
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <p className="text-sm text-amber-600 dark:text-amber-300">
                <strong>Kitchen Staff & Restaurant Admin:</strong><br />
                Please use the <a href="/restaurant-admin-login" className="underline">Restaurant Admin Login</a> page instead.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}