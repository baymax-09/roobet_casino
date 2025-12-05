local k = import 'lib/kube.libsonnet';
local cluster = std.extVar('cluster');

local all = {

  local name = 'redeployer',
  local namespace = 'default',

  cronjob: k.CronJob(name, namespace) {
    apiVersion: if std.parseJson(cluster.min_master_version) >= 1.25 then 'batch/v1' else 'batch/v1beta1',
    spec+: {
      concurrencyPolicy: 'Forbid',
      failedJobsHistoryLimit: 1,
      jobTemplate+: {
        spec+: {
          template+: {
            spec+: {
              containers_:: {
                default: k.Container('redeployer') {
                  command: [
                    'bash',
                    '-c',
                    |||
                      kubectl get deployments \
                        --no-headers \
                        --output name \
                        --selector roobet.com/repo=backend \
                        | xargs -n1 kubectl rollout restart
                    |||,
                  ],
                  image: 'bitnami/kubectl:%s' % cluster.min_master_version,
                  name: 'redeploy',
                },
              },
              serviceAccount: 'redeployer',
            },
          },
        },
      },
      schedule: '0 13 * * 1,2,3,4,5',
    },
  },

  role: k.Role(name, namespace) {
    rules: [
      {
        apiGroups: ['apps'],
        resources: ['deployments'],
        verbs: ['get', 'list', 'patch', 'update', 'watch'],
      },
    ],
  },

  rolebinding: k.RoleBinding(name, namespace) {
    roleRef_:: $.role,
    subjects_:: [$.serviceaccount],
  },

  serviceaccount: k.ServiceAccount(name, namespace),

};

k.List() { items_:: all }
