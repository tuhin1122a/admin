import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import cloudinary from "cloudinary";
import path from "path";

const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
const cloudKey = process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API;
const cloudSecret =
  process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET;

if (cloudName && cloudKey && cloudSecret) {
  cloudinary.v2.config({
    cloud_name: cloudName,
    api_key: cloudKey,
    api_secret: cloudSecret,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate image mime or extension
    const validMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/avif",
    ];
    if (!validMimes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|gif|svg|avif)$/i)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a valid image (PNG, JPG, WEBP, SVG, GIF)." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || ".png";
    const baseClean = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueFileName = `${Date.now()}-${baseClean}${ext}`;
    const mimeType = file.type && file.type.startsWith("image/") ? file.type : "image/png";

    let publicUrl = "";
    if (cloudName && cloudKey && cloudSecret) {
      try {
        publicUrl = await new Promise<string>((resolve, reject) => {
          cloudinary.v2.uploader
            .upload_stream(
              {
                folder: "rk444_games",
                resource_type: "image",
                unique_filename: true,
              },
              (error, result) => {
                if (error || !result?.secure_url) {
                  reject(error || new Error("No secure_url"));
                } else {
                  resolve(result.secure_url);
                }
              }
            )
            .end(buffer);
        });
      } catch (err) {
        console.warn("[upload] Cloudinary upload failed, using data URL:", err);
      }
    }

    if (!publicUrl) {
      publicUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload image file" },
      { status: 500 }
    );
  }
}
