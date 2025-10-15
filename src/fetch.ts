import type { FetchResult } from "./types";

/**
 * Fetch HTML from a URL
 */
export async function fetchFromURL(url: string): Promise<FetchResult> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    return {
      html,
      source: url,
    };
  } catch (error) {
    throw new Error(`Failed to fetch ${url}: ${error}`);
  }
}

/**
 * Read HTML from a local file
 */
export async function fetchFromFile(filePath: string): Promise<FetchResult> {
  try {
    const file = Bun.file(filePath);
    const html = await file.text();
    return {
      html,
      source: filePath,
    };
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error}`);
  }
}

/**
 * Fetch HTML from either URL or file path
 */
export async function fetchHTML(
  source: string,
  isFile: boolean = false
): Promise<FetchResult> {
  if (isFile) {
    return fetchFromFile(source);
  }
  return fetchFromURL(source);
}
