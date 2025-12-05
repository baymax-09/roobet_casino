local k = import './lib/kube.libsonnet';
local cluster = std.extVar('cluster');

local namespace = 'default';

local secret_values = {
  production: import './snippets/secrets-api.production.jsonnet',
  staging: import './snippets/secrets-api.staging.jsonnet',
};

local all = {
  environment_secretstore:: k.SecretStore(cluster.environment, namespace) {
    provider:: 'gcp',
    projectID:: cluster.project,
  },

  api: k.ExternalSecret('api', namespace) {
    secretStoreRef:: $.environment_secretstore,
    spec+: {
      refreshInterval: '1h',
      data_:: secret_values[cluster.environment],
    },
  },
};
k.List() { items_:: all }
