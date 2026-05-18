"use client";

import Image from "next/image";
import { useGetSiteSettingsQuery } from "@/lib/features/siteSettingsApi";

const Promotions = () => {
  const { data, isLoading, isError } = useGetSiteSettingsQuery({});

  if (isLoading) {
    return (
      <div className="w-full h-32 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Loading promotions...</span>
      </div>
    );
  }

  if (isError || !data?.siteSettings?.promotionsLogo) {
    return (
      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">No promotions available</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto my-8">
      <h2 className="text-2xl font-bold text-center mb-4">Current Promotions</h2>
      <div className="bg-white rounded-lg shadow-lg p-4 flex justify-center">
        <Image
          src={data.siteSettings.promotionsLogo}
          alt="Promotions"
          width={500}
          height={200}
          className="max-w-full h-auto max-h-32 object-contain"
        />
      </div>
    </div>
  );
};

export default Promotions;