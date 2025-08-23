export function assertTestRoutesEnabled() {
  if (process.env.NODE_ENV === 'production' || process.env.TEST_ROUTES_ENABLED !== 'true') {
    const e = new Error('Test routes disabled');
    // @ts-expect-error status custom
    e.status = 403;
    throw e;
  }
}