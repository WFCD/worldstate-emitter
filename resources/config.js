export const worldstateUrl = process.env.WORLDSTATE_URL ?? 'https://api.warframe.com/cdn/worldState.php';
export const kuvaUrl = process.env.KUVA_URL ?? 'https://10o.io/arbitrations.json';
export const sentientUrl = process.env.SENTIENT_URL ?? 'https://semlar.com/anomaly.json';

export const worldstateCron = process.env.WORLDSTATE_CRON ?? '25 */5 * * * *';
export const externalCron = process.env.WS_EXTERNAL_CRON ?? '0 */10 * * * *';

export const FEATURES = process.env.WS_EMITTER_FEATURES
  ? process.env.WS_EMITTER_FEATURES.split(',')
  : ['rss', 'twitter', 'worldstate'];
