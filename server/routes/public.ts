import { Router } from "express";
import { prisma } from "../prisma";
import { memoryDb, serveAssetFallback } from "../dbFallback";
import { getLatestTechNews } from "../services/techNews";

const router = Router();

router.get("/news", async (_req, res) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=30, stale-while-revalidate=60",
  );

  try {
    const techNews = await getLatestTechNews();
    const serializedTechNews = techNews.map((item) => ({
      id: item.id,
      title: item.title,
      excerpt: item.description,
      link: item.url,
      imageUrl: item.imageUrl,
      source: item.source,
      publishedAt: item.publishedAt,
      fetchedAt: item.fetchedAt,
    }));

    if (serializedTechNews.length >= 3) {
      return res.json(serializedTechNews.slice(0, 3));
    }

    const legacyItems = await prisma.news.findMany({
      orderBy: { date: "desc" },
      include: { image: true } as any,
      take: 3,
    });

    const legacySerialized = legacyItems.map((item) => ({
      id: item.id,
      title: item.title,
      excerpt: item.excerpt,
      link: null,
      image: item.image,
      source: null,
      publishedAt: item.date,
      fetchedAt: item.date,
    }));

    const combined = [...serializedTechNews, ...legacySerialized].slice(0, 3);
    if (combined.length === 3) {
      return res.json(combined);
    }

    if (combined.length > 0) {
      return res.json(combined);
    }
  } catch (error) {
    console.warn("Latest tech news feed failed", error);
  }

  const fallback = (memoryDb.news || []).slice(0, 3).map((item) => ({
    id: item.id,
    title: item.title,
    excerpt: item.excerpt,
    link: null,
    image: item.image,
    source: null,
    publishedAt: item.date,
    fetchedAt: item.date,
  }));

  res.json(fallback);
});

router.get("/testimonials", async (_req, res) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=60, stale-while-revalidate=120",
  );
  try {
    const items = await prisma.testimonial.findMany({
      include: { avatar: true } as any,
    });
    if (!items || items.length === 0) return res.json(memoryDb.testimonials);
    res.json(items);
  } catch (e) {
    console.warn(
      "Prisma testimonials failed, using memory store",
      e.message || e,
    );
    res.json(memoryDb.testimonials);
  }
});

router.get("/services", async (_req, res) => {
  try {
    const items = await prisma.service.findMany();
    if (!items || items.length === 0) return res.json(memoryDb.services);
    res.json(items);
  } catch (e) {
    console.warn("Prisma services failed, using memory store", e.message || e);
    res.json(memoryDb.services);
  }
});

router.get("/projects", async (_req, res) => {
  try {
    const items = await prisma.project.findMany({
      include: { image: true } as any,
    });
    if (!items || items.length === 0) return res.json(memoryDb.projects);
    res.json(items);
  } catch (e) {
    console.warn("Prisma projects failed, using memory store", e.message || e);
    res.json(memoryDb.projects);
  }
});

router.get("/about", async (_req, res) => {
  try {
    const items = await prisma.about.findMany({
      include: { image: true } as any,
    });
    if (!items || items.length === 0) return res.json(memoryDb.about);
    res.json(items);
  } catch (e) {
    console.warn("Prisma about failed, using memory store", e.message || e);
    res.json(memoryDb.about);
  }
});

router.get("/sections", async (_req, res) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=30, stale-while-revalidate=60",
  );
  try {
    const items = await prisma.section.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        key: true,
        heading: true,
        content: true,
        enabled: true,
        order: true,
      },
    });
    if (!items || items.length === 0) {
      return res.json(memoryDb.sections || []);
    }
    res.json(items);
  } catch (e) {
    console.warn("Prisma sections failed, using memory store", e.message || e);
    res.json(memoryDb.sections || []);
  }
});

router.get("/jobs", async (_req, res) => {
  try {
    const items = await prisma.job.findMany();
    if (!items || items.length === 0) return res.json(memoryDb.jobs);
    res.json(items);
  } catch (e) {
    console.warn("Prisma jobs failed, using memory store", e.message || e);
    res.json(memoryDb.jobs);
  }
});

// Serve asset bytes publicly
router.get("/assets/:id", async (req, res) => {
  const id = String(req.params.id);
  try {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return serveAssetFallback(id, res);
    res.setHeader("Content-Type", asset.mime);
    res.send(Buffer.from(asset.data as Buffer));
  } catch (e) {
    console.warn("Prisma asset fetch failed, using fallback", e.message || e);
    serveAssetFallback(id, res);
  }
});

export default router;
