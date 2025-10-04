/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export interface LatestNewsItem {
  id: string;
  title: string;
  excerpt: string;
  link: string | null;
  image?: unknown;
  imageUrl?: string | null;
  source?: string | null;
  publishedAt?: string | Date | null;
  fetchedAt?: string | Date | null;
}
