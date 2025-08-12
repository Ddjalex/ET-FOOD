import { useState, useEffect } from 'react';
import { CustomerRegistration } from './CustomerRegistration';
import { CustomerOrder } from './CustomerOrder';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Customer {
  userId: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export function CustomerApp() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing customer on app load
  useEffect(() => {
    const checkExistingCustomer = async () => {
      try {
        const storedUserId = localStorage.getItem('beu_customer_userId');
        if (storedUserId) {
          console.log('🔍 Checking existing customer with userId:', storedUserId);
          
          const response = await fetch(`/api/customer/${storedUserId}`);
          if (response.ok) {
            const { customer: existingCustomer } = await response.json();
            console.log('✅ Found existing customer:', existingCustomer);
            setCustomer(existingCustomer);
          } else {
            console.log('❌ Stored userId invalid, clearing localStorage');
            localStorage.removeItem('beu_customer_userId');
          }
        }
      } catch (error) {
        console.error('Error checking existing customer:', error);
        localStorage.removeItem('beu_customer_userId');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingCustomer();
  }, []);

  const handleRegistrationComplete = (newCustomer: Customer) => {
    console.log('✅ Registration complete:', newCustomer);
    setCustomer(newCustomer);
    toast({
      title: "Welcome!",
      description: `Hello ${newCustomer.firstName}, you're now ready to order`,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('beu_customer_userId');
    setCustomer(null);
    toast({
      title: "Logged out",
      description: "You've been logged out successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show registration if no customer
  if (!customer) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <CustomerRegistration onRegistrationComplete={handleRegistrationComplete} />
      </div>
    );
  }

  // Show main order interface
  return (
    <div className="min-h-screen bg-background">
      <CustomerOrder customer={customer} onLogout={handleLogout} />
    </div>
  );
}