export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const SEARCH_TIMEOUT_MS = 8000;

export async function webSearch(query: string, count = 10): Promise<SearchResult[]> {
  // Try Google scraping first (with timeout)
  const googleResults = await withTimeout(searchGoogle(query, count), SEARCH_TIMEOUT_MS);
  if (googleResults.length > 0) return googleResults;

  // Fallback 1: DuckDuckGo HTML scraping
  const ddgResults = await withTimeout(searchDuckDuckGo(query, count), SEARCH_TIMEOUT_MS);
  if (ddgResults.length > 0) return ddgResults;

  // Fallback 2: DuckDuckGo lite (simpler HTML, less likely to be blocked)
  const liteResults = await withTimeout(searchDuckDuckGoLite(query, count), SEARCH_TIMEOUT_MS);
  return liteResults;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T extends unknown[] ? T : T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const result = await promise;
    return result as T extends unknown[] ? T : T;
  } catch {
    return [] as unknown as T extends unknown[] ? T : T;
  } finally {
    clearTimeout(timer);
  }
}

async function searchGoogle(query: string, count: number): Promise<SearchResult[]> {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${count}&hl=pt-BR`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const html = await res.text();
    return extractGoogleResults(html, count);
  } catch {
    return [];
  }
}

function extractGoogleResults(html: string, count: number): SearchResult[] {
  const results: SearchResult[] = [];

  // Pattern: <a href="/url?q=REAL_URL&..."><h3>TITLE</h3></a>
  const linkPattern =
    /<a[^>]+href="\/url\?q=([^&"]+)[^"]*"[^>]*>.*?<h3[^>]*>(.*?)<\/h3>/gs;
  for (const match of html.matchAll(linkPattern)) {
    if (results.length >= count) break;
    const url = decodeURIComponent(match[1]!);
    const title = match[2]!.replace(/<[^>]+>/g, "").trim();
    if (url.startsWith("http") && !url.includes("google.com")) {
      results.push({ title, url, snippet: "" });
    }
  }

  // Alternative pattern if first didn't work
  if (results.length === 0) {
    const altPattern =
      /href="(https?:\/\/(?!www\.google)[^"]+)"[^>]*>.*?<h3[^>]*>(.*?)<\/h3>/gs;
    for (const match of html.matchAll(altPattern)) {
      if (results.length >= count) break;
      const url = match[1]!;
      const title = match[2]!.replace(/<[^>]+>/g, "").trim();
      results.push({ title, url, snippet: "" });
    }
  }

  // Try to extract snippets
  const snippetPattern =
    /<div[^>]+class="[^"]*VwiC3b[^"]*"[^>]*>(.*?)<\/div>/gs;
  let i = 0;
  for (const match of html.matchAll(snippetPattern)) {
    if (i >= results.length) break;
    results[i]!.snippet = match[1]!
      .replace(/<[^>]+>/g, "")
      .replace(/&[^;]+;/g, " ")
      .trim()
      .substring(0, 300);
    i++;
  }

  return results;
}

async function searchDuckDuckGo(
  query: string,
  count: number,
): Promise<SearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const html = await res.text();

    const results: SearchResult[] = [];
    const pattern =
      /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>.*?<a[^>]+class="result__snippet"[^>]*>(.*?)<\/a>/gs;
    for (const match of html.matchAll(pattern)) {
      if (results.length >= count) break;
      results.push({
        url: match[1]!,
        title: match[2]!.replace(/<[^>]+>/g, "").trim(),
        snippet: match[3]!
          .replace(/<[^>]+>/g, "")
          .trim()
          .substring(0, 300),
      });
    }
    return results;
  } catch {
    return [];
  }
}

async function searchDuckDuckGoLite(
  query: string,
  count: number,
): Promise<SearchResult[]> {
  try {
    const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const html = await res.text();

    const results: SearchResult[] = [];
    // Lite version has simpler HTML: <a rel="nofollow" href="URL" class="result-link">TITLE</a>
    const pattern = /<a[^>]+class="result-link"[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gs;
    for (const match of html.matchAll(pattern)) {
      if (results.length >= count) break;
      const href = match[1]!;
      if (href.startsWith("http")) {
        results.push({
          url: href,
          title: match[2]!.replace(/<[^>]+>/g, "").trim(),
          snippet: "",
        });
      }
    }

    // Try to get snippets from <td> elements following links
    const snippetPattern = /<td[^>]+class="result-snippet"[^>]*>(.*?)<\/td>/gs;
    let i = 0;
    for (const match of html.matchAll(snippetPattern)) {
      if (i >= results.length) break;
      results[i]!.snippet = match[1]!.replace(/<[^>]+>/g, "").trim().substring(0, 300);
      i++;
    }

    return results;
  } catch {
    return [];
  }
}
