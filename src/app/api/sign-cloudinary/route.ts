import cloudinary from "cloudinary";
import { NextRequest } from "next/server";

const cloudinaryConfig = cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export const POST = async (req: NextRequest) => {
  try {
    const { timestamp } = await req.json();
    const signature = cloudinary.v2.utils.api_sign_request(
      { timestamp },
      process.env.CLOUDINARY_SECRET!
    );

    return Response.json(
      {
        payload: {
          signature,
          timestamp,
          cloud_name: cloudinaryConfig.cloud_name,
          api_key: cloudinaryConfig.api_key,
        },
        succcess: true,
        message: "Signed",
      },
      { status: 201 }
    );
  } catch {
    return Response.json(
      { message: "Unknown Error Try agin", success: false },
      { status: 500 }
    );
  }
};

export const DELETE = async (req: NextRequest) => {
  try {
    const { publicId } = await req.json();
    if (!publicId) {
      return Response.json(
        { message: "Missing publicId", success: false },
        { status: 404 }
      );
    }
    const result = await cloudinary.v2.uploader.destroy(publicId);
    if (result.result !== "ok") {
      return Response.json(
        { message: "Please Try agin", success: false },
        { status: 500 }
      );
    }
    return Response.json(
      { message: "Image deleted successfully", success: true },
      { status: 200 }
    );
  } catch {
    return Response.json(
      { message: "Unknown Error Try agin", success: false },
      { status: 500 }
    );
  }
};
