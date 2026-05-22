import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('./pages/index/index.tsx'),
  
  route('/new'    , './pages/new/new.tsx'),
  route('/list'   , './pages/list/list.tsx'),
  route('/site'   , './pages/site/site.tsx'),
  route('/edit'   , './pages/edit/edit.tsx'),
  route('/support', './pages/support/support.tsx'),
  
  route('/admin'             , './pages/admin/index.tsx'),
  route('/admin/dashboard'   , './pages/admin/dashboard.tsx'),
  route('/admin/sites'       , './pages/admin/sites.tsx'),
  route('/admin/tags'        , './pages/admin/tags.tsx'),
  route('/admin/posts'       , './pages/admin/posts.tsx'),
  route('/admin/deny-ips'    , './pages/admin/deny-ips.tsx'),
  route('/admin/deny-domains', './pages/admin/deny-domains.tsx')
] satisfies RouteConfig;
