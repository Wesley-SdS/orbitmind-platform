export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function webSearch(query: string, count = 10): Promise<SearchResult[]> {
  // Try Google scraping first
  const googleResults = await searchGoogle(query, count);
  if (googleResults.length > 0) return googleResults;

  // Fallback: DuckDuckGo HTML scraping
  const ddgResults = await searchDuckDuckGo(query, count);
  return ddgResults;
}

async function searchGoogle(query: string, count: number): Promise<SearchResult[]> {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${count}&hl=pt-BR`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
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
  // Extract URLs from Google redirect links
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

  // If first pattern didn't work, try alternative patterns
  if (results.length === 0) {
    // Pattern 2: data-href or href with actual URLs
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
