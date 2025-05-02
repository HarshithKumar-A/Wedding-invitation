// Define the template interface
export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnailSrc: string;
  primaryColor: string;
  secondaryColor: string;
  customCss?: string; // Optional custom CSS for the template
}

// Export an array of wedding invitation templates
export const templates: Template[] = [
  {
    id: 'elegant-floral',
    name: 'Elegant Floral',
    description: 'A sophisticated design with delicate floral elements and elegant typography.',
    thumbnailSrc: '/templates/elegant-floral-thumb.jpg',
    primaryColor: '#7c3aed',
    secondaryColor: '#f3e8ff',
  },
  {
    id: 'rustic-charm',
    name: 'Rustic Charm',
    description: 'A warm, earthy design with wooden textures and handwritten-style fonts.',
    thumbnailSrc: '/templates/rustic-charm-thumb.jpg',
    primaryColor: '#92400e',
    secondaryColor: '#fef3c7',
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'A clean, contemporary design with simple lines and minimalist aesthetic.',
    thumbnailSrc: '/templates/modern-minimal-thumb.jpg',
    primaryColor: '#1f2937',
    secondaryColor: '#f9fafb',
  },
  {
    id: 'romantic-script',
    name: 'Romantic Script',
    description: 'A dreamy design with flowing script fonts and soft color palette.',
    thumbnailSrc: '/templates/romantic-script-thumb.jpg',
    primaryColor: '#be185d',
    secondaryColor: '#fce7f3',
  },
  {
    id: 'tropical-paradise',
    name: 'Tropical Paradise',
    description: 'A vibrant design with lush tropical elements and bright colors.',
    thumbnailSrc: '/templates/tropical-paradise-thumb.jpg',
    primaryColor: '#047857',
    secondaryColor: '#d1fae5',
  },
  {
    id: 'dutch-save-the-date',
    name: 'Dutch Save the Date',
    description: 'A classic save-the-date card with elegant typography and positioned QR code.',
    thumbnailSrc: '/templates/dutch-save-the-date-thumb.jpg',
    primaryColor: '#96979b',
    secondaryColor: '#9beafb',
  }
]; 