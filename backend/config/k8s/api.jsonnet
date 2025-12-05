local backend = import './backend.libsonnet';
local k = import 'lib/kube.libsonnet';
local cluster = std.extVar('cluster');
local namespace = 'default';

local subdomains = [
  'api.%s' % domain
  for domain in cluster.domain
] + ['api.%(cluster)s.%(infra_zone)s' % cluster];

local api(suffix=null) = backend(std.join('-', std.prune(['api', suffix]))) {

  ports:: { http: { containerPort: 3003 } },

  deployment+:: {
    metadata+: {
      labels+: {
        service: 'api',
      },
    },
  },

  ingress: k.Ingress($.deployment.metadata.name, namespace) {
    metadata+: {
      annotations+: {
        'nginx.ingress.kubernetes.io/auth-tls-error-page': 'https://%s' % cluster.domain[0],
        'nginx.ingress.kubernetes.io/auth-tls-secret': '%s/origin-auth-tls' % namespace,
        'nginx.ingress.kubernetes.io/auth-tls-verify-client': 'on',
        'nginx.ingress.kubernetes.io/auth-tls-verify-depth': '1',
        'nginx.ingress.kubernetes.io/proxy-buffer-size': '128k',
        'nginx.ingress.kubernetes.io/proxy-buffering': 'on',
      },
    },
    spec+: {
      ingressClassName: 'nginx',
      rules: [
        rule {
          host: subdomain,
        }
        for subdomain in subdomains
        for rule in super.rules
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

  service: k.Service($.deployment.metadata.name, namespace) {
    target:: $.deployment,
  },

};

local all = {

  // FIXME: How do we address non duplicated resources?
  secrets: { list:: k.List() { items_:: {
    local this = self,

    // Reference only, store created in secretstores.jsonnet
    secretstore:: k.SecretStore(cluster.cluster, namespace) {
      provider:: 'gcp',
      projectID:: cluster.project,
    },

    tls: k.ExternalSecret('api-tls', namespace) {
      secretStoreRef:: this.secretstore,
      spec+: {
        refreshInterval: '1h',
        data_:: {
          'tls.key': '%s-CLOUDFLARE_ORIGIN_PRIVATE_KEY' % cluster.cluster,
          'tls.crt': '%s-CLOUDFLARE_ORIGIN_CERT' % cluster.cluster,
        },
      },
    },

    authtls: k.ExternalSecret('origin-auth-tls', namespace) {
      secretStoreRef:: this.secretstore,
      spec+: {
        refreshInterval: '1h',
        data_:: {
          'ca.crt': '%s-CLOUDFLARE_ORIGIN_CA' % cluster.cluster,
        },
      },
    },
  } } },

  default: api() {
    ingress+: {
      paths:: { '/': $.default.service.name_port },
    },
  },

  callbacks: api('callbacks') {
    ingress+: {
      paths:: {
        [path]: $.callbacks.service.name_port
        for path in [
          '/astropay/depositUpdate',
          '/astropay/withdrawUpdate',
          '/paymentiq',
          '/playngo/callback',
          '/pragmatic/callback',
          '/slotegrator/callback',
          '/softswiss/play',
          '/totalProcessing/depositUpdate',
          '/totalProcessing/withdrawUpdate',
          '/fasttrack/callback',
        ]
      },
    },
  },

  graphql: api('graphql') {
    ingress+: {
      paths:: {
        [path]: $.graphql.service.name_port
        for path in [
          '/graphql',
          '/admin/graphql',
        ]
      },
    },
  },

  wss: api('wss') {
    ingress+: {
      metadata+: {
        annotations+: {
          'nginx.ingress.kubernetes.io/affinity': 'cookie',
          'nginx.ingress.kubernetes.io/proxy-read-timeout': '3600',
          'nginx.ingress.kubernetes.io/proxy-send-timeout': '3600',
          'nginx.ingress.kubernetes.io/session-cookie-change-on-failure': 'true',
          'nginx.ingress.kubernetes.io/session-cookie-path': '/socket.io',
          'nginx.ingress.kubernetes.io/ssl-redirect': 'false',
        },
      },
      paths:: { '/socket.io': $.wss.service.name_port },
    },
  },

};

[items.list for items in std.objectValues(all)]
