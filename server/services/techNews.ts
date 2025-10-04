import { prisma } from "../prisma";

const TECH_NEWS_ENDPOINT =
  "https://techcrunch.com/wp-json/wp/v2/posts?per_page=6&_embed";
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface RawTechCrunchPost {
  id?: number;
  link?: string;
  date?: string;
  date_gmt?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  yoast_head_json?: {
    og_description?: string;
    og_title?: string;
    og_image?: { url?: string }[];
  };
  jetpack_featured_media_url?: string;
  _embedded?: {
    [key: string]: Array<{ source_url?: string; media_details?: any }>;
  };
}

export interface NormalizedTechNewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  source?: string | null;
  publishedAt?: Date | null;
  fetchedAt: Date;
}

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function stripTags(input: string): string {
  return decodeEntities(input.replace(/<[^>]*>/g, "").trim());
}

function extractImage(post: RawTechCrunchPost): string | undefined {
  const fromYoast = post.yoast_head_json?.og_image?.[0]?.url;
  if (fromYoast) return fromYoast;
  if (post.jetpack_featured_media_url) return post.jetpack_featured_media_url;
  const embedded = post._embedded?.["wp:featuredmedia"]?.[0];
  if (embedded?.source_url) return embedded.source_url;
  return undefined;
}

async function fetchExternalTechNews(): Promise<NormalizedTechNewsItem[]> {
  const response = await fetch(TECH_NEWS_ENDPOINT, {
    headers: { "User-Agent": "FusionStarterBot/1.0 (+https://builder.io)" },
  });

  if (!response.ok) {
    throw new Error(`Tech news fetch failed: ${response.status}`);
  }

  const payload = (await response.json()) as RawTechCrunchPost[];
  if (!Array.isArray(payload)) return [];

  const now = new Date();

  return payload
    .map((post) => {
      const link = typeof post.link === "string" ? post.link : undefined;
      const rawTitle = post.title?.rendered ?? "";
      const rawExcerpt =
        post.yoast_head_json?.og_description ?? post.excerpt?.rendered ?? "";
      if (!link || !rawTitle) return null;

      const title = stripTags(rawTitle);
      const description = stripTags(rawExcerpt || title);
      const imageUrl = extractImage(post);
      const publishedAt = post.date_gmt || post.date;

      return {
        id: `${post.id ?? link}`,
        title,
        description,
        url: link,
        imageUrl,
        source: "TechCrunch",
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        fetchedAt: now,
      } satisfies NormalizedTechNewsItem;
    })
    .filter((item): item is NormalizedTechNewsItem => item !== null)
    .slice(0, 6);
}

function mapRecordToNormalized(record: {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  source: string | null;
  publishedAt: Date | null;
  fetchedAt: Date;
}): NormalizedTechNewsItem {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    url: record.url,
    imageUrl: record.imageUrl,
    source: record.source,
    publishedAt: record.publishedAt,
    fetchedAt: record.fetchedAt,
  };
}

export async function getLatestTechNews(): Promise<NormalizedTechNewsItem[]> {
  const now = Date.now();
  const staleCutoff = now - TWENTY_FOUR_HOURS_MS;

  const existing = await prisma.techNews.findMany({
    orderBy: { fetchedAt: "desc" },
    take: 3,
  });

  if (
    existing.length === 3 &&
    existing.every((item) => item.fetchedAt.getTime() >= staleCutoff)
  ) {
    return existing.map(mapRecordToNormalized);
  }

  try {
    const externalItems = await fetchExternalTechNews();
    const topThree = externalItems.slice(0, 3);

    if (topThree.length === 3) {
      await prisma.$transaction([
        prisma.techNews.deleteMany({}),
        prisma.techNews.createMany({
          data: topThree.map((item) => ({
            title: item.title,
            description: item.description,
            url: item.url,
            imageUrl: item.imageUrl ?? null,
            source: item.source ?? null,
            publishedAt: item.publishedAt ?? null,
            fetchedAt: new Date(),
          })),
        }),
      ]);

      const refreshed = await prisma.techNews.findMany({
        orderBy: { fetchedAt: "desc" },
        take: 3,
      });

      if (refreshed.length === 3) {
        return refreshed.map(mapRecordToNormalized);
      }
    }
  } catch (error) {
    console.warn("Failed to refresh tech news", error);
  }

  if (existing.length) {
    return existing.map(mapRecordToNormalized);
  }

  return [];
}
