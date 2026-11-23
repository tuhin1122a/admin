import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const games: Array<{
      gameUid: string;
      brandId: string;
      name?: string;
      logo?: string;
    }> = body.games || [];

    if (!Array.isArray(games) || games.length === 0) {
      return NextResponse.json(
        { error: "No games provided for image download" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "games");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let downloadedCount = 0;
    const updatedGames: Array<{ gameUid: string; localUrl: string }> = [];

    // Download images concurrently with batch limit of 10
    const chunkSize = 10;
    for (let i = 0; i < games.length; i += chunkSize) {
      const chunk = games.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (g) => {
          const uid = String(g.gameUid).trim();
          const brandId = String(g.brandId).trim();
          if (!uid) return;

          const sourceUrl =
            g.logo && g.logo.startsWith("http")
              ? g.logo
              : `https://igamingapis.com/img/${uid}.png`;

          const localFileName = `${uid}.png`;
          const filePath = path.join(uploadDir, localFileName);
          const localUrl = `/uploads/games/${localFileName}`;

          try {
            const res = await fetch(sourceUrl, {
              signal: AbortSignal.timeout(8000),
            });
            if (res.ok) {
              const buffer = Buffer.from(await res.arrayBuffer());
              if (buffer.length > 500) {
                // Ensure it's not an empty or broken error response
                await fs.promises.writeFile(filePath, buffer);
                downloadedCount++;

                // Save to providerGameSetting and hotGame
                await db.providerGameSetting.upsert({
                  where: { gameUid: uid },
                  create: {
                    gameUid: uid,
                    brandId,
                    name: g.name || `Game #${uid}`,
                    img: localUrl,
                    category: "slots",
                    isActive: true,
                    sortOrder: 9999,
                  },
                  update: {
                    img: localUrl,
                  },
                });

                await db.hotGame.updateMany({
                  where: { gameUid: uid },
                  data: { img: localUrl },
                });

                updatedGames.push({ gameUid: uid, localUrl });
              }
            }
          } catch (fetchErr) {
            console.error(`Failed to download image for game ${uid}:`, fetchErr);
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully downloaded ${downloadedCount} game images to your local server!`,
      downloadedCount,
      updatedGames,
    });
  } catch (error: any) {
    console.error("Bulk sync-images error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to download game images" },
      { status: 500 }
    );
  }
}
