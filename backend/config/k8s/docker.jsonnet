local k = import './lib/kube.libsonnet';
local all = {

  name:: 'docker',
  namespace:: 'default',

  // Reference only, store created in secretstores.jsonnet
  secretstore:: k.SecretStore('global', $.namespace) {
    provider:: 'gcp',
    projectID:: 'roobet-ops',
  },

  secret: k.ExternalSecret($.name, $.namespace) {
    secretStoreRef:: $.secretstore,
    spec+: {
      refreshInterval: '1h',
      target+: {
        template+: { type: 'kubernetes.io/dockerconfigjson' },
      },
      data_:: {
        '.dockerconfigjson': 'DOCKER_CONFIG',
      },
    },
  },
};

k.List() { items_:: all }
