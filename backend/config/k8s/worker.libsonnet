local backend = import './backend.libsonnet';
local k = import './lib/kube.libsonnet';
local namespace = 'default';

function(worker, name='w-%s' % std.asciiLower(worker), kind='deployment') backend(name, kind) {

  // Don't mount volumes on workers
  volumes:: {},
  volumeMounts:: {},

  container+:: {
    env_+:: { WORKER: worker },
  },

  workload+:: {
    metadata+: { labels+: { worker: worker } },
  },

  job:: k.Job(name, namespace) + $.workload {
    spec+: {
      template+: {
        spec+: {
          containers_+:: {
            default+: { env_+:: { ONESHOT: 'true' } },
          },
        },
      },
    },
  },

  list:: k.List() { items_:: $ },
}
