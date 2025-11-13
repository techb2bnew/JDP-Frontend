'use client'

import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import { Activity, Users } from 'lucide-react'; 
import { MapFilterType } from '../types/map'; 

// Props के लिए टाइप परिभाषाएँ
interface Job {
  id: string;
  name: string;
  location: { lat: number; lng: number; address: string };
  status: string;
}

interface Laborer {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  specialty: string;
  status: string;
}

interface MapDisplayProps {
  jobs: Job[];
  laborers: Laborer[];
  selectedMapFilter: MapFilterType; 
}

// पिन के रंग के लिए हेल्पर फ़ंक्शन
const getMapPinColor = (status: string) => {
  switch (status) {
    case 'In Progress':
    case 'Working':
      return '#3b82f6'; // Blue
    case 'Completed': 
      return '#16a34a'; // Green
    case 'Pending':
    case 'Available':
      return '#f97316'; // Orange
    default: 
      return '#6b7280'; // Gray
  }
};

export function MapDisplay({ jobs, laborers, selectedMapFilter }: MapDisplayProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [selectedItem, setSelectedItem] = useState<Job | Laborer | null>(null);

  if (!apiKey) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 h-96 flex items-center justify-center rounded-lg">
        <p>Google Maps API Key not found. Please check your `.env.local` file.</p>
      </div>
    );
  }

  // फिल्टर के आधार पर कौन से मार्कर दिखाने हैं, यह तय करें
  const showJobs = selectedMapFilter === 'all' || selectedMapFilter === 'jobs' || selectedMapFilter === 'active';
  const showLaborers = selectedMapFilter === 'all' || selectedMapFilter === 'laborers' || selectedMapFilter === 'active';

  // 'active' फिल्टर के लिए डेटा को फ़िल्टर करें
  const activeJobs = jobs.filter(job => job.status === 'In Progress');
  const activeLaborers = laborers.filter(laborer => laborer.status === 'Working');

  return (
    <APIProvider apiKey={apiKey}>
      <div className="h-96 w-full relative rounded-lg overflow-hidden border">
        <Map
          defaultCenter={{ lat: 40.7128, lng: -74.0060 }} // डिफ़ॉल्ट केंद्र (New York)
          defaultZoom={11}
          mapId="YOUR_CUSTOM_MAP_ID" // Google Cloud में बनाई गई कस्टम मैप ID (वैकल्पिक)
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          className="w-full h-full"
        >
          {/* Jobs के लिए मार्कर */}
          {showJobs &&
            (selectedMapFilter === 'active' ? activeJobs : jobs).map((job) => (
              <AdvancedMarker
                key={`job-${job.id}`}
                position={job.location}
                onClick={() => setSelectedItem(job)}
              >
                <Pin background={getMapPinColor(job.status)} borderColor={'#fff'} glyphColor={'#fff'}>
                  <Activity className="w-5 h-5" />
                </Pin>
              </AdvancedMarker>
            ))}

          {/* Laborers के लिए मार्कर */}
          {showLaborers &&
            (selectedMapFilter === 'active' ? activeLaborers : laborers).map((laborer) => (
              <AdvancedMarker
                key={`laborer-${laborer.id}`}
                position={laborer.location}
                onClick={() => setSelectedItem(laborer)}
              >
                 <Pin background={getMapPinColor(laborer.status)} scale={0.8} borderColor={'#fff'} glyphColor={'#fff'}>
                    <Users className="w-4 h-4" />
                 </Pin>
              </AdvancedMarker>
            ))}
        </Map>

        {/* जानकारी विंडो (टूलटिप) */}
        {selectedItem && (
          <InfoWindow
            position={'location' in selectedItem ? selectedItem.location : undefined}
            onCloseClick={() => setSelectedItem(null)}
            pixelOffset={[0, -40]} // पिन के ऊपर दिखाने के लिए ऑफसेट
          >
            <div className="p-1 max-w-xs">
              <p className="font-bold text-base">{selectedItem.name}</p>
              {'specialty' in selectedItem ? (
                <p className="text-sm text-muted-foreground">{selectedItem.specialty}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{selectedItem.id}</p>
              )}
               {'address' in selectedItem.location && (
                 <p className="text-xs text-muted-foreground mt-1">{selectedItem.location.address}</p>
               )}
            </div>
          </InfoWindow>
        )}
      </div>
    </APIProvider>
  );
}
