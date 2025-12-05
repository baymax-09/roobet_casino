local k = import './lib/kube.libsonnet';
local cluster = std.extVar('cluster');
local namespace = 'default';

function(name, kind='deployment') {

  // these are primarily here to allow convenient, top-level access to commonly
  // modified, nested fields
  // they are, of course, 100% optional

  env:: {
    DD_APPSEC_ENABLED: 'true',
    DD_LOGS_INJECTION: 'true',
    DD_PROFILING_ENABLED: 'true',
    DD_RUNTIME_METRICS_ENABLED: 'true',
    DD_SERVICE_MAPPING: 'redis:redis,ioredis:redis,mongodb:mongodb,mongoose:mongodb,mongodb-core:mongodb,amqplib:rabbitmq',
    DD_TRACE_REPORT_HOSTNAME: 'true',
  },
  envFrom:: [],
  image:: 'csgokingdom/atlanta-api:%(tag)s' % self,
  ports:: {},
  tag:: 'staging',
  volumes:: { ip2location: { persistentVolumeClaim: { claimName: 'ip2location' } } },
  volumeMounts:: {
    [if std.objectHas($.volumes, 'ip2location') then 'ip2location']: { mountPath: '/data' },
  },

  container:: k.Container(name) {
    env_+:: $.env,
    envFrom: [{ configMapRef: { name: 'api' } }, { secretRef: { name: 'api' } }] + $.envFrom,
    image: $.image,
    ports_:: $.ports,
    [if std.length($.volumes) > 0 then 'volumeMounts_']:: $.volumeMounts,
    [if std.length($.volumes) == 0 then 'volumeMounts']:: null,
  },

  podspec:: {
    containers_+:: { default+: $.container },
    imagePullSecrets: [{ name: 'docker' }],
    [if std.length($.volumes) > 0 then 'volumes_']+:: $.volumes,
    [if std.length($.volumes) == 0 then 'volumes']:: null,
  },

  workload:: {
    local this = self,
    metadata+: {
      labels: {
        kind: kind,
        name: name,
        'roobet.com/repo': 'backend',
        'tags.datadoghq.com/env': cluster.environment,
        'tags.datadoghq.com/service': name,
      },
    },
    spec+: {
      template+: {
        metadata+: {
          annotations: {
            ['ad.datadoghq.com/%s.checks' % name]: std.manifestJsonMinified({
              openmetrics: {
                init_config: {},
                instances: [
                  {
                    openmetrics_endpoint: 'http://%%host%%:3004/metrics',
                    metrics: ['.*'],
                    exclude_labels: ['endpoint'],
                    max_returned_metrics: 6000,
                    histogram_buckets_as_distributions: true,
                  },
                ],
              },
            }),
            'ad.datadoghq.com/tags': std.manifestJsonMinified({
              // 'git.commit.sha': 'foo',
              'git.repository_url': 'github.com/project-atl/backend',
            }),
          },
          labels: this.metadata.labels,
        },
        spec+: $.podspec,
      },
    },
  },

  cronjob:: k.CronJob(name, namespace) {
    apiVersion: 'batch/v1',
    spec+: {
      jobTemplate: $.job { apiVersion:: null, kind:: null, metadata:: $.job.metadata },
    },
  },

  deployment:: k.Deployment(name, namespace) + $.workload {
    metadata+: {
      annotations: { 'reloader.stakater.com/auto': 'true' },
    },
    spec+: {
      minReadySeconds: 10,
      selector: {
        matchLabels: {
          'workload.user.cattle.io/workloadselector': std.join('-', ['apps.%s' % kind, namespace, name]),
        },
      },
      strategy+: { rollingUpdate+: { maxUnavailable: 0 } },
      template+: {
        metadata+: {
          labels+: {
            'workload.user.cattle.io/workloadselector': 'apps.%s' % std.join('-', [kind, namespace, name]),
          },
        },
        spec+: {
          containers_+:: {
            default+: {
              livenessProbe: self.readinessProbe {
                failureThreshold: 5,
                initialDelaySeconds: 30,
              },
              readinessProbe: {
                failureThreshold: 3,
                httpGet: { path: '/health', port: 3004, scheme: 'HTTP' },
                periodSeconds: 3,
                timeoutSeconds: self.periodSeconds,
              },
            },
          },
        },
      },
    },
  },

  job:: k.Job(name, namespace) + $.workload {
    spec+: {
      template+: {
        spec+: {
          containers_+:: {
            default+: { env_+:: { ONESHOT: 'true' } + $.env },
          },
        },
      },
    },
  },

  controller: self[kind],

  vpa: k.VPA(name, namespace) {
    metadata+: { labels+: $.controller.metadata.labels },
    target:: $.controller,
    spec+: {
      updatePolicy+: { updateMode: 'Initial' },
    },
  },

  list:: k.List() { items_:: $ },
}
