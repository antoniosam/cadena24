export const COOKIE_OPTIONS_ACCESS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'strict' as const,
  maxAge: 15 * 60 * 1000, // 15 minutes in ms
  path: '/',
};

export const COOKIE_OPTIONS_REFRESH = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/api/auth',
};
