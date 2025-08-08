'use client'

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Info, Clock, TrendingUp, Table, Settings, CheckCircle, RefreshCw, Save, PlusCircle } from 'lucide-react';

 
interface RateTier {
  description: string;
  maxHours: number | string;
  rate: number | string;
}

 
interface MarkupExample {
  basePrice: number;
}

export function ConfigurationPage() { 
  const [tiers, setTiers] = useState<RateTier[]>([
    { description: 'Up to 3 hours', maxHours: 3, rate: 165 },
    { description: 'More than 3 hours', maxHours: '', rate: 135 },
  ]);
 
  const [markupPercentage, setMarkupPercentage] = useState<number>(25);

  
  const markupExamples: MarkupExample[] = [
    { basePrice: 100 },
    { basePrice: 250 },
    { basePrice: 500 },
    { basePrice: 1000 },
  ];
 
  const calculateMarkupPrice = (basePrice: number): number => {
    return basePrice * (1 + markupPercentage / 100);
  };
 
  const handleAddTier = () => {
    setTiers([...tiers, { description: '', maxHours: '', rate: '' }]);
  };

  return (
    <div className="  min-h-screen">
      <div className="mx-auto space-y-8"> 
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Configuration</h1>
            <p className="text-gray-500 mt-1">Configure system-wide settings for pricing and rates</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Reset
            </Button>
            <Button className="flex items-center gap-2 bg-primary hover:bg-blue-700">
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          </div>
        </header>
 
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-r-lg flex items-center gap-3">
          <Info className="w-5 h-5" />
          <p className="text-sm">Last updated on Jan 20, 2025, 04:00 PM by Admin User</p>
        </div>
 
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
                    <h3 className="font-semibold text-gray-600">Tier {index + 1}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor={`desc-${index}`} className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                        <Input id={`desc-${index}`} value={tier.description} placeholder="e.g., Up to 3 hours" />
                      </div>
                      {index === 0 && (
                        <div>
                          <label htmlFor={`max-hours-${index}`} className="block text-sm font-medium text-gray-600 mb-1">Maximum Hours</label>
                          <Input id={`max-hours-${index}`} type="number" value={tier.maxHours} placeholder="e.g., 3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor={`rate-${index}`} className="block text-sm font-medium text-gray-600 mb-1">Hourly Rate</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                        <Input id={`rate-${index}`} type="number" value={tier.rate} className="pl-7" placeholder="e.g., 165" />
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-md text-sm text-gray-600 border">
                      {tier.description}: ${tier.rate}/hour
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full flex items-center gap-2 border-dashed" onClick={handleAddTier}>
                  <PlusCircle className="w-4 h-4" /> Add New Tier
                </Button>
              </CardContent>
            </Card>
          </div>
 
          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl text-gray-700">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  Markup Percentage
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
