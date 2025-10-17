export const WORLDSTATE_URL = process.env.WORLDSTATE_URL ?? 'https://api.warframe.com/cdn/worldState.php';
export const KUVA_URL = process.env.KUVA_URL ?? 'https://10o.io/arbitrations.json';
export const SENTIENT_URL = process.env.SENTIENT_URL ?? 'https://semlar.com/anomaly.json';

export const FEATURES = process.env.WS_EMITTER_FEATURES
  ? process.env.WS_EMITTER_FEATURES.split(',')
  : ['rss', 'twitter', 'worldstate'];
