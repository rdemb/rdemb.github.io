/*
  D-LOGIC ATLAS — dane na zywo (live.js)
  ======================================
  Tylko DARMOWE, KEYLESS, CORS-OPEN zrodla (zweryfikowane realnymi requestami):
    * pogoda  -> Open-Meteo            (per wspolrzedne wezla, current + 13 dni)
    * kursy FX -> open.er-api.com       (USD base, wszystkie 17 walut surowcowych)
    * metale  -> api.gold-api.com       (zloto XAU / srebro XAG, spot live)
  Cache w sesji + timeouty + graceful fallback (null). To zasila „zawsze swieze".
  Surowce poza metalami i ENSO sa CORS-blokowane => uczciwie pomijane (patrz artykul).
*/
const cache = { fx: null, metals: null, weather: new Map() };

async function getJSON(url, ms = 8000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}

export const Live = {
  async fx() {
    if (cache.fx) return cache.fx;
    cache.fx = (async () => {
      const j = await getJSON('https://open.er-api.com/v6/latest/USD');
      if (!j || !j.rates) return null;
      return { base: 'USD', rates: j.rates, asOf: j.time_last_update_utc, next: j.time_next_update_utc, source: 'ExchangeRate-API' };
    })();
    return cache.fx;
  },

  async metals() {
    if (cache.metals) return cache.metals;
    cache.metals = (async () => {
      const [g, s] = await Promise.all([getJSON('https://api.gold-api.com/price/XAU'), getJSON('https://api.gold-api.com/price/XAG')]);
      if (!g && !s) return null;
      return { gold: g ? g.price : null, silver: s ? s.price : null, asOf: (g && g.updatedAt) || (s && s.updatedAt) || null, source: 'gold-api.com' };
    })();
    return cache.metals;
  },

  async weather(lat, lng) {
    const key = lat.toFixed(1) + ',' + lng.toFixed(1);
    if (cache.weather.has(key)) return cache.weather.get(key);
    const p = (async () => {
      const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&current=temperature_2m,precipitation,wind_speed_10m` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&past_days=10&forecast_days=3&timezone=auto`;
      const j = await getJSON(u);
      if (!j || !j.current) return null;
      const dp = (j.daily && j.daily.precipitation_sum) || [];
      const dmax = (j.daily && j.daily.temperature_2m_max) || [];
      const dmin = (j.daily && j.daily.temperature_2m_min) || [];
      const recentPrecip = dp.slice(0, 11).reduce((a, b) => a + (b || 0), 0);
      return {
        tempC: j.current.temperature_2m, precip: j.current.precipitation, wind: j.current.wind_speed_10m,
        recentPrecip: Math.round(recentPrecip * 10) / 10, dailyMax: dmax, dailyMin: dmin, dailyPrecip: dp,
        asOf: j.current.time, source: 'Open-Meteo',
      };
    })();
    cache.weather.set(key, p);
    return p;
  },
};

export default Live;
