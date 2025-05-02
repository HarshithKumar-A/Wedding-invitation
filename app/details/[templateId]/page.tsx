'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { templates } from '@/lib/templates';
import { useDownloadImage } from '@/lib/hooks/useDownloadImage';
import { Button } from '@/components/ui/Buttons';
import QRCode from 'qrcode';

// Define the wedding invitation data interface
interface WeddingData {
  brideName: string;
  groomName: string;
  weddingDateTime: string;
  venueName: string;
  venueAddress: string;
}

// Content component that uses useSearchParams
function TemplateDetailsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  
  const [formData, setFormData] = useState<WeddingData | null>(null);
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Create a ref to the invitation container for image download
  const invitationRef = useRef<HTMLDivElement>(null);
  
  // Use our custom download image hook
  const { downloadImage, isLoading: isDownloading } = useDownloadImage(invitationRef, {
    fileName: formData ? `${formData.brideName}-${formData.groomName}-wedding-invitation.png` : 'wedding-invitation.png',
    backgroundColor: '#ffffff'
  });
  
  // Find the selected template index (1-based for file names)
  const templateIndex = templates.findIndex(t => t.id === templateId) + 1;
  
  // Find previous and next template IDs for navigation
  const currentTemplateIndex = templates.findIndex(t => t.id === templateId);
  const prevTemplateId = currentTemplateIndex > 0 ? templates[currentTemplateIndex - 1].id : null;
  const nextTemplateId = currentTemplateIndex < templates.length - 1 ? templates[currentTemplateIndex + 1].id : null;
  
  // If template not found, use the first one
  const templateFileNumber = templateIndex > 0 ? templateIndex : 1;
  const template = templates.find(t => t.id === templateId) || templates[0];
  
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
  
  // Navigation function to switch templates
  const navigateToTemplate = (newTemplateId: string) => {
    if (newTemplateId) {
      router.push(`/details/${newTemplateId}?${searchParams.toString()}`);
    }
  };
  
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
  
  // Fetch the template HTML
  useEffect(() => {
    setLoading(true);
    fetch(`/templates/template${templateFileNumber}.html`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load template: ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        setTemplateHtml(html);
        setError(null);
      })
      .catch(err => {
        console.error('Error loading template:', err);
        setError(`Failed to load template: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [templateFileNumber]);
  
  // Generate QR code for venue address
  useEffect(() => {
    if (formData?.venueAddress) {
      QRCode.toDataURL(formData.venueAddress)
        .then(url => {
          setQrCodeUrl(url);
        })
        .catch(err => {
          console.error('Error generating QR code:', err);
        });
    }
  }, [formData?.venueAddress]);
  
  // If no form data or template not found, show error
  if (!formData || !template) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Template Preview</h1>
          <Link 
            href={`/preview?${searchParams.toString()}`}
            className="text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            ← Back to Templates
          </Link>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Template Not Available</h2>
          <p className="text-red-700 mb-4">
            We couldn't find the template or your wedding details are missing.
          </p>
          <Link
            href={`/preview?${searchParams.toString()}`}
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Return to Templates
          </Link>
        </div>
      </div>
    );
  }
  
  // Replace template placeholders with actual data
  const populatedHtml = templateHtml
    .replace(/{{brideName}}/g, formData.brideName)
    .replace(/{{groomName}}/g, formData.groomName)
    .replace(/{{dateTime}}/g, formatDate(formData.weddingDateTime))
    .replace(/{{formattedDate}}/g, formatDutchDate(formData.weddingDateTime))
    .replace(/{{venueName}}/g, formData.venueName)
    .replace(/{{venueUrl}}/g, formData.venueAddress);
    
  // If still loading, show spinner
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Template Preview</h1>
          <Link 
            href={`/preview?${searchParams.toString()}`}
            className="text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            ← Back to Templates
          </Link>
        </div>
        
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }
  
  // If there was an error, show error message
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Template Preview</h1>
          <Link 
            href={`/preview?${searchParams.toString()}`}
            className="text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            ← Back to Templates
          </Link>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Template</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <Link
            href={`/preview?${searchParams.toString()}`}
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Return to Templates
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <h1 className="text-xl sm:text-3xl font-bold text-indigo-600">{template.name}</h1>
        
        <div className="flex gap-2">
          <Button>
            <Link href={`/preview?${searchParams.toString()}`}>
              Back to Templates
            </Link>
          </Button>
          
          <button
            onClick={() => downloadImage()}
            disabled={isDownloading}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400"
          >
            {isDownloading ? 'Downloading...' : 'Download Invitation'}
          </button>
        </div>
      </div>
      
      {/* Template description */}
      <p className="text-gray-600 mb-8">{template.description}</p>
      
      {/* Template navigation */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => prevTemplateId && navigateToTemplate(prevTemplateId)}
          disabled={!prevTemplateId}
          className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 transition-colors"
        >
          {prevTemplateId ? '← Previous Template' : ''}
        </button>
        
        <button
          onClick={() => nextTemplateId && navigateToTemplate(nextTemplateId)}
          disabled={!nextTemplateId}
          className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 transition-colors"
        >
          {nextTemplateId ? 'Next Template →' : ''}
        </button>
      </div>
      
      {/* Template preview container */}
      <div className="flex justify-center">
        <div 
          ref={invitationRef}
          className="max-w-full border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          style={{ width: '100%', maxWidth: '800px' }}
        >
          {/* An iframe to render the invitation HTML */}
          <iframe
            srcDoc={`
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  body { margin: 0; }
                  ${template.customCss || ''}
                </style>
              </head>
              <body>
                ${populatedHtml}
                ${qrCodeUrl ? `
                <script>
                  try {
                    const qrCodeContainer = document.getElementById('qrcode');
                    if (qrCodeContainer) {
                      const img = document.createElement('img');
                      img.src = "${qrCodeUrl}";
                      img.alt = "Venue QR Code";
                      img.style.width = "150px";
                      img.style.height = "150px";
                      qrCodeContainer.innerHTML = '';
                      qrCodeContainer.appendChild(img);
                    }
                  } catch (e) {
                    console.error('Error setting QR code:', e);
                  }
                </script>
                ` : ''}
              </body>
              </html>
            `}
            className="w-full border-0"
            style={{ height: '600px' }}
            title="Wedding Invitation Preview"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function TemplateDetailsLoading() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-36 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      <div className="h-4 w-3/4 bg-gray-200 rounded mb-8 animate-pulse"></div>
      
      <div className="flex justify-center">
        <div className="h-96 w-full max-w-2xl bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function TemplateDetailsPage() {
  return (
    <Suspense fallback={<TemplateDetailsLoading />}>
      <TemplateDetailsContent />
    </Suspense>
  );
} 