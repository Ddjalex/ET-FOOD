import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Building2, Truck, DollarSign, Plus, UserPlus, Settings, Upload, Eye, EyeOff, CheckCircle, XCircle, MapPin, Clock, Edit, Trash2, MessageSquare, X, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useLocation } from 'wouter';
import DriversMap from '@/components/DriversMap';

interface DashboardStats {
  totalRestaurants: number;
  activeRestaurants: number;
  totalDrivers: number;
  activeDrivers: number;
  pendingDrivers: number;
  totalOrders: number;
  revenue: number;
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  email?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  isApproved: boolean;
  rating: string;
  totalOrders: number;
  createdAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  restaurantId?: string;
  isActive: boolean;
  createdAt: string;
  restaurant?: {
    name: string;
  };
}

interface Driver {
  id: string;
  userId: string;
  licenseNumber: string;
  vehicleType: string;
  vehiclePlate: string;
  licenseImageUrl?: string;
  vehicleImageUrl?: string;
  idCardImageUrl?: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  isOnline: boolean;
  isAvailable: boolean;
  isApproved: boolean;
  rating: string;
  totalDeliveries: number;
  totalEarnings: string;
  zone?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
}

// Form schemas
const restaurantFormSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required'),
  address: z.string().min(1, 'Address is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal(''))
});

const adminFormSchema = z.object({
  email: z.string().email('Valid email is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  restaurantId: z.string().min(1, 'Restaurant selection is required')
});

const settingsFormSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  supportEmail: z.string().email('Valid email is required'),
  supportPhone: z.string().min(1, 'Phone number is required'),
  deliveryFee: z.number().min(0, 'Delivery fee must be positive'),
  maxDeliveryDistance: z.number().min(1, 'Distance must be positive'),
  orderTimeout: z.number().min(1, 'Timeout must be positive'),
  enableSMSNotifications: z.boolean(),
  enableEmailNotifications: z.boolean(),
  maintenanceMode: z.boolean()
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const profileUpdateSchema = z.object({
  email: z.string().email('Valid email is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  currentPassword: z.string().min(1, 'Current password is required for profile changes')
});

const broadcastMessageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  imageUrl: z.string().optional(),
  messageType: z.enum(['welcome', 'product', 'announcement', 'promotion']),
  targetAudience: z.enum(['all', 'customers', 'drivers'])
});

type RestaurantFormData = z.infer<typeof restaurantFormSchema>;
type AdminFormData = z.infer<typeof adminFormSchema>;
type SettingsFormData = z.infer<typeof settingsFormSchema>;
type PasswordChangeData = z.infer<typeof passwordChangeSchema>;
type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
type BroadcastMessageData = z.infer<typeof broadcastMessageSchema>;

interface SystemSettings {
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  deliveryFee: number;
  maxDeliveryDistance: number;
  orderTimeout: number;
  enableSMSNotifications: boolean;
  enableEmailNotifications: boolean;
  maintenanceMode: boolean;
  companyLogo?: string;
}

