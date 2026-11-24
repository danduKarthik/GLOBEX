// TEST ONLY — simulates Wikimedia refusing this server with HTTP 429.
const realFetch = globalThis.fetch;
let count = 0;
globalThis.fetch = async (url, opts) => {
  const u = new URL(String(url));
  if (/wiki(voyage|pedia)\.org$/.test(u.hostname)) { count++; return new Response('Too many requests', { status: 429, headers: { 'retry-after': '1' } }); }
  return realFetch(url, opts);
};
process.on('exit', () => console.log(`[test] server wikimedia calls refused: ${count}`));
console.log('[test] server is rate-limited (429) by Wikimedia');
