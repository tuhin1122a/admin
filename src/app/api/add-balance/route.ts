import { NextResponse } from "next/server";
import { searchUsers } from "@/action/add-balance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";

  try {
    const users = await searchUsers(query);
    return NextResponse.json(users);
  } catch {
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
