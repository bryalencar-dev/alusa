export function assertNonProd() {
  if (process.env.NODE_ENV === 'production') {
    const e = new Error('Forbidden in production');
  // @ts-expect-error adicionar status HTTP custom
    e.status = 403;
    throw e;
  }
}