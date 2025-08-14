import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Image, DollarSign, Percent, Calendar, Upload } from 'lucide-react';

interface SpecialOffer {
  _id: string;
  restaurantId: string;
  offerTitle: string;
  offerImageURL: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  isLive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SpecialOffersManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOffer, setNewOffer] = useState({
    offerTitle: '',
    originalPrice: '',
    discountedPrice: '',
    offerImage: null as File | null
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch restaurant's special offers
  const { data: offers = [], isLoading } = useQuery<SpecialOffer[]>({
    queryKey: ['/api/restaurant/offers'],
    queryFn: async () => {
      const response = await fetch('/api/restaurant/offers');
      if (!response.ok) throw new Error('Failed to fetch offers');
      const data = await response.json();
      return data.offers;
    },
  });

  // Create special offer mutation
  const createOfferMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/restaurant/offers', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to create offer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant/offers'] });
      setIsCreateDialogOpen(false);
      setNewOffer({
        offerTitle: '',
        originalPrice: '',
        discountedPrice: '',
        offerImage: null
      });
      toast({
        title: "Offer Created",
        description: "Special offer has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create special offer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle offer status mutation
  const toggleOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const response = await fetch(`/api/restaurant/offers/${offerId}/toggle`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to toggle offer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant/offers'] });
      toast({
        title: "Offer Updated",
        description: "Offer status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update offer status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateOffer = () => {
    const { offerTitle, originalPrice, discountedPrice, offerImage } = newOffer;
    
    if (!offerTitle || !originalPrice || !discountedPrice || !offerImage) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and select an image.",
        variant: "destructive",
      });
      return;
    }

    const originalPriceNum = parseFloat(originalPrice);
    const discountedPriceNum = parseFloat(discountedPrice);

    if (originalPriceNum <= 0 || discountedPriceNum <= 0 || discountedPriceNum >= originalPriceNum) {
      toast({
        title: "Invalid Pricing",
        description: "Discounted price must be less than original price and both must be positive.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('offerTitle', offerTitle);
    formData.append('originalPrice', originalPrice);
    formData.append('discountedPrice', discountedPrice);
    formData.append('offerImage', offerImage);

    createOfferMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewOffer(prev => ({ ...prev, offerImage: file }));
    }
  };

  const calculateDiscount = () => {
    const original = parseFloat(newOffer.originalPrice);
    const discounted = parseFloat(newOffer.discountedPrice);
    if (original && discounted && original > discounted) {
      return Math.round(((original - discounted) / original) * 100);
    }
    return 0;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading offers...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Special Offers</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your restaurant's special offers and promotions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Special Offer</DialogTitle>
              <DialogDescription>
                Create a new special offer to attract customers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="offerTitle">Offer Title</Label>
                <Input
                  id="offerTitle"
                  value={newOffer.offerTitle}
                  onChange={(e) => setNewOffer(prev => ({ ...prev, offerTitle: e.target.value }))}
                  placeholder="e.g., Burger Combo Deal"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Original Price</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    value={newOffer.originalPrice}
                    onChange={(e) => setNewOffer(prev => ({ ...prev, originalPrice: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountedPrice">Sale Price</Label>
                  <Input
                    id="discountedPrice"
                    type="number"
                    step="0.01"
                    value={newOffer.discountedPrice}
                    onChange={(e) => setNewOffer(prev => ({ ...prev, discountedPrice: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {calculateDiscount() > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      {calculateDiscount()}% OFF
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="offerImage">Offer Image</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="offerImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('offerImage')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {newOffer.offerImage ? newOffer.offerImage.name : 'Choose Image'}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateOffer}
                  disabled={createOfferMutation.isPending}
                  className="flex-1"
                >
                  {createOfferMutation.isPending ? 'Creating...' : 'Create Offer'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No special offers yet. Create your first offer to attract customers!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <Card key={offer._id} className="overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={offer.offerImageURL}
                  alt={offer.offerTitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge
                    variant={offer.isLive ? "default" : "secondary"}
                    className={offer.isLive ? "bg-green-500" : ""}
                  >
                    {offer.isLive ? 'Live' : 'Inactive'}
                  </Badge>
                </div>
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="bg-red-500 text-white">
                    {offer.discountPercentage}% OFF
                  </Badge>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="text-lg">{offer.offerTitle}</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="line-through text-gray-500">{offer.originalPrice.toFixed(2)} ETB</span>
                    <span className="font-bold text-green-600">{offer.discountedPrice.toFixed(2)} ETB</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`switch-${offer._id}`} className="text-sm">
                      {offer.isLive ? 'Active' : 'Inactive'}
                    </Label>
                    <Switch
                      id={`switch-${offer._id}`}
                      checked={offer.isLive}
                      onCheckedChange={() => toggleOfferMutation.mutate(offer._id)}
                      disabled={toggleOfferMutation.isPending}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}