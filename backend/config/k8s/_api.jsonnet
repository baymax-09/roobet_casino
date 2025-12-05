local k = import './lib/kube.libsonnet';
local cluster = std.extVar('cluster');

local name = 'api-path';
local namespace = 'default';
local service = 'api';

local subdomains = [
  'api.%s' % domain
  for domain in cluster.domain
] + ['api.%(cluster)s.%(infra_zone)s' % cluster];

local all = {
  ingress: k.Ingress(name, namespace) {
    metadata+: {
      annotations+: {
        'nginx.ingress.kubernetes.io/auth-tls-error-page': 'https://%s' % cluster.domain[0],
        'nginx.ingress.kubernetes.io/auth-tls-secret': '%s/origin-auth-tls' % namespace,
        'nginx.ingress.kubernetes.io/auth-tls-verify-client': 'on',
        'nginx.ingress.kubernetes.io/auth-tls-verify-depth': '1',
        'nginx.ingress.kubernetes.io/proxy-buffer-size': '128k',
        'nginx.ingress.kubernetes.io/proxy-buffering': 'on',
        'nginx.ingress.kubernetes.io/rewrite-target': '/$2',
      },
    },
    spec+: {
      ingressClassName: 'nginx',
      rules: [
        {
          host: subdomain,
          http: {
            paths: [{
              path: '/_api(/|$)(.*)',
              pathType: 'Prefix',
              backend: { service: { name: service, port: { name: 'http' } } },
            }],
          },
        }
        for subdomain in subdomains
      ],

      tls: [
        {
          hosts: [
            subdomain
            for subdomain in subdomains
          ],
          secretName: 'api-tls',
        },
      ],
    },
  },
};

k.List() { items_:: all }
