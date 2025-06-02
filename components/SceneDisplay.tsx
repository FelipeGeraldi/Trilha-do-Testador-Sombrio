
import React, { forwardRef, useState, useEffect, useRef } from 'react';

interface SceneDisplayProps {
  sceneText: string;
  imageUrl: string | null;
  isLoadingImage?: boolean;
}

const SceneDisplay = forwardRef<HTMLDivElement, SceneDisplayProps>(({ sceneText, imageUrl, isLoadingImage }, ref) => {
  const [isImageVisible, setIsImageVisible] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Split scene text into paragraphs for better readability
  const paragraphs = sceneText.split(/\n\s*\n+/);

  useEffect(() => {
    // Reset visibility to false when imageUrl changes, allowing animation to replay for new images.
    setIsImageVisible(false); 

    if (imageUrl && imageRef.current) {
      const imgElement = imageRef.current;
      const handleLoad = () => {
        setIsImageVisible(true);
      };

      // Check if the image is already complete (e.g., from browser cache)
      if (imgElement.complete) {
        handleLoad();
      } else {
        imgElement.addEventListener('load', handleLoad);
        // Optional: You could add an error listener here too
        // imgElement.addEventListener('error', () => console.error('Image failed to load:', imageUrl));
      }

      return () => {
        imgElement.removeEventListener('load', handleLoad);
        // imgElement.removeEventListener('error', ...);
      };
    }
  }, [imageUrl]); // Effect runs when imageUrl changes

  return (
    <div className="flex-grow flex flex-col md:flex-row gap-4 mb-4 overflow-hidden">
      {imageUrl || isLoadingImage ? (
        <div className="w-full md:w-1/3 h-64 md:h-auto bg-gray-800 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
          {/* Display loading placeholder if isLoadingImage is true and imageUrl is not yet available */}
          {isLoadingImage && !imageUrl && (
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-24 h-24 bg-gray-700 rounded-md"></div>
              <p className="text-gray-500 mt-2 text-sm">Gerando imagem...</p>
            </div>
          )}
          {/* Display the image once imageUrl is available, with fade-in effect */}
          {imageUrl && (
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Cena do jogo"
              className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${isImageVisible ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
        </div>
      ) : (
         <div className="w-full md:w-1/3 h-64 md:h-auto bg-gray-800 rounded-lg shadow-lg flex items-center justify-center">
           <p className="text-gray-600 p-4 text-center text-sm">Nenhuma imagem para esta cena ou falha ao carregar.</p>
         </div>
      )}
      <div 
        ref={ref} // This ref is for the text container, for scrolling in App.tsx
        className="w-full md:w-2/3 bg-gray-850 p-4 sm:p-6 rounded-lg shadow-lg overflow-y-auto scroll-smooth"
        style={{ maxHeight: 'calc(100vh - 250px)' }} // Adjust max height as needed
        aria-live="polite"
      >
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-3 text-gray-300 leading-relaxed whitespace-pre-wrap">
            {paragraph.startsWith("> ") ? <strong className="text-purple-400">{paragraph}</strong> : paragraph}
          </p>
        ))}
        {sceneText.trim() === "" && <p className="text-gray-500">Carregando cena inicial...</p>}
      </div>
      {/* The <style jsx> block has been removed */}
    </div>
  );
});

SceneDisplay.displayName = 'SceneDisplay';
export default SceneDisplay;
