import { PROXY_URL } from '../resources/config.js';

const isCI = process.env.CI === 'true';
const ciTimeout = process.env.CI_TIMEOUT ? parseInt(process.env.CI_TIMEOUT, 10) : 60000;
const localTimeout = process.env.LOCAL_TIMEOUT ? parseInt(process.env.LOCAL_TIMEOUT, 10) : 12000000;

export default async (
  url,
  { session = 'parser-session', contentType = 'application/json' } = {
    session: 'parser-session',
    contentType: 'application/json',
  }
) => {
  if (PROXY_URL) {
    const res = await fetch(`${PROXY_URL}/v1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cmd: 'request.get',
        url,
        session,
        maxTimeout: isCI ? ciTimeout : localTimeout,
        returnOnlyCookies: false,
        returnPageContent: true,
      }),
    });
    const text = await res.text();
    const { solution } = JSON.parse(text);
    if (!solution?.response) {
      throw solution;
    }
    if (contentType === 'application/json') {
      return {
        ok: solution.responseCode === 200,
        status: solution.responseCode,
        json: async () => {
          try {
            return JSON.parse(solution.response);
          } catch (error) {
            return {};
          }
        },
      };
    }
    if (contentType === 'text/html') {
      return {
        ok: solution.responseCode === 200,
        status: solution.responseCode,
        text: async () => solution.response.replace(/<\/?[^>]+(>|$)/g, ''),
      };
    }
    return solution.response;
  }
  return fetch(url);
};
