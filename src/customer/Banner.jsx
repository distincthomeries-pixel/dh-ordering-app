import { useState, useEffect } from 'react';

export default function Banner({ settings }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = settings?.banner_images || [];

  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000); 

    return () => clearInterval(interval);
  }, [images.length]);

  // 1. Image Slideshow
  if (images.length > 0) {
    return (
      <div className="relative w-full h-32 sm:h-48 bg-black overflow-hidden group">
        {images.map((img, idx) => {
          // Handle backwards compatibility (if image is just a string instead of an object)
          const imgUrl = typeof img === 'string' ? img : img.url;
          const imgLink = typeof img === 'string' ? null : img.link;

          const ImageContent = (
            <img
              src={imgUrl}
              alt="Announcement"
              className="w-full h-full object-cover"
            />
          );

          return (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                idx === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {imgLink ? (
                <a href={imgLink} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer">
                  {ImageContent}
                </a>
              ) : (
                ImageContent
              )}
            </div>
          );
        })}
        
        {/* Dots indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
            {images.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => setCurrentImageIndex(idx)}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. Scrolling Text Banner
  if (settings?.announcement_banner) {
    return (
      <div className="bg-brand-600 text-white text-xs py-2 px-4 overflow-hidden relative">
        <div className="animate-marquee">
          {settings.announcement_banner}
        </div>
      </div>
    );
  }

  return null;
}