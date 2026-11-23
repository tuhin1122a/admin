import { auth } from "@/auth";
import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

// Helper to sync all currently active banners into SiteSetting.sliderImages
async function syncActiveBannersToSiteSettings() {
  try {
    const activeBanners = await db.banner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    const urls = activeBanners.map((b) => b.imageUrl);

    const site = await db.siteSetting.findFirst();
    if (site) {
      await db.siteSetting.update({
        where: { id: site.id },
        data: { sliderImages: urls },
      });
    } else {
      await db.siteSetting.create({
        data: { sliderImages: urls },
      });
    }
    return urls;
  } catch (err) {
    console.error("Failed to sync banners to SiteSetting:", err);
    return [];
  }
}

// GET: Fetch banners
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = (session?.user as any)?.role === "ADMIN";
    const { searchParams } = new URL(req.url);
    const fetchAll = searchParams.get("all") === "true" || isAdmin;

    const where = fetchAll ? {} : { isActive: true };

    const banners = await db.banner.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      banners,
      total: banners.length,
      activeCount: banners.filter((b) => b.isActive).length,
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { error: INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}

// POST: Add new banner(s) via URL or Multiple File Upload
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    // 1. Multipart Form Data (Multiple file upload directly to server)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const files = formData.getAll("files") as File[];
      const singleFile = formData.get("file") as File | null;
      const allFiles = files.length > 0 ? files : singleFile ? [singleFile] : [];

      if (allFiles.length === 0) {
        return NextResponse.json(
          { error: "No image files provided for upload" },
          { status: 400 }
        );
      }

      // Ensure directory exists: public/uploads/banners
      const uploadDir = path.join(process.cwd(), "public", "uploads", "banners");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Current max sort order
      const lastBanner = await db.banner.findFirst({
        orderBy: { sortOrder: "desc" },
      });
      let nextSortOrder = (lastBanner?.sortOrder ?? 0) + 1;

      const createdBanners = [];

      for (const file of allFiles) {
        if (!(file instanceof File) || file.size === 0) continue;

        const ext = path.extname(file.name) || ".png";
        const baseClean = path
          .basename(file.name, ext)
          .replace(/[^a-zA-Z0-9_-]/g, "_");
        const uniqueFileName = `${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}-${baseClean}${ext}`;
        const filePath = path.join(uploadDir, uniqueFileName);

        const bytes = await file.arrayBuffer();
        await fs.promises.writeFile(filePath, Buffer.from(bytes));

        const publicUrl = `/uploads/banners/${uniqueFileName}`;
        const rawTitle = path.basename(file.name, ext).replace(/[_-]/g, " ");

        const banner = await db.banner.create({
          data: {
            imageUrl: publicUrl,
            title: rawTitle,
            linkUrl: "",
            isActive: true,
            sortOrder: nextSortOrder++,
          },
        });
        createdBanners.push(banner);
      }

      await syncActiveBannersToSiteSettings();

      return NextResponse.json({
        success: true,
        message: `${createdBanners.length} banner(s) uploaded successfully!`,
        banners: createdBanners,
      });
    }

    // 2. JSON Body (Single or Multiple Image URLs)
    const body = await req.json();
    const {
      imageUrl,
      imageUrls,
      title,
      linkUrl,
      isActive = true,
      sortOrder,
    } = body;

    const urlsToAdd = Array.isArray(imageUrls)
      ? imageUrls.map((u: string) => String(u).trim()).filter(Boolean)
      : imageUrl
      ? [String(imageUrl).trim()]
      : [];

    if (urlsToAdd.length === 0) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    const lastBanner = await db.banner.findFirst({
      orderBy: { sortOrder: "desc" },
    });
    let nextSort = sortOrder !== undefined ? Number(sortOrder) : (lastBanner?.sortOrder ?? 0) + 1;

    const createdBanners = [];
    for (const url of urlsToAdd) {
      const b = await db.banner.create({
        data: {
          imageUrl: url,
          title: title ? String(title).trim() : null,
          linkUrl: linkUrl ? String(linkUrl).trim() : null,
          isActive: Boolean(isActive),
          sortOrder: nextSort++,
        },
      });
      createdBanners.push(b);
    }

    await syncActiveBannersToSiteSettings();

    return NextResponse.json({
      success: true,
      message: `${createdBanners.length} banner(s) added successfully!`,
      banners: createdBanners,
    });
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { error: INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}

// PATCH: Update banner (toggle active, sortOrder, title, linkUrl, imageUrl)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, isActive, sortOrder, title, linkUrl, imageUrl } = body;

    if (!id) {
      return NextResponse.json({ error: "Banner ID is required" }, { status: 400 });
    }

    const existing = await db.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (typeof sortOrder === "number") updateData.sortOrder = sortOrder;
    if (typeof title === "string") updateData.title = title.trim();
    if (typeof linkUrl === "string") updateData.linkUrl = linkUrl.trim();
    if (typeof imageUrl === "string" && imageUrl.trim()) updateData.imageUrl = imageUrl.trim();

    const updated = await db.banner.update({
      where: { id },
      data: updateData,
    });

    await syncActiveBannersToSiteSettings();

    return NextResponse.json({
      success: true,
      message: "Banner updated successfully!",
      banner: updated,
    });
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { error: INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}

// DELETE: Delete a banner
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json({ error: "Banner ID is required" }, { status: 400 });
    }

    const banner = await db.banner.findUnique({ where: { id } });
    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    // Try to delete local image file if it exists in public/uploads/banners
    if (banner.imageUrl?.startsWith("/uploads/banners/")) {
      const localFilePath = path.join(process.cwd(), "public", banner.imageUrl);
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch {
          // ignore unlink error
        }
      }
    }

    await db.banner.delete({ where: { id } });
    await syncActiveBannersToSiteSettings();

    return NextResponse.json({
      success: true,
      message: "Banner deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      { error: INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