function SuperAdminDashboardContent() {
  const { user } = useAdminAuth();
  const [, navigate] = useLocation();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isRestaurantDialogOpen, setIsRestaurantDialogOpen] = useState(false);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [broadcastImageFile, setBroadcastImageFile] = useState<File | null>(null);
  const [broadcastImagePreview, setBroadcastImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const restaurantForm = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: '',
      address: '',
      phoneNumber: '',
      email: '',
      description: '',
      imageUrl: ''
    }
  });

  const adminForm = useForm<AdminFormData>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      restaurantId: ''
    }
  });

  const settingsForm = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      companyName: 'BeU Delivery',
      supportEmail: 'support@beu-delivery.com',
      supportPhone: '+251-911-123456',
      deliveryFee: 25.00,
      maxDeliveryDistance: 10,
      orderTimeout: 30,
      enableSMSNotifications: true,
      enableEmailNotifications: true,
      maintenanceMode: false
    }
  });

  const passwordForm = useForm<PasswordChangeData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const profileForm = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      email: user?.email || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      currentPassword: ''
    }
  });

  const broadcastForm = useForm<BroadcastMessageData>({
    resolver: zodResolver(broadcastMessageSchema),
    defaultValues: {
      title: '',
      message: '',
      imageUrl: '',
      messageType: 'announcement',
      targetAudience: 'all'
    }
  });

  // Queries
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: restaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ['/api/superadmin/restaurants'],
  });

  const { data: admins = [] } = useQuery<AdminUser[]>({
    queryKey: ['/api/superadmin/admins'],
  });

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['/api/superadmin/drivers'],
  });

  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });



  // Mutations
  const createRestaurantMutation = useMutation({
    mutationFn: (data: RestaurantFormData) => 
      fetch('/api/superadmin/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to create restaurant');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/restaurants'] });
      setIsRestaurantDialogOpen(false);
      restaurantForm.reset();
      toast({
        title: 'Success',
        description: 'Restaurant created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create restaurant',
        variant: 'destructive'
      });
    }
  });

  // Broadcast message mutation
  const broadcastMutation = useMutation({
    mutationFn: async (data: BroadcastMessageData & { image?: File }) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('message', data.message);
      formData.append('messageType', data.messageType);
      formData.append('targetAudience', data.targetAudience);
      if (data.image) {
        formData.append('image', data.image);
      }

      return fetch('/api/superadmin/broadcast', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to send broadcast');
        }
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: 'Broadcast sent successfully',
        description: 'Your message has been sent to the selected audience.',
      });
      broadcastForm.reset();
      setBroadcastImageFile(null);
      setBroadcastImagePreview(null);
      setIsBroadcastDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Broadcast failed',
        description: error.message || 'Failed to send broadcast message.',
        variant: 'destructive',
      });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: (data: AdminFormData) => 
      fetch('/api/superadmin/restaurant-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to create admin');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/admins'] });
      setIsAdminDialogOpen(false);
      adminForm.reset();
      toast({
        title: 'Success',
        description: 'Restaurant admin created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create admin',
        variant: 'destructive'
      });
    }
  });

  const onCreateRestaurant = (data: RestaurantFormData) => {
    createRestaurantMutation.mutate(data);
  };

  const onCreateAdmin = (data: AdminFormData) => {
    createAdminMutation.mutate(data);
  };

  const updateSettingsMutation = useMutation({
    mutationFn: (data: SettingsFormData) => 
      fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to update settings');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'Success',
        description: 'System settings updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive'
      });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordChangeData) => 
      fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to change password');
        }
        return res.json();
      }),
    onSuccess: () => {
      setIsPasswordDialogOpen(false);
      passwordForm.reset();
      toast({
        title: 'Success',
        description: 'Password changed successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive'
      });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileUpdateData) => 
      fetch(`/api/superadmin/admins/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to update profile');
        }
        return res.json();
      }),
    onSuccess: () => {
      setIsProfileDialogOpen(false);
      profileForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/me'] });
      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    }
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      return fetch('/api/upload/logo', {
        method: 'POST',
        credentials: 'include',
        body: formData
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to upload logo');
        }
        return res.json();
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'Success',
        description: 'Company logo uploaded successfully'
      });
      setLogoFile(null);
      setLogoPreview(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload logo',
        variant: 'destructive'
      });
    }
  });

  // Restaurant management mutations
  const updateRestaurantMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Restaurant> }) => 
      fetch(`/api/superadmin/restaurants/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to update restaurant');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/restaurants'] });
      setEditingRestaurant(null);
      toast({
        title: 'Success',
        description: 'Restaurant updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update restaurant',
        variant: 'destructive'
      });
    }
  });

  const blockRestaurantMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/superadmin/restaurants/${id}/block`, {
        method: 'POST',
        credentials: 'include',
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to block restaurant');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/restaurants'] });
      toast({
        title: 'Success',
        description: 'Restaurant blocked successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to block restaurant',
        variant: 'destructive'
      });
    }
  });

  const unblockRestaurantMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/superadmin/restaurants/${id}/unblock`, {
        method: 'POST',
        credentials: 'include',
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to unblock restaurant');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/restaurants'] });
      toast({
        title: 'Success',
        description: 'Restaurant unblocked successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unblock restaurant',
        variant: 'destructive'
      });
    }
  });

  const deleteRestaurantMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/superadmin/restaurants/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to delete restaurant');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/restaurants'] });
      toast({
        title: 'Success',
        description: 'Restaurant deleted successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete restaurant',
        variant: 'destructive'
      });
    }
  });

  // Admin management mutations
  const updateAdminMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<AdminUser> }) => 
      fetch(`/api/superadmin/admins/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to update admin');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/admins'] });
      setEditingAdmin(null);
      toast({
        title: 'Success',
        description: 'Admin updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update admin',
        variant: 'destructive'
      });
    }
  });

  const blockAdminMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/superadmin/admins/${id}/block`, {
        method: 'POST',
        credentials: 'include',
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to block admin');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/admins'] });
      toast({
        title: 'Success',
        description: 'Admin blocked successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to block admin',
        variant: 'destructive'
      });
    }
  });

  const unblockAdminMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/superadmin/admins/${id}/unblock`, {
        method: 'POST',
        credentials: 'include',
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to unblock admin');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/admins'] });
      toast({
        title: 'Success',
        description: 'Admin unblocked successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unblock admin',
        variant: 'destructive'
      });
    }
  });

  const deleteAdminMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/superadmin/admins/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to delete admin');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/admins'] });
      toast({
        title: 'Success',
        description: 'Admin deleted successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete admin',
        variant: 'destructive'
      });
    }
  });

  // Driver approval mutations
  const approveDriverMutation = useMutation({
    mutationFn: (driverId: string) => 
      fetch(`/api/superadmin/drivers/${driverId}/approve`, {
        method: 'POST',
        credentials: 'include',
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to approve driver');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/drivers'] });
      toast({
        title: 'Success',
        description: 'Driver approved successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve driver',
        variant: 'destructive'
      });
    }
  });

  const rejectDriverMutation = useMutation({
    mutationFn: (driverId: string) => 
      fetch(`/api/superadmin/drivers/${driverId}/reject`, {
        method: 'POST',
        credentials: 'include',
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to reject driver');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/drivers'] });
      toast({
        title: 'Success',
        description: 'Driver rejected'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject driver',
        variant: 'destructive'
      });
    }
  });

  const onUpdateSettings = (data: SettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  const onChangePassword = (data: PasswordChangeData) => {
    changePasswordMutation.mutate(data);
  };

  const onUpdateProfile = (data: ProfileUpdateData) => {
    updateProfileMutation.mutate(data);
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/superadmin-login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation anyway
      navigate('/superadmin-login');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage all restaurants, admins, and system operations</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Welcome, {(user as any)?.firstName || 'Super Admin'}
          </span>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'restaurants', label: 'Restaurants' },
          { id: 'admins', label: 'Admins' },
          { id: 'drivers', label: 'Drivers' },
          { id: 'broadcast', label: 'Broadcast Messages' },
          { id: 'settings', label: 'System Settings' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              selectedTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{restaurants.length}</div>
                <p className="text-xs text-muted-foreground">
                  {restaurants.filter(r => r.isActive).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{admins.length}</div>
                <p className="text-xs text-muted-foreground">
                  {admins.filter(a => a.role === 'restaurant_admin').length} restaurant admins
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
                <p className="text-xs text-muted-foreground">
                  All time orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.revenue || 0} ETB</div>
                <p className="text-xs text-muted-foreground">
                  Total revenue
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Restaurants</CardTitle>
                <CardDescription>Latest restaurant registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {restaurants.slice(0, 5).map((restaurant) => (
                    <div key={restaurant.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                      </div>
                      <Badge variant={restaurant.isActive ? 'default' : 'secondary'}>
                        {restaurant.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Admins</CardTitle>
                <CardDescription>Latest admin user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {admins.slice(0, 5).map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{admin.firstName} {admin.lastName}</p>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                      </div>
                      <Badge variant="outline">
                        {admin.role.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Restaurants Tab */}
      {selectedTab === 'restaurants' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Restaurant Management</h2>
            
            <Dialog open={isRestaurantDialogOpen} onOpenChange={setIsRestaurantDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Restaurant
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Restaurant</DialogTitle>
                  <DialogDescription>
                    Add a new restaurant to the platform.
                  </DialogDescription>
                </DialogHeader>
                <Form {...restaurantForm}>
                  <form onSubmit={restaurantForm.handleSubmit(onCreateRestaurant)} className="space-y-4">
                    <FormField
                      control={restaurantForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restaurant Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter restaurant name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={restaurantForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter full address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={restaurantForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={restaurantForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={restaurantForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter logo URL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsRestaurantDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createRestaurantMutation.isPending}>
                        {createRestaurantMutation.isPending ? 'Creating...' : 'Create Restaurant'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Restaurants</CardTitle>
              <CardDescription>Manage restaurant listings and status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restaurants.map((restaurant) => (
                    <TableRow key={restaurant.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{restaurant.name}</p>
                          <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{restaurant.phoneNumber}</p>
                          {restaurant.email && (
                            <p className="text-sm text-muted-foreground">{restaurant.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={restaurant.isActive ? 'default' : 'secondary'}>
                          {restaurant.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{restaurant.totalOrders}</TableCell>
                      <TableCell>⭐ {restaurant.rating}</TableCell>
                      <TableCell>{new Date(restaurant.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingRestaurant(restaurant);
                              restaurantForm.reset({
                                name: restaurant.name,
                                address: restaurant.address,
                                phoneNumber: restaurant.phoneNumber,
                                email: restaurant.email || '',
                                description: restaurant.description || '',
                                imageUrl: restaurant.imageUrl || ''
                              });
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {restaurant.isActive ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => blockRestaurantMutation.mutate(restaurant.id)}
                              disabled={blockRestaurantMutation.isPending}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => unblockRestaurantMutation.mutate(restaurant.id)}
                              disabled={unblockRestaurantMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${restaurant.name}"? This action cannot be undone.`)) {
                                deleteRestaurantMutation.mutate(restaurant.id);
                              }
                            }}
                            disabled={deleteRestaurantMutation.isPending}
                            data-testid={`button-delete-restaurant-${restaurant.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Edit Restaurant Dialog */}
          {editingRestaurant && (
            <Dialog open={!!editingRestaurant} onOpenChange={() => setEditingRestaurant(null)}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Restaurant</DialogTitle>
                  <DialogDescription>
                    Update restaurant information.
                  </DialogDescription>
                </DialogHeader>
                <Form {...restaurantForm}>
                  <form onSubmit={restaurantForm.handleSubmit((data) => {
                    updateRestaurantMutation.mutate({ 
                      id: editingRestaurant.id, 
                      data 
                    });
                  })} className="space-y-4">
                    <FormField
                      control={restaurantForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restaurant Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={restaurantForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={restaurantForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={restaurantForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setEditingRestaurant(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateRestaurantMutation.isPending}>
                        {updateRestaurantMutation.isPending ? 'Updating...' : 'Update Restaurant'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {/* Admins Tab */}
      {selectedTab === 'admins' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Admin Management</h2>
            
            <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create New Restaurant Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Restaurant Admin</DialogTitle>
                  <DialogDescription>
                    Create a new admin user for a restaurant.
                  </DialogDescription>
                </DialogHeader>
                <Form {...adminForm}>
                  <form onSubmit={adminForm.handleSubmit(onCreateAdmin)} className="space-y-4">
                    <FormField
                      control={adminForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={adminForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="First name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={adminForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={adminForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={adminForm.control}
                      name="restaurantId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restaurant</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a restaurant" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {restaurants.map((restaurant) => (
                                <SelectItem key={restaurant.id} value={restaurant.id}>
                                  {restaurant.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsAdminDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createAdminMutation.isPending}>
                        {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Admin Users</CardTitle>
              <CardDescription>Manage admin users and their restaurant assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.firstName} {admin.lastName}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {admin.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {admin.restaurantId ? (
                          restaurants.find(r => r.id === admin.restaurantId)?.name || 'Unknown'
                        ) : (
                          <span className="text-muted-foreground">No restaurant assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.isActive ? 'default' : 'secondary'}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingAdmin(admin);
                              adminForm.reset({
                                email: admin.email,
                                firstName: admin.firstName,
                                lastName: admin.lastName,
                                password: '', // Don't pre-fill password for security
                                restaurantId: admin.restaurantId || ''
                              });
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {admin.isActive ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => blockAdminMutation.mutate(admin.id)}
                              disabled={blockAdminMutation.isPending}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => unblockAdminMutation.mutate(admin.id)}
                              disabled={unblockAdminMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${admin.firstName} ${admin.lastName}"? This action cannot be undone.`)) {
                                deleteAdminMutation.mutate(admin.id);
                              }
                            }}
                            disabled={deleteAdminMutation.isPending}
                            data-testid={`button-delete-admin-${admin.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Edit Admin Dialog */}
          {editingAdmin && (
            <Dialog open={!!editingAdmin} onOpenChange={() => setEditingAdmin(null)}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Admin User</DialogTitle>
                  <DialogDescription>
                    Update admin user information.
                  </DialogDescription>
                </DialogHeader>
                <Form {...adminForm}>
                  <form onSubmit={adminForm.handleSubmit((data) => {
                    updateAdminMutation.mutate({ 
                      id: editingAdmin.id, 
                      data: {
                        email: data.email,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        restaurantId: data.restaurantId
                      }
                    });
                  })} className="space-y-4">
                    <FormField
                      control={adminForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={adminForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={adminForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={adminForm.control}
                      name="restaurantId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restaurant</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a restaurant" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {restaurants.map((restaurant) => (
                                <SelectItem key={restaurant.id} value={restaurant.id}>
                                  {restaurant.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setEditingAdmin(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateAdminMutation.isPending}>
                        {updateAdminMutation.isPending ? 'Updating...' : 'Update Admin'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {/* Drivers Tab */}
      {selectedTab === 'drivers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Driver Management</h2>
          </div>

          {/* Driver Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{drivers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {drivers.filter(d => !d.isApproved).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Online Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {drivers.filter(d => d.isOnline && d.isApproved).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Available Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {drivers.filter(d => d.isAvailable && d.isApproved).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Driver Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Live Driver Locations
              </CardTitle>
              <CardDescription>Real-time tracking of active drivers</CardDescription>
            </CardHeader>
            <CardContent>
              <DriversMap drivers={drivers} />
            </CardContent>
          </Card>

          {/* Pending Driver Approvals */}
          {drivers.filter(d => !d.isApproved).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pending Driver Approvals
                </CardTitle>
                <CardDescription>
                  Review and approve driver applications from Telegram bot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {drivers.filter(d => !d.isApproved).map((driver) => (
                    <div key={driver.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {driver.user?.firstName} {driver.user?.lastName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {driver.user?.email} • {driver.user?.phoneNumber}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">License:</span>
                              <p>{driver.licenseNumber}</p>
                            </div>
                            <div>
                              <span className="font-medium">Vehicle Type:</span>
                              <p className="capitalize">{driver.vehicleType}</p>
                            </div>
                            <div>
                              <span className="font-medium">Vehicle Plate:</span>
                              <p>{driver.vehiclePlate}</p>
                            </div>
                            <div>
                              <span className="font-medium">Zone:</span>
                              <p>{driver.zone || 'Not assigned'}</p>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Applied: {new Date(driver.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => approveDriverMutation.mutate(driver.id)}
                            disabled={approveDriverMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {approveDriverMutation.isPending ? 'Approving...' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectDriverMutation.mutate(driver.id)}
                            disabled={rejectDriverMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            {rejectDriverMutation.isPending ? 'Rejecting...' : 'Reject'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Drivers Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Drivers</CardTitle>
              <CardDescription>Complete list of registered drivers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver Info</TableHead>
                    <TableHead>Vehicle Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {driver.user?.firstName} {driver.user?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {driver.user?.phoneNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium capitalize">{driver.vehicleType}</p>
                          <p className="text-sm text-muted-foreground">{driver.vehiclePlate}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={driver.isApproved ? 'default' : 'secondary'}>
                            {driver.isApproved ? 'Approved' : 'Pending'}
                          </Badge>
                          {driver.isApproved && (
                            <div className="flex gap-1">
                              <Badge variant={driver.isOnline ? 'default' : 'outline'} className="text-xs">
                                {driver.isOnline ? 'Online' : 'Offline'}
                              </Badge>
                              {driver.isAvailable && driver.isOnline && (
                                <Badge variant="outline" className="text-xs bg-green-50">
                                  Available
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>⭐ {driver.rating}</p>
                          <p className="text-muted-foreground">{driver.totalDeliveries} deliveries</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {driver.currentLocation ? (
                            <span className="text-green-600">📍 Live location</span>
                          ) : (
                            <span className="text-muted-foreground">No location</span>
                          )}
                          {driver.zone && (
                            <p className="text-muted-foreground text-xs">Zone: {driver.zone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(driver.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {selectedTab === 'settings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">System Settings</h2>
            
            <div className="flex gap-2">
              <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Update Profile</DialogTitle>
                    <DialogDescription>
                      Update your superadmin account information.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Enter your email" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your first name" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your last name" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showProfilePassword ? "text" : "password"} 
                                  placeholder="Enter current password for verification" 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowProfilePassword(!showProfilePassword)}
                                >
                                  {showProfilePassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={updateProfileMutation.isPending}>
                          {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Change Admin Password</DialogTitle>
                  <DialogDescription>
                    Update your superadmin account password.
                  </DialogDescription>
                </DialogHeader>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showCurrentPassword ? "text" : "password"} 
                                placeholder="Enter current password" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showNewPassword ? "text" : "password"} 
                                placeholder="Enter new password" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={changePasswordMutation.isPending}>
                        {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Update your company details and branding</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...settingsForm}>
                  <form onSubmit={settingsForm.handleSubmit(onUpdateSettings)} className="space-y-4">
                    <FormField
                      control={settingsForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="supportEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="support@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="supportPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+251-911-123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Company Logo Upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Company Logo</label>
                      <div className="space-y-4">
                        {logoPreview && (
                          <div className="flex items-center space-x-2">
                            <img 
                              src={logoPreview} 
                              alt="Current logo" 
                              className="h-12 w-12 object-contain border rounded"
                            />
                            <span className="text-sm text-muted-foreground">Current logo</span>
                          </div>
                        )}
                        
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        
                        {logoPreview && (
                          <div className="space-y-2">
                            <img 
                              src={logoPreview} 
                              alt="Logo preview" 
                              className="h-20 w-20 object-contain border rounded"
                            />
                            <Button 
                              type="button" 
                              onClick={handleLogoUpload}
                              disabled={uploadLogoMutation.isPending}
                              size="sm"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {uploadLogoMutation.isPending ? 'Uploading...' : 'Upload Logo'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button type="submit" disabled={updateSettingsMutation.isPending}>
                      {updateSettingsMutation.isPending ? 'Saving...' : 'Save Company Settings'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Delivery Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Configuration</CardTitle>
                <CardDescription>Configure delivery fees and operational settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...settingsForm}>
                  <form onSubmit={settingsForm.handleSubmit(onUpdateSettings)} className="space-y-4">
                    <FormField
                      control={settingsForm.control}
                      name="deliveryFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Delivery Fee (ETB)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="25.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="maxDeliveryDistance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Delivery Distance (KM)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="10"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="orderTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Timeout (Minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="30"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={updateSettingsMutation.isPending}>
                      {updateSettingsMutation.isPending ? 'Saving...' : 'Save Delivery Settings'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* System Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Manage notification settings and system maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onUpdateSettings)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Notification Settings</h4>
                      
                      <FormField
                        control={settingsForm.control}
                        name="enableSMSNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>SMS Notifications</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Send order updates via SMS
                              </div>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={settingsForm.control}
                        name="enableEmailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Email Notifications</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Send order confirmations via email
                              </div>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">System Status</h4>
                      
                      <FormField
                        control={settingsForm.control}
                        name="maintenanceMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Maintenance Mode</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Disable new orders temporarily
                              </div>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={updateSettingsMutation.isPending}>
                    {updateSettingsMutation.isPending ? 'Saving...' : 'Save System Settings'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAdminAuth();
  const [, navigate] = useLocation();

  // Auth check - early return to avoid hooks order issues
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user as any)?.role !== 'superadmin') {
    // Redirect based on user role
    if (isAuthenticated && user) {
      const userRole = (user as any)?.role;
      if (userRole === 'restaurant_admin') {
        navigate('/admin');
        return null;
      } else if (userRole === 'kitchen_staff') {
        navigate('/kitchen');
        return null;
      }
    }
    navigate('/superadmin-login');
    return null;
  }

  return <SuperAdminDashboardContent />;
}