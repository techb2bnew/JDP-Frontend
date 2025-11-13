'use client'

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Info, Clock, TrendingUp, Table, Settings, CheckCircle, RefreshCw, Save } from 'lucide-react';
import { apiClient } from '../utils/api';
import { toast } from 'sonner';

 
interface RateTier {
  id?: number;
  description: string;
  maxHours: number | string;
  rate: number | string;
}

 
interface MarkupExample {
  basePrice: number;
}

export function ConfigurationPage() { 
  // Original tiers state
  const originalTiers: RateTier[] = [];

  const [tiers, setTiers] = useState<RateTier[]>(originalTiers);
  const [originalLoadedTiers, setOriginalLoadedTiers] = useState<RateTier[]>([]);
  const [originalLoadedMarkup, setOriginalLoadedMarkup] = useState<number>(25);
 
  const [markupPercentage, setMarkupPercentage] = useState<number>(25);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  
  const markupExamples: MarkupExample[] = [
    { basePrice: 100 },
    { basePrice: 250 },
    { basePrice: 500 },
    { basePrice: 1000 },
  ];
 
  const calculateMarkupPrice = (basePrice: number): number => {
    return basePrice * (1 + markupPercentage / 100);
  };

  // Load configuration data on component mount
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getFullConfiguration();
        
        if (response.success && response.data) {
          // Transform API data to match our component format
          const loadedTiers = response.data.hourly_rates.map((rate: any) => {
            // Use max_hours if available, otherwise use min_hours
            const hoursValue = rate.max_hours !== null && rate.max_hours !== undefined 
              ? rate.max_hours 
              : (rate.min_hours !== null && rate.min_hours !== undefined ? rate.min_hours : '');
            
            return {
              id: rate.id,
              description: rate.description,
              maxHours: hoursValue,
              rate: rate.rate
            };
          });

          // Ensure exactly 2 tiers - pad with empty ones if needed
          const defaultTiers = [
            { description: '', maxHours: '', rate: '' },
            { description: '', maxHours: '', rate: '' }
          ];
          
          const finalTiers = loadedTiers.length >= 2 
            ? loadedTiers.slice(0, 2) // Take only first 2 tiers
            : [...loadedTiers, ...defaultTiers.slice(loadedTiers.length)]; // Pad with empty tiers

          setTiers(finalTiers);
          setMarkupPercentage(response.data.markup_percentage);
          
          // Store original loaded data for reset functionality
          setOriginalLoadedTiers(finalTiers);
          setOriginalLoadedMarkup(response.data.markup_percentage);
          
          console.log('Configuration loaded:', response.data);
        } else {
          // If no data from API, set default 2 empty tiers
          const defaultTiers = [
            { description: '', maxHours: '', rate: '' },
            { description: '', maxHours: '', rate: '' }
          ];
          setTiers(defaultTiers);
          setOriginalLoadedTiers(defaultTiers);
        }
      } catch (error) {
        console.error('Error loading configuration:', error);
        toast.error('Failed to load configuration data');
        // Keep default values if loading fails
      } finally {
        setIsLoading(false);
      }
    };

    loadConfiguration();
  }, []);
 
  // Fixed 2 tiers - no add/remove functionality

  const handleTierChange = (index: number, field: keyof RateTier, value: string | number) => {
    // If maxHours is being changed, update both tiers with the same value
    if (field === 'maxHours') {
      setTiers(tiers.map((tier) => ({ ...tier, maxHours: value })));
    } else {
      setTiers(tiers.map((tier, i) => 
        i === index ? { ...tier, [field]: value } : tier
      ));
    }
  };

  const handleReset = () => {
    setTiers([...originalLoadedTiers]);
    setMarkupPercentage(originalLoadedMarkup);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Transform tiers data to match API format
      const hourlyRates = tiers.map((tier, index) => {
        const basePayload: any = {
          id: index + 1, // You might want to use actual IDs from your data
          description: tier.description,
          rate: Number(tier.rate)
        };

        // First tier: max_hours, Second tier: min_hours
        if (index === 0) {
          // First tier - use max_hours
          basePayload.max_hours = tier.maxHours === '' ? null : Number(tier.maxHours);
        } else {
          // Second tier - use min_hours
          basePayload.min_hours = tier.maxHours === '' ? null : Number(tier.maxHours);
        }

        return basePayload;
      });

      const configurationData = {
        hourly_rates: hourlyRates,
        markup_percentage: markupPercentage
      };
 

      const response = await apiClient.createOrUpdateConfiguration(configurationData);
      
      toast.success('Configuration saved successfully!'); 
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="  min-h-screen">
      <div className="mx-auto space-y-8"> 
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Configuration</h1>
            <p className="text-gray-500 mt-1">Configure system-wide settings for pricing and rates</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex items-center gap-2" onClick={handleReset}>
              <RefreshCw className="w-4 h-4" /> Reset
            </Button>
            <Button className="flex items-center gap-2 bg-primary text-white hover:bg-[#0090e6]" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </header>
 
        {/* <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-r-lg flex items-center gap-3">
          <Info className="w-5 h-5" />
          <p className="text-sm">Last updated on Jan 20, 2025, 04:00 PM by Admin User</p>
        </div> */}
 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl text-gray-700">
                  <Clock className="w-6 h-6 text-blue-600" />
                  Hourly Rates
                </CardTitle>
                <p className="text-sm text-gray-500 pt-1">
                  Set different hourly rates based on time ranges. These rates will be used for all job calculations.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {tiers.map((tier, index) => (
                  <div key={index} className="p-5 border rounded-lg bg-gray-50 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-600">Tier {index + 1}</h3>
                      {/* Fixed 2 tiers - no remove button */}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor={`desc-${index}`} className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                        <Input 
                          id={`desc-${index}`} 
                          value={tier.description} 
                          onChange={(e) => handleTierChange(index, 'description', e.target.value)}
                          placeholder="e.g., Up to 3 hours" 
                        />
                      </div>
                      <div>
                        <label htmlFor={`max-hours-${index}`} className="block text-sm font-medium text-gray-600 mb-1">
                          {index === 0 ? 'Less than equal to' : 'Greater than equal to'}
                        </label>
                        <Input 
                          id={`max-hours-${index}`} 
                          type="number" 
                          value={tier.maxHours} 
                          onChange={(e) => handleTierChange(index, 'maxHours', e.target.value)}
                          placeholder="e.g., 3" 
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor={`rate-${index}`} className="block text-sm font-medium text-gray-600 mb-1">Hourly Rate</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                        <Input 
                          id={`rate-${index}`} 
                          type="number" 
                          value={tier.rate} 
                          onChange={(e) => handleTierChange(index, 'rate', e.target.value)}
                          className="pl-7" 
                          placeholder="e.g., 165" 
                        />
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-md text-sm text-gray-600 border">
                      {tier.description}: ${tier.rate}/hour
                    </div>
                  </div>
                ))}
                {/* Fixed 2 tiers - no add button */}
              </CardContent>
            </Card>
          </div>
 
          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl text-gray-700">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                   Markup Percentage On Materials
                </CardTitle>
                <p className="text-sm text-gray-500 pt-1">
                  Set the markup percentage to automatically increase product prices. This will be reflected on all invoices.
                </p>
              </CardHeader>
              <CardContent>
                <label htmlFor="markup" className="block text-sm font-medium text-gray-600 mb-1">Markup Percentage</label>
                <div className="relative">
                  <Input 
                    id="markup" 
                    type="number" 
                    value={markupPercentage} 
                    onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                    className="pr-8"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter a value between 0 and 100</p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg text-gray-700">
                  <Table className="w-5 h-5 text-gray-500" />
                  Markup Examples
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {markupExamples.map((example, index) => (
                  <div key={index} className="flex justify-between items-center text-sm border-b pb-3 last:border-b-0">
                    <span className="text-gray-600">Base Price: ${example.basePrice.toLocaleString()}</span>
                    <div className="text-right">
                      <span className="font-semibold text-blue-600">${calculateMarkupPrice(example.basePrice).toLocaleString()}</span>
                      <p className="text-xs text-gray-400">(+${(calculateMarkupPrice(example.basePrice) - example.basePrice).toLocaleString()} markup)</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Automatic Application</h4>
                <p className="text-sm">This markup will be automatically applied to all product prices and reflected on invoices.</p>
              </div>
            </div>
          </div>
        </div>
 
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-gray-700">
              <Settings className="w-6 h-6 text-gray-500" />
              Configuration Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-600 mb-3">Hourly Rate Tiers</h3>
                <div className="space-y-2 text-sm">
                  {tiers.map((tier, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{tier.description}</span>
                      <span className="font-medium text-gray-800">${tier.rate}/hr</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-600 mb-3">Pricing Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Markup Percentage</span>
                    <span className="font-medium text-gray-800">{markupPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sample $100 Product</span>
                    <span className="font-medium text-gray-800">${calculateMarkupPrice(100)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
