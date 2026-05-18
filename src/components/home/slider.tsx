"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useGetSiteSettingsQuery } from "@/lib/features/siteSettingsApi";

const Slider = () => {
  const { data, isLoading, isError } = useGetSiteSettingsQuery({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance slider every 5 seconds
  useEffect(() => {
    if (!data?.siteSettings?.sliderImages || data.siteSettings.sliderImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === data.siteSettings.sliderImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [data?.siteSettings?.sliderImages]);

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Loading slider...</span>
      </div>
    );
  }

  if (isError || !data?.siteSettings?.sliderImages || data.siteSettings.sliderImages.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">No slider images available</span>
      </div>
    );
  }

  const sliderImages = data.siteSettings.sliderImages;

  return (
    <div className="w-full max-w-4xl mx-auto relative rounded-lg overflow-hidden">
      {/* Slider Images */}
      <div className="relative h-64 md:h-96">
        {sliderImages.map((image: string, index: number) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image}
              alt={`Slider ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-inline-size: 768px) 100vw, (max-inline-size: 1200px) 50vw, 33vw"
            />
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      {sliderImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {sliderImages.map((_: string, index: number) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full ${
                index === currentIndex ? "bg-white" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Slider;