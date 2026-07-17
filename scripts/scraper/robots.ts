import robotsParser from "robots-parser";

const cache = new Map<string, ReturnType<typeof robotsParser> | null>();

export async function isAllowedByRobots(
  targetUrl: string,
  userAgent: string,
): Promise<boolean> {
  const url = new URL(targetUrl);
  const robotsUrl = `${url.origin}/robots.txt`;

  if (!cache.has(robotsUrl)) {
    try {
      const response = await fetch(robotsUrl, {
        headers: { "user-agent": userAgent },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        console.warn(`Could not read ${robotsUrl}: HTTP ${response.status}`);
        cache.set(robotsUrl, null);
      } else {
        cache.set(robotsUrl, robotsParser(robotsUrl, await response.text()));
      }
    } catch (error) {
      console.warn(`Could not read ${robotsUrl}:`, error);
      cache.set(robotsUrl, null);
    }
  }

  const parser = cache.get(robotsUrl);
  if (!parser) return true;
  return parser.isAllowed(targetUrl, userAgent) !== false;
}
