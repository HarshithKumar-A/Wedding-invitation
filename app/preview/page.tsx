'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { templates, Template } from '@/lib/templates';
import { Button } from '@/components/ui/Buttons';

// Define the wedding invitation data interface
interface WeddingData {
  brideName: string;
  groomName: string;
  weddingDateTime: string;
  venueName: string;
  venueAddress: string;
}

export default function PreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State to store form data
  const [formData, setFormData] = useState<WeddingData | null>(null);
  
  // State to track which card is being hovered
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    // Extract form data from URL query parameters
    if (searchParams) {
      const brideName = searchParams.get('brideName');
      const groomName = searchParams.get('groomName');
      const weddingDateTime = searchParams.get('weddingDateTime');
      const venueName = searchParams.get('venueName');
      const venueAddress = searchParams.get('venueAddress');
      
      // Check if we have all required data
      if (brideName && groomName && weddingDateTime && venueName && venueAddress) {
        setFormData({
          brideName,
          groomName,
          weddingDateTime,
          venueName,
          venueAddress
        });
      }
    }
  }, [searchParams]);

  // Format the date for display
  const formatDate = (dateTimeString: string): string => {
    try {
      const date = new Date(dateTimeString);
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }).format(date);
    } catch (error) {
      return dateTimeString;
    }
  };

  // Format date specifically for the Dutch template
  const formatDutchDate = (dateTimeString: string): string => {
    try {
      const date = new Date(dateTimeString);
      const day = date.getDate();
      const month = date.toLocaleString('en-US', { month: 'long' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (error) {
      return dateTimeString;
    }
  };

  // Handle view template button click
  const handleViewTemplate = (templateId: string) => {
    // Prepare query params to pass along
    const queryParams = new URLSearchParams(searchParams.toString());
    
    // Navigate to the details page with template ID and form data
    router.push(`/details/${templateId}?${queryParams.toString()}`);
  };

  // If no data is available, show a message
  if (!formData) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Wedding Invitation Templates</h1>
          <Link 
             href={`/form?${searchParams.toString()}`}
            className="text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            ← Back to Form
          </Link>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Missing Data</h2>
          <p className="text-red-700 mb-4">
            We couldn't find your wedding details. Please go back to the form and provide the required information.
          </p>
          <Link
            href="/form"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Go to Form
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8 gap-4">
        <h1 className="text-xl sm:text-3xl font-bold text-indigo-600">Templates</h1>
        <Button>
        <Link 
           href={`/form?${searchParams.toString()}`}
        >
          Back to Form
        </Link>
        </Button>
      </div>
      
      {/* Template description */}
      <p className="text-gray-600 mb-8">
        Select a template design for {formData.brideName} & {formData.groomName}'s wedding invitation.
        Each template will be customized with your event details.
      </p>
      
      {/* Templates grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template, index) => (
          <div
            key={template.id}
            className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            onMouseEnter={() => setHoveredCard(template.id)}
            onMouseLeave={() => setHoveredCard(null)}
            tabIndex={0}
            role="button"
            aria-label={`View ${template.name} template`}
            onClick={() => handleViewTemplate(template.id)}
          >
            {/* Template preview container */}
            <div className="relative h-64 bg-gray-50">
              {/* Template mini-preview using iframe */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full origin-center pointer-events-none">
                  <iframe 
                    srcDoc={` 
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <script src="https://cdn.tailwindcss.com"></script>
                        </head>
                        <body>
                          <div id="content"></div>
                          <script>
                            // Fetch the template
                            fetch('/templates/template${index + 1}.html')
                              .then(response => response.text())
                              .then(html => {
                                // Replace placeholders with actual data
                                html = html.replace(/{{brideName}}/g, '${formData.brideName}')
                                  .replace(/{{groomName}}/g, '${formData.groomName}')
                                  .replace(/{{dateTime}}/g, '${formatDate(formData.weddingDateTime)}')
                                  .replace(/{{formattedDate}}/g, '${formatDutchDate(formData.weddingDateTime)}')
                                  .replace(/{{venueName}}/g, '${formData.venueName}')
                                  .replace(/{{venueUrl}}/g, '${formData.venueAddress}');
                                
                                // Insert into the content div
                                document.getElementById('content').innerHTML = html;
                              });
                          </script>
                        </body>
                      </html>
                    `}
                    title={template.name}
                    className="w-full h-full border-0 transform origin-center"
                    sandbox="allow-scripts allow-same-origin"
                    scrolling="no"
                  ></iframe>
                </div>
              </div>
              
              {/* Hover overlay */}
              <div 
                className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-200 ${
                  hoveredCard === template.id ? 'opacity-80' : 'opacity-0'
                }`}
              >
                <Button
                  className="hover:bg-gray-100 px-6 py-2 rounded-full font-bold"
                  onClick={() => handleViewTemplate(template.id)}
                  aria-label={`View ${template.name} template details`}
                >
                  View
                </Button>
              </div>
            </div>
            
            {/* Template info */}
            <div className="p-4">
              <h3 className="font-semibold text-lg">{template.name}</h3>
              <p className="text-gray-600 text-sm mt-1">{template.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 