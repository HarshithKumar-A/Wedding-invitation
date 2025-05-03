'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Data interface for the invitation
interface InvitationData {
  brideName: string;
  groomName: string;
  dateTime: string;
  venueName: string;
  venueUrl: string;
  templateId: string;
  qrCodeType?: 'venue' | 'invitation'; // Optional, defaults to 'venue' if not provided
}

// Content component that uses useSearchParams
function InviteContent() {
  const searchParams = useSearchParams();
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');

  // Decode and parse the data param
  useEffect(() => {
    try {
      const dataParam = searchParams?.get('data');
      
      if (!dataParam) {
        setError('Missing data parameter');
        setLoading(false);
        return;
      }
      
      // Decode the base64 URL-safe string
      const jsonString = atob(decodeURIComponent(dataParam));
      const data = JSON.parse(jsonString) as InvitationData;
      
      // Validate required fields
      if (!data.brideName || !data.groomName || !data.dateTime || 
          !data.venueName || !data.venueUrl || !data.templateId) {
        setError('Invalid invitation data');
        setLoading(false);
        return;
      }
      
      setInvitationData(data);
    } catch (err) {
      console.error('Error decoding invitation data:', err);
      setError('Could not decode invitation data');
      setLoading(false);
    }
  }, [searchParams]);

  // Create shareable link (for QR code if needed)
  useEffect(() => {
    if (invitationData) {
      try {
        // Create the full URL with encoded data
        const currentData = { ...invitationData };
        const jsonString = JSON.stringify(currentData);
        const base64Data = btoa(jsonString);
        const encodedData = encodeURIComponent(base64Data);
        const baseUrl = window.location.origin;
        const fullShareUrl = `${baseUrl}/invite?data=${encodedData}`;
        
        setShareUrl(fullShareUrl);
      } catch (error) {
        console.error('Error creating share link:', error);
      }
    }
  }, [invitationData]);

  // Fetch the template HTML
  useEffect(() => {
    if (!invitationData) return;

    const templateId = invitationData.templateId;
    let templateNumber = 1; // Default to first template
    
    // Map template ID to template number (file name)
    if (templateId === 'elegant-floral') templateNumber = 1;
    else if (templateId === 'rustic-charm') templateNumber = 2;
    else if (templateId === 'modern-minimal') templateNumber = 3;
    else if (templateId === 'romantic-script') templateNumber = 4;
    else if (templateId === 'tropical-paradise') templateNumber = 5;
    else if (templateId === 'dutch-save-the-date') templateNumber = 6;
    
    fetch(`/templates/template${templateNumber}.html`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load template: ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        setTemplateHtml(html);
      })
      .catch(err => {
        console.error('Error loading template:', err);
        setError(`Failed to load template: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [invitationData]);

  // Format the date
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

  // If loading, show minimal loading state
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading invitation...</div>;
  }

  // If error, show minimal error message
  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-600">{error}</div>;
  }

  // Replace template placeholders with actual data
  if (invitationData && templateHtml) {
    // First, replace all the regular placeholders
    let populatedHtml = templateHtml
      .replace(/{{brideName}}/g, invitationData.brideName)
      .replace(/{{groomName}}/g, invitationData.groomName)
      .replace(/{{dateTime}}/g, formatDate(invitationData.dateTime))
      .replace(/{{formattedDate}}/g, formatDutchDate(invitationData.dateTime))
      .replace(/{{venueName}}/g, invitationData.venueName)
      .replace(/{{venueUrl}}/g, invitationData.venueUrl);
    
    // Now let's replace the QR code div with our button or QR code based on preference
    const qrCodeDivRegex = /<div id="qrcode"[^>]*>([\s\S]*?)<\/div>/;
    
    // Determine QR code content based on preference (from template owner)
    const qrCodeType = invitationData.qrCodeType || 'venue';
    const qrContentUrl = qrCodeType === 'venue' ? invitationData.venueUrl : shareUrl;
    
    let qrCodeReplacement: string;
    
    if (qrCodeType === 'venue') {
      // If venue selected, use Google Maps button
      qrCodeReplacement = `
        <div id="qrcode" class="border border-gray-200 p-4 inline-block mb-6 text-center">
          <div class="mb-2 text-gray-600 text-sm">Venue Location</div>
          <a href="${invitationData.venueUrl}" 
             target="_blank" 
             rel="noopener noreferrer" 
             class="inline-flex items-center justify-center px-5 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-150">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            View on Google Maps
          </a>
          <div class="mt-2 text-gray-600 text-xs">Click to get directions</div>
        </div>
      `;
    } else {
      // If invitation selected, we'll render an actual QR code
      // We'll inject a placeholder and fill it via script
      qrCodeReplacement = `
        <div id="qrcode" class="border border-gray-200 p-4 inline-block mb-6 text-center">
          <div class="mb-2 text-gray-600 text-sm">Scan to View Digital Invitation</div>
          <div id="qr-code-container" class="flex justify-center items-center h-36 w-36 mx-auto bg-gray-100">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
          </div>
          <div class="mt-2 text-gray-600 text-xs">Share with friends & family</div>
        </div>
      `;
    }
    
    // Replace the QR code div with our replacement
    populatedHtml = populatedHtml.replace(qrCodeDivRegex, qrCodeReplacement);
    
    // Use direct rendering with dangerouslySetInnerHTML
    return (
      <>
        <div 
          className="w-full min-h-screen flex flex-col items-center justify-center"
          dangerouslySetInnerHTML={{ __html: populatedHtml }} 
        />
        
        {qrCodeType === 'invitation' && (
          <script dangerouslySetInnerHTML={{ __html: `
            window.onload = function() {
              // Use QRCode.js library to generate QR code on the client
              const script = document.createElement('script');
              script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
              script.onload = function() {
                try {
                  const container = document.getElementById('qr-code-container');
                  if (container) {
                    // Clear loading spinner
                    container.innerHTML = '';
                    
                    // Generate QR code
                    new QRCode(container, {
                      text: '${shareUrl}',
                      width: 128,
                      height: 128,
                      colorDark: '#000000',
                      colorLight: '#ffffff',
                      correctLevel: 'H'
                    });
                  }
                } catch (e) {
                  console.error('Error generating QR code:', e);
                }
              };
              document.head.appendChild(script);
            };
          `}} />
        )}
      </>
    );
  }

  return null;
}

// Loading fallback component
function InviteLoading() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      Loading invitation...
    </div>
  );
}

// Main page component with Suspense boundary
export default function InvitePage() {
  return (
    <Suspense fallback={<InviteLoading />}>
      <InviteContent />
    </Suspense>
  );
} 