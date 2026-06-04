import { NextResponse } from "next/server";
import { fetchReadmeFromGitHub, parseGitHubRepoUrl } from "@/lib/github";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url || !parseGitHubRepoUrl(url)) {
      return NextResponse.json({ error: "Invalid or missing URL" }, { status: 400 });
    }

    const result = await fetchReadmeFromGitHub(url);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json({ content: result.content });
  } catch (error) {
    console.error("README fetch failed", error);
    return NextResponse.json(
      { error: "Could not fetch README. Check the URL or try pasting the README directly." },
      { status: 500 },
    );
  }
}
