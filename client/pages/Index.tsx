import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Palette,
  Cpu,
  Target,
  BarChart3,
  Quote,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import Section from "@/components/site/Section";
import AnimatedTitle from "@/components/site/AnimatedTitle";
import TiltCard from "@/components/site/TiltCard";
import { Link, useLoaderData } from "react-router-dom";
import { getIconByName } from "@/lib/iconMap";

function AnimatedCounter({
  target,
  suffix = "",
  duration = 1500,
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const startedRef = React.useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const easeOutQuad = (t: number) => t * (2 - t);

    let rafId = 0;
    let start: number | null = null;

    const run = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuad(progress);
      const current = Math.floor(eased * target);
      setValue(current);
      if (progress < 1) rafId = requestAnimationFrame(run);
    };

    const onIntersection: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          rafId = requestAnimationFrame(run);
        }
      });
    };

    const obs = new IntersectionObserver(onIntersection, { threshold: 0.3 });
    obs.observe(el);

    return () => {
      obs.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [target, duration]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

export async function loader() {
  try {
    // Fetch only sections fast; other content will use built-in fallbacks
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const s = await fetch("/api/sections", { signal: controller.signal })
      .then((r) => r.json())
      .catch(() => []);
    clearTimeout(timeout);

    const sectionsMap: Record<string, any> = {};
    if (Array.isArray(s))
      s.filter((it: any) => it?.enabled !== false).forEach((it: any) => {
        if (it && it.key) sectionsMap[it.key] = it;
      });

    // Return quickly; component has defaults for news/testimonials
    return { sections: sectionsMap, news: [], testimonials: [] };
  } catch (e) {
    return { sections: {}, news: [], testimonials: [] };
  }
}

export default function Index() {
  const { sections, news, testimonials } = useLoaderData() as {
    sections: Record<string, any>;
    news: any[];
    testimonials: any[];
  };

  const defaultNews = [
    {
      id: "s1",
      title: "Q4 Highlights",
      excerpt: "Milestones across platform and growth.",
      image:
        "https://cdn.builder.io/api/v1/image/assets%2Fee358a6e64744467b38bd6a3468eaeb9%2F9aebb7e90f334acbb611405deeab415d?format=webp&width=1200&q=80",
    },
    {
      id: "s2",
      title: "New Office",
      excerpt: "We expanded to Berlin.",
      image:
        "https://images.unsplash.com/photo-1556761175-129418cb2dfe?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "s3",
      title: "Open Roles",
      excerpt: "We're hiring across the stack.",
      image:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    },
  ];
  const defaultTestimonials = [
    {
      id: "tt1",
      author: "Alex M.",
      role: "CTO, Nimbus",
      quote: "They move fast without breaking clarity.",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "tt2",
      author: "Priya S.",
      role: "VP Eng, Northstar",
      quote: "A true partner from strategy to delivery.",
      avatar:
        "https://images.unsplash.com/photo-1531123414780-f0b5f9d9d0a6?auto=format&fit=crop&w=400&q=80",
    },
  ];

  const [newsItems, setNewsItems] = useState<any[]>(
    news && news.length ? news : defaultNews,
  );
  const [testiItems, setTestiItems] = useState<any[]>(
    testimonials && testimonials.length ? testimonials : defaultTestimonials,
  );

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    Promise.all([
      fetch("/api/news", { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : ([] as any[])))
        .catch(() => []),
      fetch("/api/testimonials", { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : ([] as any[])))
        .catch(() => []),
    ])
      .then(([n, t]) => {
        if (aborted) return;
        if (Array.isArray(n) && n.length) setNewsItems(n);
        if (Array.isArray(t) && t.length) setTestiItems(t);
      })
      .finally(() => clearTimeout(timer));
    return () => {
      aborted = true;
      controller.abort();
    };
  }, []);

  return (
    <div>
      {/* Hero */}
      {sections.hero ? (
        <Section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <AnimatedTitle
                text={
                  sections.hero?.heading ||
                  "Transforming Businesses with AI and Digital Innovation"
                }
                className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight text-foreground"
              />
              <p className="mt-6 text-lg text-foreground/90 max-w-xl">
                {sections.hero?.content ||
                  "We partner with organizations to drive efficiency, accelerate growth, and deliver measurable outcomes through AI-powered platforms, digital transformation, and next-generation software solutions."}
              </p>
              <div className="mt-8 flex items-center gap-4">
                <Link
                  to="/products"
                  className="inline-flex items-center rounded-full glass-card px-6 py-3 text-sm font-semibold text-foreground shadow-lg"
                >
                  Explore Products <ArrowRight className="ml-3 h-4 w-4" />
                </Link>
                <Link
                  to="/contact"
                  className="text-sm font-semibold text-foreground/90 hover:text-foreground"
                >
                  Speak to an Expert
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl glass-card border border-primary/20 p-4 sm:p-6 md:p-8">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-120px" }}
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.08 } },
                  }}
                  className="grid grid-cols-2 gap-4 sm:gap-6 w-full items-stretch"
                >
                  {(() => {
                    const iconMap: Record<string, any> = {
                      target: Target,
                      palette: Palette,
                      cpu: Cpu,
                      "bar-chart-3": BarChart3,
                    };
                    let items: any[] = [];
                    try {
                      items = sections.flowchart?.content
                        ? JSON.parse(sections.flowchart.content)
                        : [];
                    } catch {
                      items = [];
                    }
                    if (!Array.isArray(items) || items.length === 0) {
                      items = [
                        {
                          icon: "target",
                          label: "Strategy",
                          desc: "Crisp systems that scale.",
                        },
                        {
                          icon: "palette",
                          label: "Design",
                          desc: "Crisp systems that scale.",
                        },
                        {
                          icon: "cpu",
                          label: "Engineering",
                          desc: "Crisp systems that scale.",
                        },
                        {
                          icon: "bar-chart-3",
                          label: "Analytics",
                          desc: "Crisp systems that scale.",
                        },
                      ];
                    }
                    return items.map((i, idx) => {
                      const Icon = iconMap[i.icon] || Target;
                      return (
                        <motion.div
                          key={idx}
                          variants={{
                            hidden: { opacity: 0, y: 18 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: { duration: 0.45 },
                            },
                          }}
                        >
                          <TiltCard className="h-full min-h-[160px]">
                            <Icon className="h-6 w-6 text-primary/100" />
                            <div className="mt-4 font-semibold text-primary/100">
                              {i.label}
                            </div>
                            <div className="text-sm text-primary/80">
                              {i.desc}
                            </div>
                          </TiltCard>
                        </motion.div>
                      );
                    });
                  })()}
                </motion.div>
              </div>
            </div>
          </div>
        </Section>
      ) : null}

      {/* What We Do: 3-column intro */}
      <Section
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16"
        delay={0.05}
      >
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            What We Do
          </h2>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <TiltCard className="min-h-[160px]">
            <Target className="h-6 w-6 text-primary/100" />
            <div className="mt-4 font-semibold text-primary/100">
              AI &amp; Digital Transformation
            </div>
            <div className="text-sm text-primary/80 mt-2">
              Reimagine processes with intelligence and automation.
            </div>
          </TiltCard>

          <TiltCard className="min-h-[160px]">
            <BarChart3 className="h-6 w-6 text-primary/100" />
            <div className="mt-4 font-semibold text-primary/100">
              Enterprise Products
            </div>
            <div className="text-sm text-primary/80 mt-2">
              Future-ready platforms across Retail, NBFC, MEP, and Data
              Transfer.
            </div>
          </TiltCard>

          <TiltCard className="min-h-[160px]">
            <Cpu className="h-6 w-6 text-primary/100" />
            <div className="mt-4 font-semibold text-primary/100">
              Technology Services
            </div>
            <div className="text-sm text-primary/80 mt-2">
              Architecture review, cloud enablement, AI augmentation, and
              enterprise security.
            </div>
          </TiltCard>
        </div>
      </Section>

      {/* About teaser: merged Who We Are + What We Do */}
      <Section
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16"
        delay={0.1}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              {sections.who?.heading || "Who We Are"}
            </h2>
            <div className="mt-4 text-foreground/85 max-w-prose space-y-4">
              <p>
                {sections.who?.content ||
                  "A senior, cross‑functional team that designs, builds, and scales products people love. We blend strategy, design, engineering, and analytics to deliver measurable impact."}
              </p>
              <p>
                We partner with leadership to translate uncertain opportunities
                into clear roadmaps — combining user research, pragmatic
                engineering, and measurable outcomes. Our teams have shipped
                platforms for startups and enterprises across regulated and
                consumer markets.
              </p>
              <p>
                Operating as a remote-first company with strategic offices
                globally, we emphasize clarity, fast feedback loops, and
                long-term partnerships that prioritize user value and technical
                excellence.
              </p>
            </div>

            <div className="mt-6">
              <Link
                className="inline-flex items-center rounded-full glass-card px-5 py-2 text-sm font-semibold"
                to="/about"
              >
                Learn more about us
              </Link>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            {/* soft halo behind subject to hide edge artifacts */}
            <div
              aria-hidden
              className="absolute rounded-full pointer-events-none"
              style={{
                width: "64%",
                height: "80%",
                transform: "translateY(6%)",
                background:
                  "radial-gradient(circle at 40% 30%, rgba(124,58,237,0.36) 0%, rgba(167,139,250,0.12) 35%, transparent 70%)",
                filter: "blur(38px) brightness(0.95)",
                zIndex: 10,
              }}
            />

            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fee358a6e64744467b38bd6a3468eaeb9%2F4ed1abb4e7b8432696da3fc4bf216ad1?format=webp&width=800"
              alt="Woman"
              className="relative w-auto max-h-64 md:max-h-80 lg:max-h-[420px] object-contain bg-transparent"
              style={{
                filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.45))",
                zIndex: 20,
              }}
            />

            {/* bottom blur/fade to blend subject into background */}
            <div
              aria-hidden
              className="absolute pointer-events-none"
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                bottom: 0,
                width: "70%",
                height: "160px",
                zIndex: 25,
                background:
                  "linear-gradient(180deg, rgba(124,58,237,0) 0%, rgba(124,58,237,0.18) 40%, rgba(124,58,237,0.6) 85%, rgba(167,139,250,0.8) 100%)",
                filter: "blur(14px)",
                borderRadius: "40px",
              }}
            />
          </div>
        </div>
      </Section>

      {/* Impact Snapshot */}
      <Section
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12"
        delay={0.14}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center items-center">
          <div className="group block rounded-lg">
            <div className="flex items-center justify-center">
              <Globe className="h-12 w-12 text-primary/90" />
            </div>
            <div className="mt-2 text-sm text-foreground/85 whitespace-nowrap">
              Presence across India &amp; the Middle East
            </div>
          </div>

          <Link to="/clients" className="group block rounded-lg">
            <div className="text-4xl font-extrabold text-foreground">
              <AnimatedCounter target={45} suffix="+" duration={1200} />
            </div>
            <div className="mt-2 text-sm text-foreground/85">
              Clients served
            </div>
          </Link>

          <Link to="/products" className="group block rounded-lg">
            <div className="text-4xl font-extrabold text-foreground">
              <AnimatedCounter target={4} duration={1000} />
            </div>
            <div className="mt-2 text-sm text-foreground/85">
              Flagship enterprise products
            </div>
          </Link>
        </div>
      </Section>

      {/* Testimonials - infographic style */}
      <Section
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16"
        delay={0.25}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            Testimonials
          </h2>
          <Link
            to="/testimonials"
            className="text-sm font-semibold text-foreground/90 hover:text-foreground"
          >
            All Testimonials
          </Link>
        </div>

        <div className="mt-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              ...(testiItems || []),
              {
                id: "tt_extra",
                author: "Alex J.",
                role: "CEO, Inn Solutions",
                quote: "Working with AUIO was a Game-Changer.",
                avatar:
                  "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&q=80",
              },
              {
                id: "tt4",
                author: "Sam R.",
                role: "Product Lead, Gamma",
                quote: "A focused team that delivers measurable outcomes.",
                avatar:
                  "https://images.unsplash.com/photo-1545996124-1b3aab1d3c5b?auto=format&fit=crop&w=400&q=80",
              },
            ]
              .slice(0, 4)
              .map((t: any, idx: number) => {
                const fallbacks = [
                  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
                  "https://images.unsplash.com/photo-1531123414780-f0b5f9d9d0a6?auto=format&fit=crop&w=400&q=80",
                  "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&q=80",
                ];

                // map known authors to fixed web avatars to ensure consistent loading
                const rawAvatars: Record<string, string> = {
                  "alex m":
                    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
                  "priya s":
                    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
                  "alex j":
                    "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&q=80",
                  "sam r":
                    "https://images.unsplash.com/photo-1531123414780-f0b5f9d9d0a6?auto=format&fit=crop&w=400&q=80",
                };

                const normalize = (s: string) =>
                  s
                    .toLowerCase()
                    .replace(/[^a-z0-9 ]/g, "")
                    .trim();

                // resolve avatar url for any testimonial
                let avatarUrl: string | null = null;

                const authorKey =
                  typeof t.author === "string" ? normalize(t.author) : "";
                // prefer explicit mapping for known authors
                if (authorKey && rawAvatars[authorKey]) {
                  avatarUrl = rawAvatars[authorKey];
                }

                // if not resolved, try t.avatar as string or object with url or id
                if (!avatarUrl && t && t.avatar) {
                  if (typeof t.avatar === "string") avatarUrl = t.avatar;
                  else if ((t.avatar as any).url)
                    avatarUrl = (t.avatar as any).url;
                  else if ((t.avatar as any).id)
                    avatarUrl = `/api/assets/${(t.avatar as any).id}`;
                }

                if (!avatarUrl) avatarUrl = fallbacks[idx % fallbacks.length];

                // ensure the avatar URL uses https and add small query parameters to help CDN
                if (
                  avatarUrl &&
                  avatarUrl.startsWith("https://images.unsplash.com") &&
                  avatarUrl.indexOf("auto=format") === -1
                ) {
                  avatarUrl = avatarUrl + "?auto=format&fit=crop&w=400&q=80";
                }

                // ensure full url (avoid relative API asset issues) - leave as-is otherwise

                return (
                  <motion.article
                    key={t.id}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.45 },
                      },
                    }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 220, damping: 18 }}
                    className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-indigo-900/30 to-purple-900/20 p-6 overflow-hidden glass-card"
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <Quote className="h-6 w-6 text-primary/80" />
                        <p className="mt-3 text-foreground/90 text-sm leading-relaxed">
                          {t.quote}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-6">
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {t.author}
                          </div>
                          <div className="text-xs text-foreground/80">
                            {t.role}
                          </div>
                        </div>
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={`${t.author} avatar`}
                            className="h-12 w-12 rounded-full object-cover border-2 border-white/10"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).onerror =
                                null;
                              (e.currentTarget as HTMLImageElement).src =
                                fallbacks[idx % fallbacks.length];
                            }}
                          />
                        ) : null}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
          </motion.div>
        </div>
      </Section>

      {/* News */}
      <Section
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16"
        delay={0.3}
      >
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            Latest News
          </h2>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsItems.map((n: any, idx: number) => {
            const builderFallback =
              "https://cdn.builder.io/api/v1/image/assets%2Fee358a6e64744467b38bd6a3468eaeb9%2F9aebb7e90f334acbb611405deeab415d?format=webp&width=1200&q=80";
            const q4Href =
              "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.livemint.com%2Fcompanies%2Fcompany-results%2Fq4-results-today-dmart-kotak-mahindra-idbi-bank-to-zen-tech-18-companies-to-declare-q4-results-2024-on-may-4-11714789780675.html&psig=AOvVaw0LKKs-2BIXMeJGos_tsuWA&ust=1759060848156000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCMCa3Mby-I8DFQAAAAAdAAAAABAL";
            const isQ4 = n?.title?.toLowerCase().includes("q4 highlights");
            const baseImage = n?.imageUrl ?? n?.image;
            const src =
              typeof baseImage === "string" && baseImage
                ? baseImage
                : baseImage?.id
                  ? `/api/assets/${baseImage.id}`
                  : isQ4
                    ? builderFallback
                    : "/placeholder.svg";

            const imgEl = (
              <img
                src={src}
                alt=""
                className="h-40 w-full object-cover border-b border-primary/10"
                loading={idx === 0 ? "eager" : "lazy"}
                decoding={idx === 0 ? "sync" : "async"}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).onerror = null;
                  (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            );

            const readMoreUrl = n?.link ?? (isQ4 ? q4Href : null);
            const metaBits: string[] = [];
            if (n?.source) metaBits.push(n.source);
            if (n?.publishedAt) {
              const published = new Date(n.publishedAt);
              if (!Number.isNaN(published.getTime())) {
                metaBits.push(
                  published.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }),
                );
              }
            }

            return (
              <article
                key={n.id}
                className="rounded-2xl border border-primary/20 bg-transparent overflow-hidden glass-card"
              >
                {readMoreUrl ? (
                  <a href={readMoreUrl} target="_blank" rel="noopener noreferrer">
                    {imgEl}
                  </a>
                ) : (
                  imgEl
                )}
                <div className="p-6">
                  <h3 className="font-semibold text-foreground">{n.title}</h3>
                  {metaBits.length ? (
                    <p className="mt-1 text-xs uppercase tracking-wide text-foreground/70">
                      {metaBits.join(" • ")}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm text-foreground/90">{n.excerpt}</p>
                  {readMoreUrl ? (
                    <a
                      href={readMoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-sm font-semibold text-foreground/90 hover:text-foreground"
                    >
                      Read more →
                    </a>
                  ) : (
                    <button className="mt-4 text-sm font-semibold text-foreground/90 hover:text-foreground">
                      Read more →
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
