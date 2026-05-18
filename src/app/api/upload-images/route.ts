import { NextResponse } from "next/server";
import cloudinary from "cloudinary";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export async function POST(request: Request) {
  try {
    // Check if the request is multipart form data
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    
    // Upload slider images
    const sliderImages: string[] = [];
    const sliderFiles = formData.getAll("sliderImages") as File[];
    
    for (const file of sliderFiles) {
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.v2.uploader
            .upload_stream(
              {
                folder: "slider_images",
                use_filename: true,
                unique_filename: false,
              },
              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            )
            .end(buffer);
        });
        
        sliderImages.push((result as any).secure_url);
      }
    }
    
    // Upload promotions logo
    let promotionsLogo = "";
    const logoFile = formData.get("promotionsLogo") as File | null;
    
    if (logoFile instanceof File) {
      const arrayBuffer = await logoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader
          .upload_stream(
            {
              folder: "promotions_logo",
              use_filename: true,
              unique_filename: false,
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          )
          .end(buffer);
      });
      
      promotionsLogo = (result as any).secure_url;
    }
    
    return NextResponse.json(
      { 
        message: "Images uploaded successfully",
        sliderImages,
        promotionsLogo
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading images:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";