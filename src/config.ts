const config = {
  // basename: only at build time to set, and Don't add '/' at end off BASENAME for breadcrumbs, also Don't put only '/' use blank('') instead,
  // like '/berry-material-react/react/default'
  basename: '/',
  defaultPath: '/dashboard/default',
  fontFamily: `'Roboto', sans-serif`,
  borderRadius: 12
};
// @ts-ignore
const isProduction = import.meta.env.MODE === 'production';
export const port = isProduction ? 3111 : 3000;
console.log(`running in ${isProduction ? 'production' : 'development'} mode`);
export const API_BASE_URL = 'http://localhost:' + port + '/api';
export default config;
