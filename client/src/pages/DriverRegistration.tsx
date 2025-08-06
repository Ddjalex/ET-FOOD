import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Truck, User, Phone, CreditCard, Upload } from 'lucide-react';
import { useLocation } from 'wouter';

function DriverRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    licenseNumber: '',
    vehicleType: '',
    vehiclePlate: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create driver registration request
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: 'temp-user-id', // In production, this would come from auth
          status: 'pending_approval',
        }),
      });

      if (response.ok) {
        toast({
          title: "Registration Submitted",
          description: "Your driver application has been submitted for review. You'll be notified once approved.",
        });
        setLocation('/driver-login');
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Truck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">Driver Registration</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Join our delivery network and start earning
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="pl-10"
                      required
                      data-testid="input-name"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+251912345678"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="pl-10"
                      required
                      data-testid="input-phone"
                    />
                  </div>
                </div>
              </div>

              {/* License Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">License Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="licenseNumber"
                      placeholder="Enter your license number"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      className="pl-10"
                      required
                      data-testid="input-license"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Vehicle Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange('vehicleType', value)}>
                    <SelectTrigger data-testid="select-vehicle-type">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="bicycle">Bicycle</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vehiclePlate">Vehicle Plate Number</Label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="vehiclePlate"
                      placeholder="Enter plate number"
                      value={formData.vehiclePlate}
                      onChange={(e) => handleInputChange('vehiclePlate', e.target.value)}
                      className="pl-10"
                      required
                      data-testid="input-plate"
                    />
                  </div>
                </div>
              </div>

              {/* Document Upload Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Required Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">License Image</p>
                    <Button variant="outline" size="sm" className="mt-2" type="button">
                      Upload
                    </Button>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Vehicle Image</p>
                    <Button variant="outline" size="sm" className="mt-2" type="button">
                      Upload
                    </Button>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">ID Card</p>
                    <Button variant="outline" size="sm" className="mt-2" type="button">
                      Upload
                    </Button>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-register"
              >
                {isLoading ? "Submitting Application..." : "Submit Application"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <a href="/driver-login" className="text-blue-600 hover:underline">
                  Sign in here
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DriverRegistration;