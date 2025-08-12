import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, MapPin, User } from 'lucide-react';

interface Customer {
  userId: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

interface CustomerRegistrationProps {
  onRegistrationComplete: (customer: Customer) => void;
}

export function CustomerRegistration({ onRegistrationComplete }: CustomerRegistrationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [step, setStep] = useState<'phone' | 'name' | 'location'>('phone');
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  // Check for existing customer data on mount
  useEffect(() => {
    const checkExistingCustomer = async () => {
      try {
        const storedUserId = localStorage.getItem('beu_customer_userId');
        if (storedUserId) {
          console.log('Found stored userId:', storedUserId);
          
          // Try to fetch customer data from backend
          const response = await fetch(`/api/customer/${storedUserId}`);
          if (response.ok) {
            const { customer } = await response.json();
            console.log('Found existing customer:', customer);
            
            setExistingCustomer(customer);
            // Skip registration and go directly to location request
            onRegistrationComplete(customer);
            return;
          } else {
            // Clear invalid userId
            localStorage.removeItem('beu_customer_userId');
            console.log('Invalid stored userId, cleared from localStorage');
          }
        }
      } catch (error) {
        console.error('Error checking existing customer:', error);
        localStorage.removeItem('beu_customer_userId');
      }
    };

    checkExistingCustomer();
  }, [onRegistrationComplete]);

  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number to continue",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Check if customer already exists with this phone number
      const checkResponse = await fetch(`/api/customer/phone/${phoneNumber}`);
      
      if (checkResponse.ok) {
        const { customer } = await checkResponse.json();
        console.log('Found existing customer by phone:', customer);
        
        // Store userId in localStorage
        localStorage.setItem('beu_customer_userId', customer.userId);
        
        setExistingCustomer(customer);
        onRegistrationComplete(customer);
        
        toast({
          title: "Welcome back!",
          description: "Using your existing account",
        });
        return;
      }
      
      // New customer, proceed to name collection
      setStep('name');
    } catch (error) {
      console.error('Error checking customer phone:', error);
      toast({
        title: "Error",
        description: "Failed to verify phone number. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameSubmit = async () => {
    if (!firstName.trim()) {
      toast({
        title: "First name required",
        description: "Please enter your first name",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Register new customer
      const registerResponse = await fetch('/api/customer/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          telegramUserId: (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString(),
          telegramUsername: (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.username
        })
      });

      if (registerResponse.ok) {
        const { customer } = await registerResponse.json();
        console.log('New customer registered:', customer);
        
        // Store userId in localStorage for future visits
        localStorage.setItem('beu_customer_userId', customer.userId);
        
        setExistingCustomer(customer);
        onRegistrationComplete(customer);
        
        toast({
          title: "Registration successful!",
          description: "Your account has been created",
        });
      } else {
        const errorData = await registerResponse.json();
        throw new Error(errorData.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering customer:', error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Add Ethiopia country code if not present
    if (digits.length > 0 && !digits.startsWith('251')) {
      return '251' + digits;
    }
    
    return digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  if (existingCustomer) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <User className="h-5 w-5" />
            Welcome Back!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-semibold">{existingCustomer.firstName} {existingCustomer.lastName}</p>
            <p className="text-sm text-muted-foreground">{existingCustomer.phoneNumber}</p>
          </div>
          <Button 
            onClick={() => onRegistrationComplete(existingCustomer)}
            className="w-full"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Continue to Order
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'phone') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Phone className="h-5 w-5" />
            Welcome to BeU Delivery
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your phone number to get started
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="251912345678"
              value={phoneNumber}
              onChange={handlePhoneChange}
              disabled={isLoading}
              className="text-center"
            />
            <p className="text-xs text-muted-foreground text-center">
              Format: 251XXXXXXXXX (Ethiopian numbers)
            </p>
          </div>
          
          <Button 
            onClick={handlePhoneSubmit}
            disabled={isLoading || !phoneNumber.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'name') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <User className="h-5 w-5" />
            Tell us your name
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This will help us personalize your experience
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Enter your last name (optional)"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setStep('phone')}
              disabled={isLoading}
              className="flex-1"
            >
              Back
            </Button>
            <Button 
              onClick={handleNameSubmit}
              disabled={isLoading || !firstName.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}