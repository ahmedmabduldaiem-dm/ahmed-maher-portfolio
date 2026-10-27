export function endpointAllowed(value) {
  try { const u = new URL(value); return u.origin === 'https://formspree.io' && /^\/f\/[A-Za-z0-9]+$/.test(u.pathname) && !u.search && !u.hash && !u.username && !u.password; }
  catch { return false; }
}
export function canSubmit(config, origin = '') {
  const localTest = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:[0-9]+)?$/.test(origin);
  const explicitStaging = (config.allowedTestOrigins || []).includes(origin);
  return Boolean(config.enabled && config.privacyApproved && endpointAllowed(config.endpoint) &&
    (config.deliveryVerified || (config.testMode === true && (localTest || explicitStaging))));
}
export function createDelivery(config, fetcher = fetch, origin = '') {
  let pending = false;
  return async function send(values) {
    if (pending) return { state: 'busy' };
    if (!canSubmit(config, origin)) return { state: 'inactive' };
    if (values._gotcha) return { state: 'error' }; // No fake success for blocked spam.
    pending = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetcher(config.endpoint, {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(values), signal: controller.signal
      });
      if (!response.ok) return { state: 'error' };
      return { state: 'accepted' };
    } catch { return { state: 'error' }; }
    finally { clearTimeout(timeout); pending = false; }
  };
}
