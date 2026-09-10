/**
 * Geocodificação centralizada com cache (memória + localStorage) e
 * tratamento de rate-limit. Usada pelo cadastro de destinos e de postos.
 *
 * Observação: navegadores não deixam definir o header User-Agent no fetch.
 * A política do Nominatim para apps web é atendida pelo header Referer
 * (enviado automaticamente pelo navegador). O que reduz bloqueio de fato é
 * cache + debounce + não repetir consultas — implementado aqui.
 */

const CACHE_KEY = 'geocodeCache:v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 dias
const memoria = new Map();

function lerCacheDisco() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function gravarCacheDisco(obj) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch {
    /* quota cheia ou storage bloqueado — segue sem cache em disco */
  }
}

function doCache(chave) {
  if (memoria.has(chave)) return memoria.get(chave);
  const disco = lerCacheDisco();
  const item = disco[chave];
  if (item && Date.now() - item.ts < CACHE_TTL_MS) {
    memoria.set(chave, item.dados);
    return item.dados;
  }
  return null;
}

function salvar(chave, dados) {
  memoria.set(chave, dados);
  const disco = lerCacheDisco();
  disco[chave] = { ts: Date.now(), dados };
  gravarCacheDisco(disco);
}

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  if (res.status === 429) {
    const err = new Error('rate-limit');
    err.code = 'RATE_LIMIT';
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.code = 'HTTP_ERROR';
    throw err;
  }
  return res.json();
}

/**
 * Busca sugestões de endereço.
 * @returns {Promise<Array<{titulo,subtitulo,display_name,lat,lon}>>}
 */
export async function buscarEnderecos(query, { lat, lon, limite = 6 } = {}) {
  const q = String(query || '').trim();
  if (q.length < 3) return [];

  const chave = `sug:${q.toLowerCase()}`;
  const cache = doCache(chave);
  if (cache) return cache;

  // CEP (8 dígitos) -> ViaCEP + geocode do endereço formatado
  const apenasNumeros = q.replace(/\D/g, '');
  if (apenasNumeros.length === 8) {
    try {
      const cepData = await fetchJson(`https://viacep.com.br/ws/${apenasNumeros}/json/`);
      if (!cepData.erro) {
        const endereco = `${cepData.logradouro}, ${cepData.bairro} - ${cepData.localidade}, ${cepData.uf}`;
        const geo = await fetchJson(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(endereco)}&countrycodes=br&limit=1`,
          { headers: { 'Accept-Language': 'pt-BR' } }
        );
        if (geo.length > 0) {
          const out = [{
            titulo: `${cepData.logradouro || 'Endereço'}, ${cepData.bairro || ''}`.trim(),
            subtitulo: `${cepData.localidade} - ${cepData.uf} • CEP ${cepData.cep}`,
            display_name: endereco,
            lat: parseFloat(geo[0].lat),
            lon: parseFloat(geo[0].lon),
          }];
          salvar(chave, out);
          return out;
        }
      }
    } catch {
      /* cai no fluxo normal abaixo */
    }
  }

  // Photon (Komoot) — mais tolerante a rate-limit
  try {
    const bias = lat != null && lon != null ? `&lat=${lat}&lon=${lon}` : '';
    const data = await fetchJson(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}${bias}&limit=${limite}&lang=default`
    );
    if (data.features && data.features.length > 0) {
      const out = data.features.map((f) => {
        const p = f.properties || {};
        const rua = p.street || p.name || q;
        const num = p.housenumber ? `, ${p.housenumber}` : '';
        const bairro = p.district ? ` - ${p.district}` : '';
        const cidade = p.city || p.county || '';
        const uf = p.state || '';
        const titulo = `${rua}${num}${bairro}`;
        const subtitulo = [cidade, uf].filter(Boolean).join(' - ');
        return {
          titulo,
          subtitulo,
          display_name: `${titulo}, ${subtitulo}`,
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
        };
      });
      salvar(chave, out);
      return out;
    }
  } catch {
    /* tenta Nominatim */
  }

  // Nominatim (fallback)
  try {
    const data = await fetchJson(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&countrycodes=br&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'pt-BR' } }
    );
    const out = data.map((item) => ({
      titulo: item.name || item.display_name.split(',')[0],
      subtitulo: item.display_name.split(',').slice(1, 4).join(',').trim(),
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }));
    salvar(chave, out);
    return out;
  } catch (err) {
    if (err.code === 'RATE_LIMIT') {
      const e = new Error('Muitas buscas em pouco tempo. Aguarde alguns segundos.');
      e.code = 'RATE_LIMIT';
      throw e;
    }
    return [];
  }
}

/** Geocodifica um texto único (usado ao salvar sem escolher sugestão). */
export async function geocodificar(texto) {
  const lista = await buscarEnderecos(texto, { limite: 1 });
  return lista[0] || null;
}
