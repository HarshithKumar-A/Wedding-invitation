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
  const [shareUrl, setShareUrl] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [qrCodeType, setQrCodeType] = useState<'venue' | 'invitation'>('invitation');
  
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
  
  // Create shareable link
  useEffect(() => {
    if (formData && templateId) {
      try {
        // Create the data object to be encoded
        const shareData = {
          brideName: formData.brideName,
          groomName: formData.groomName,
          dateTime: formData.weddingDateTime,
          venueName: formData.venueName,
          venueUrl: formData.venueAddress,
          templateId: templateId,
          qrCodeType: qrCodeType  // Include QR code type preference
        };
        
        // Convert to JSON and encode as base64
        const jsonString = JSON.stringify(shareData);
        const base64Data = btoa(jsonString);
        
        // Create the full URL with encoded data
        const encodedData = encodeURIComponent(base64Data);
        const baseUrl = window.location.origin;
        const fullShareUrl = `${baseUrl}/invite?data=${encodedData}`;
        
        setShareUrl(fullShareUrl);
      } catch (error) {
        console.error('Error creating share link:', error);
      }
    }
  }, [formData, templateId, qrCodeType]);
  
  // Generate QR code based on selected type
  useEffect(() => {
    if (!formData) return;

    // Determine which URL to use for the QR code
    const qrCodeContent = qrCodeType === 'venue' 
      ? formData.venueAddress  // Use venue address/Google Maps link
      : shareUrl;              // Use invitation link

    if (qrCodeContent) {
      QRCode.toDataURL(qrCodeContent)
        .then(url => {
          setQrCodeUrl(url);
        })
        .catch(err => {
          console.error('Error generating QR code:', err);
        });
    }
  }, [formData?.venueAddress, shareUrl, qrCodeType]);
  
  // Toggle QR code type
  const toggleQrCodeType = () => {
    setQrCodeType(prevType => prevType === 'venue' ? 'invitation' : 'venue');
  };
  
  // Handle copy to clipboard
  const handleCopyToClipboard = () => {
    try {
      // Check if the Clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl)
          .then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 3000);
          })
          .catch(err => {
            console.error('Error copying to clipboard with Clipboard API:', err);
            // Fall back to execCommand method
            fallbackCopyToClipboard();
          });
      } else {
        // Clipboard API not available, use fallback
        fallbackCopyToClipboard();
      }
    } catch (err) {
      console.error('Error in clipboard handling:', err);
      // Try fallback method as last resort
      fallbackCopyToClipboard();
    }
  };
  
  // Fallback method using document.execCommand
  const fallbackCopyToClipboard = () => {
    try {
      // Create a temporary input element
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      
      // Make the textarea out of viewport
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // Execute copy command
      const successful = document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } else {
        console.error('Fallback clipboard copy failed');
      }
    } catch (err) {
      console.error('Fallback clipboard method failed:', err);
    }
  };
  
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
      <div className="flex flex-col justify-between items-start gap-4 mb-8">
        <h1 className="text-xl sm:text-3xl font-bold text-indigo-600">{template.name}</h1>
        
        <div className="flex gap-2 sm:flex-row w-full flex-col">
          <Button className="text-xl">
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
          
          <button
            onClick={() => setShowShareModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Share Link
          </button>
        </div>
      </div>
    
      {/* QR Code Toggle */}
      <div className="bg-gray-100 p-4 rounded-lg mb-8">
  <h3 className="font-medium text-gray-700 mb-2">QR Code Settings</h3>

  <div className='flex items-center justify-center'>
  <div className="inline-flex items-center p-1 bg-white rounded-md shadow-sm w-full">
    <input 
      id="qrVenue" 
      type="radio" 
      name="qrCodeType" 
      value="venue"
      checked={qrCodeType === 'venue'}
      onChange={() => setQrCodeType('venue')}
      className="hidden peer/venue"
    />
    <label 
      htmlFor="qrVenue" 
      className={`w-1/2 px-4 py-2 rounded-l-md cursor-pointer bg-gray-200 text-gray-700 transition ${qrCodeType === 'venue' ? 'bg-indigo-500 text-white' : ''}`}
    >
      📍 Venue
    </label>

    <input 
      id="qrInvitation" 
      type="radio" 
      name="qrCodeType" 
      value="invitation"
      checked={qrCodeType === 'invitation'}
      onChange={() => setQrCodeType('invitation')}
      className="hidden peer/invitation"
    />
    <label 
      htmlFor="qrInvitation" 
      className={`w-1/2 px-4 py-2 rounded-r-md cursor-pointer bg-gray-200 text-gray-700 transition ${qrCodeType === 'invitation' ? 'bg-indigo-500 text-white' : ''}`}
    >
      📨 Invitation
    </label>
  </div>
  </div>

  <div className="mt-2 text-xs text-gray-600">
    {qrCodeType === 'venue'
      ? 'QR code will open Google Maps when scanned'
      : "QR code will open the digital invitation when scanned, and 'view map' button will be shown in invitation"}
  </div>
</div>

      
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

      <div className="mt-4 rounded-lg mb-8">
            <h3 className="font-medium text-gray-700 mb-2">About this template</h3>
                  {/* Template description */}
             <p className="text-gray-600 mb-8">{template.description}</p>
      </div>
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-white/40 flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Share Invitation Link</h2>
            <p className="text-gray-600 mb-4">
              Anyone with this link can view the invitation directly:
            </p>
            
            <div className="flex items-center mb-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleCopyToClipboard}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-r-lg transition-colors"
              >
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
            </div>
            
            {copySuccess && (
              <p className="text-green-600 text-sm mb-4">
                ✓ Link copied to clipboard successfully!
              </p>
            )}
            
            <div className="text-xs text-gray-500 mt-1 mb-4">
              If the copy button doesn't work, click the link above to select it, then copy manually.
            </div>
            
            <h3 className="font-medium text-sm mt-4 mb-2 text-gray-700">Share options:</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <a 
                href={`mailto:?subject=Wedding Invitation&body=You're invited! View our wedding invitation here: ${encodeURIComponent(shareUrl)}`}
                className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Email</span>
              </a>
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(`You're invited! View our wedding invitation here: ${shareUrl}`)}`}
                className="inline-flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-800 py-1 px-3 rounded text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>WhatsApp</span>
              </a>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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