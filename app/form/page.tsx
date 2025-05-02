'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Form component that uses useSearchParams
function FormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize form state with sensible defaults
  const [formData, setFormData] = useState({
    brideName: 'Sarah Johnson',
    groomName: 'Michael Smith',
    weddingDateTime: '2024-09-21T16:00',
    venueName: 'Grand Plaza Hotel',
    venueAddress: 'https://maps.app.goo.gl/example123'
  });
  
  // Track validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Check for prefill data from query parameters
  useEffect(() => {
    if (searchParams) {
      const newFormData = { ...formData };
      let hasData = false;
      
      // Check each field and update if present in query params
      ['brideName', 'groomName', 'weddingDateTime', 'venueName', 'venueAddress'].forEach(field => {
        const value = searchParams.get(field);
        if (value) {
          newFormData[field as keyof typeof formData] = value;
          hasData = true;
        }
      });
      
      // Only update state if we found data in the query params
      if (hasData) {
        setFormData(newFormData);
      }
    }
  }, [searchParams]);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Form submission handler
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    
    Object.entries(formData).forEach(([key, value]) => {
      if (!value.trim()) {
        newErrors[key] = 'This field is required';
      }
    });
    
    // If there are errors, display them and don't proceed
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Build query params for the preview page
    const queryParams = new URLSearchParams();
    Object.entries(formData).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    
    // Navigate to preview page with form data
    router.push(`/preview?${queryParams.toString()}`);
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <h1 className="text-xl sm:text-3xl font-bold text-indigo-600 mb-8">Create Your Wedding Invitation</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bride's Name */}
        <div className="space-y-2 mb-4">
          <label htmlFor="brideName" className="block text-sm font-medium text-gray-700 mb-2">
            Bride&apos;s Name
          </label>
          <input
            type="text"
            id="brideName"
            name="brideName"
            value={formData.brideName}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
              errors.brideName ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.brideName && (
            <p className="text-red-500 text-sm">{errors.brideName}</p>
          )}
        </div>
        
        {/* Groom's Name */}
        <div className="space-y-2 mb-4">
          <label htmlFor="groomName" className="block text-sm font-medium text-gray-700 mb-2">
            Groom&apos;s Name
          </label>
          <input
            type="text"
            id="groomName"
            name="groomName"
            value={formData.groomName}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
              errors.groomName ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.groomName && (
            <p className="text-red-500 text-sm">{errors.groomName}</p>
          )}
        </div>
        
        {/* Wedding Date & Time */}
        <div className="space-y-2 mb-4">
          <label htmlFor="weddingDateTime" className="block text-sm font-medium text-gray-700 mb-2">
            Wedding Date & Time
          </label>
          <input
            type="datetime-local"
            id="weddingDateTime"
            name="weddingDateTime"
            value={formData.weddingDateTime}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
              errors.weddingDateTime ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.weddingDateTime && (
            <p className="text-red-500 text-sm">{errors.weddingDateTime}</p>
          )}
        </div>
        
        {/* Venue Name */}
        <div className="space-y-2 mb-4">
          <label htmlFor="venueName" className="block text-sm font-medium text-gray-700 mb-2">
            Venue Name
          </label>
          <input
            type="text"
            id="venueName"
            name="venueName"
            value={formData.venueName}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
              errors.venueName ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.venueName && (
            <p className="text-red-500 text-sm">{errors.venueName}</p>
          )}
        </div>
        
        {/* Venue Address / Google Maps URL */}
        <div className="space-y-2 mb-4">
          <label htmlFor="venueAddress" className="block text-sm font-medium text-gray-700 mb-2">
            Venue Address / Google Maps URL
          </label>
          <input
            type="text"
            id="venueAddress"
            name="venueAddress"
            value={formData.venueAddress}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
              errors.venueAddress ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.venueAddress && (
            <p className="text-red-500 text-sm">{errors.venueAddress}</p>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex-1 text-center"
          >
            Preview Invitation
          </button>
          
          <Link
            href="/"
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors flex-1 text-center"
          >
            Back to Home
          </Link>
        </div>
      </form>
    </div>
  );
}

// Loading fallback component
function FormLoading() {
  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <h1 className="text-xl sm:text-3xl font-bold text-indigo-600 mb-8">Loading Form...</h1>
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function FormPage() {
  return (
    <Suspense fallback={<FormLoading />}>
      <FormContent />
    </Suspense>
  );
} 