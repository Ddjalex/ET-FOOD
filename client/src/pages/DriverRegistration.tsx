import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Truck, User, Phone, Upload } from 'lucide-react';
import { useLocation } from 'wouter';

function DriverRegistration() {
  const [formData, setFormData] = useState({
    name: 'John Doe', // Auto-filled for testing
    phoneNumber: '+251974408281', // Auto-filled for testing  
    vehicleType: 'motorcycle', // Auto-filled for testing
    vehiclePlate: 'AA-123456', // Auto-filled for testing
  });
  const [files, setFiles] = useState({
    profileImage: null as File | null,
    governmentIdFront: null as File | null,
    governmentIdBack: null as File | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: 'profileImage' | 'governmentIdFront' | 'governmentIdBack', file: File | null) => {
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Auto-filled data for registration
      const jsonData = {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        vehicleType: formData.vehicleType,
        vehiclePlate: formData.vehicleType === 'motorcycle' ? formData.vehiclePlate : undefined,
        telegramId: '383870190' // Auto-filled telegram ID
      };

      console.log('🔍 Frontend sending JSON data:', jsonData);

      const response = await fetch('/api/drivers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      if (response.ok) {
        toast({
          title: "Registration Submitted",
          description: "Your driver application has been submitted for review. You'll be notified once approved.",
        });
        setLocation('/driver-login');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "There was an error submitting your application. Please try again.",
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
              Join our delivery network (Motorcycles & Bicycles Only)
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

                {/* Profile Picture Upload */}
                <div className="space-y-2">
                  <Label htmlFor="profileImage">Profile Picture</Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Upload Profile Picture
                    </p>
                    {files.profileImage ? (
                      <div className="text-xs text-green-600 mb-2">
                        {files.profileImage.name}
                      </div>
                    ) : null}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('profileImage', e.target.files?.[0] || null)}
                      className="hidden"
                      id="profile-image"
                      data-testid="input-profile-image"
                    />
                    <Label htmlFor="profile-image">
                      <Button variant="outline" size="sm" type="button" asChild>
                        <span className="cursor-pointer">
                          {files.profileImage ? 'Change Picture' : 'Upload Picture'}
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Government ID Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Government ID Documents</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>New Requirements:</strong> Only government ID required - no driving license needed for bicycle and motorcycle delivery
                  </p>
                </div>
                
                {/* Government ID Front */}
                <div className="space-y-2">
                  <Label htmlFor="governmentIdFront">Government ID (Front)</Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Upload Government ID Front
                    </p>
                    {files.governmentIdFront ? (
                      <div className="text-xs text-green-600 mb-2">
                        {files.governmentIdFront.name}
                      </div>
                    ) : null}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('governmentIdFront', e.target.files?.[0] || null)}
                      className="hidden"
                      id="government-id-front"
                      data-testid="input-government-id-front"
                    />
                    <Label htmlFor="government-id-front">
                      <Button variant="outline" size="sm" type="button" asChild>
                        <span className="cursor-pointer">
                          {files.governmentIdFront ? 'Change ID Front' : 'Upload ID Front'}
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>

                {/* Government ID Back */}
                <div className="space-y-2">
                  <Label htmlFor="governmentIdBack">Government ID (Back)</Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Upload Government ID Back
                    </p>
                    {files.governmentIdBack ? (
                      <div className="text-xs text-green-600 mb-2">
                        {files.governmentIdBack.name}
                      </div>
                    ) : null}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('governmentIdBack', e.target.files?.[0] || null)}
                      className="hidden"
                      id="government-id-back"
                      data-testid="input-government-id-back"
                    />
                    <Label htmlFor="government-id-back">
                      <Button variant="outline" size="sm" type="button" asChild>
                        <span className="cursor-pointer">
                          {files.governmentIdBack ? 'Change ID Back' : 'Upload ID Back'}
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Vehicle Information</h3>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <strong>Available Vehicles:</strong> Choose between motorcycle (requires plate number) or bicycle (no plate needed)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange('vehicleType', value)}>
                    <SelectTrigger data-testid="select-vehicle-type">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="bicycle">Bicycle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Show plate number field only for motorcycles */}
                {formData.vehicleType === 'motorcycle' && (
                  <div className="space-y-2">
                    <Label htmlFor="vehiclePlate">Motorcycle Plate Number</Label>
                    <div className="relative">
                      <Truck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="vehiclePlate"
                        placeholder="Enter motorcycle plate number"
                        value={formData.vehiclePlate}
                        onChange={(e) => handleInputChange('vehiclePlate', e.target.value)}
                        className="pl-10"
                        required
                        data-testid="input-plate"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
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