'use client';

import { useEffect, useState, useRef } from 'react';
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

export default function TemplateDetailsPage() {
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
  
  // Load template data
  useEffect(() => {
    async function loadTemplate() {
      try {
        // Fetch template HTML file
        const response = await fetch(`/templates/template${currentTemplateIndex + 1}.html`);
        const html = await response.text();
        setTemplateHtml(html);
        
        // Generate QR code for the venue address
        if (formData && formData.venueAddress) {
          try {
            const qrCode = await QRCode.toDataURL(formData.venueAddress);
            setQrCodeUrl(qrCode);
            
            // Add QR code to the template after it's loaded
            setTimeout(() => {
              const qrElement = document.getElementById('qrcode');
              if (qrElement) {
                if (template.id === 'dutch-save-the-date') {
                  // Special handling for Dutch template
                  qrElement.innerHTML = `<img src="${qrCode}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;">`;
                } else {
                  qrElement.innerHTML = `<img src="${qrCode}" alt="QR Code" style="width: 120px; height: 120px;">`;
                }
              }
            }, 500);
          } catch (error) {
            console.error('Error generating QR code:', error);
          }
        }
      } catch (error) {
        console.error('Error loading template:', error);
        setError('Failed to load template. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    if (formData) {
      loadTemplate();
    }
  }, [formData, currentTemplateIndex, template.id, isDownloading]);
  
  // If no data is available or template is loading, show loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }
  
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
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-xl sm:text-3xl font-bold text-indigo-600">{template.name}</h1>
      </div>
      
      {/* Template navigation */}
      <div className="flex justify-between mb-6">
        <button
          onClick={() => navigateToTemplate(prevTemplateId || '')}
          disabled={!prevTemplateId}
          className={`flex items-center gap-2 px-4 py-2 ps-0 rounded text-xs sm:text-base w-1/4 ${
            prevTemplateId 
              ? 'text-gray-400 hover:bg-gray-100' 
              : 'text-gray-700 cursor-not-allowed'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        
        <div className="text-center px-4 py-2 ">
          <span className="text-sm text-gray-500 text-xs sm:text-base">
            Template {currentTemplateIndex + 1} of {templates.length}
          </span>
        </div>
        
        <button
          onClick={() => navigateToTemplate(nextTemplateId || '')}
          disabled={!nextTemplateId}
          className={`flex items-center gap-2 px-4 py-2 pe-0 rounded text-xs sm:text-base w-1/4 justify-end ${
            nextTemplateId 
              ? 'text-gray-400 hover:bg-gray-100' 
              : 'text-gray-700 cursor-not-allowed'
          }`}
        >
          Next
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Template actions */}
      <div className="rounded-lg mb-8 flex flex-wrap gap-4 justify-center sm:justify-end">
        <button 
          className={`${
            isDownloading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white font-medium py-2 px-4 rounded transition-colors inline-flex items-center`}
          onClick={downloadImage}
          disabled={isDownloading}
        >
          {isDownloading ? 'Generating...' : 'Download Image'}
        </button>
        <div className="flex gap-4">
          <Button>
            <Link 
              href={`/preview?${searchParams.toString()}`}
            >
          Templates
          </Link>
          </Button>
          <Button>
          <Link 
            href={`/form?${searchParams.toString()}`}
          >
            Edit 
          </Link>
        </Button>
        </div>
      </div>
      
      {/* Template preview container */}
      <div className="relative shadow-lg rounded-lg overflow-hidden mb-8 flex justify-center items-center">
        {/* We use dangerouslySetInnerHTML only for the preview, as we're in control of the template HTML */}
        <div 
          ref={invitationRef}
          className="overflow-auto max-h-[800px] border border-gray-200 rounded-lg"
          dangerouslySetInnerHTML={{ __html: populatedHtml }}
        />
      </div>
      
      {/* Template info */}
      <div className="rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-indigo-600">About this template</h2>
        <p className="text-gray-700 mb-4">{template.description}</p>
        <p className="text-gray-500 text-sm">
          This template preview shows how your invitation will look. The QR code links to your venue location.
        </p>
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h3 className="font-medium text-gray-700 mb-2">Download Instructions</h3>
          <p className="text-gray-500 text-sm">
            Click the "Download as Image" button to save your invitation as a PNG image. 
            This process captures exactly what you see in the preview, including the QR code.
          </p>
        </div>
      </div>
    </div>
  );
} 