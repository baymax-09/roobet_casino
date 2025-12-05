local k = import './lib/kube.libsonnet';
local cluster = std.extVar('cluster');

// secret store naming format: <namespace>_<type>
local all = {
  default_global: k.SecretStore('global', 'default') {
    provider:: 'gcp',
    projectID:: 'roobet-ops',
  },
  default_cluster: k.SecretStore(cluster.cluster, 'default') {
    provider:: 'gcp',
    projectID:: cluster.project,
  },
  default_environment: k.SecretStore(cluster.environment, 'default') {
    provider:: 'gcp',
    projectID:: cluster.project,
  },
  rethinkdb_environment: k.SecretStore(cluster.environment, 'rethinkdb') {
    provider:: 'gcp',
    projectID:: cluster.project,
  },
};

k.List() { items_:: all }
