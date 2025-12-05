local k = import './lib/kube.libsonnet';
local cluster = std.extVar('cluster');

local name = 'rethinkdb';
local namespace = 'rethinkdb';

local rethinkdb_servers = {
  production: [
    '159.89.108.126',
    '161.35.17.191',
    '134.122.89.201',
  ],
  staging: [
    '10.255.132.18',
    '10.255.132.19',
    '10.255.132.20',
    '10.255.132.21',
    '10.255.132.22',
    '10.255.132.23',
    '10.255.132.24',
  ],
};

local rethinkdb_buckets = {
  production: {
    project: 'roobet-prod',
    s3: 'roobet-database-backups',
    gcs: 'rethinkdb-roobet-prod',
  },
  staging: {
    project: 'roobet-staging',
    s3: 'roobet-database-backups-staging',
    gcs: 'rethinkdb-roobet-staging',
  },
};

local all = {
  namespace: k.Namespace(namespace),

  // Reference only, store created in secretstores.jsonnet
  secretstore:: k.SecretStore(cluster.environment, namespace) {
    provider:: 'gcp',
    projectID:: cluster.project,
  },

  backupsecret: k.ExternalSecret('%s-backup' % name, namespace) {
    secretStoreRef:: $.secretstore,
    spec+: {
      refreshInterval: '1h',
      data_:: {
        AWS_ACCESS_KEY_ID: '%s-RETHINKDB_BACKUP_AWS_ACCESS_KEY_ID' % cluster.project_short,
        AWS_SECRET_ACCESS_KEY: '%s-RETHINKDB_BACKUP_AWS_SECRET_ACCESS_KEY' % cluster.project_short,
      },
    },
  },

  backupconfigmap: k.ConfigMap('%s-backup' % name, namespace) {
    data: {
      'backup.sh': importstr './snippets/rethinkdb-backup.sh',
    },
  },

  backupcronjob: k.CronJob('%s-backup' % name, namespace) {
    local this = self,
    dataPath:: '/data',
    apiVersion: if std.parseJson(cluster.min_master_version) >= 1.25 then 'batch/v1' else 'batch/v1beta1',
    metadata+: {
      labels+: {
        'tags.datadoghq.com/env': cluster.environment,
        'tags.datadoghq.com/service': this.metadata.labels.name,
      },
    },
    spec+: {
      concurrencyPolicy: 'Forbid',
      failedJobsHistoryLimit: 1,
      jobTemplate+: {
        metadata+: {
          annotations+: { 'cluster-autoscaler.kubernetes.io/safe-to-evict': 'false' },
          labels: this.metadata.labels,
        },
        spec+: {
          backoffLimit: 1,
          template+: {
            spec+: {
              containers_:: {
                default: k.Container(this.metadata.labels.name) {
                  command: [
                    '%(mountPath)s/backup.sh' % self.volumeMounts_.bin.mountPath,
                    rethinkdb_buckets[cluster.environment].s3,
                  ],
                  env_:: {
                    CLIENTS: '10',
                    DATADIR: this.dataPath,
                    RETHINKDB_HOST: 'rethinkdb-proxy',
                  },
                  envFrom: [{
                    secretRef: { name: $.backupsecret.metadata.name },
                  }],
                  image: 'eu.gcr.io/roobet-ops/rethinkdb-backup:latest',
                  imagePullPolicy: 'IfNotPresent',
                  resources: {
                    requests: { cpu: '100m', memory: '512Mi' },
                  },
                  volumeMounts_:: {
                    bin: { mountPath: '/opt/bin' },
                    data: { mountPath: this.dataPath },
                  },
                },
              },
              volumes_:: {
                bin: k.ConfigMapVolume($.backupconfigmap) {
                  configMap+: { defaultMode: 500 },
                },
                data: k.PVCVolume($.backuppvc),
              },
            },
          },
        },
      },
      schedule: '0 * * * *',
      startingDeadlineSeconds: 1800,
      successfulJobsHistoryLimit: 1,
      suspend: false,
    },
  },

  backupvpa: k.VPA('%s-backup' % name, namespace) {
    metadata+: { labels+: $.backupcronjob.metadata.labels },
    target:: $.backupcronjob,
    spec+: {
      updatePolicy+: { updateMode: 'Initial' },
    },
  },

  backuppvc: k.PersistentVolumeClaim('%s-backup' % name, namespace) {
    storageClass:: 'standard',
    storage:: '100Gi',
    spec+: { accessModes: ['ReadWriteOnce'] },
  },

  etlsecret: k.ExternalSecret('%s-etl' % name, namespace) {
    secretStoreRef:: $.secretstore,
    spec+: {
      refreshInterval: '1h',
      data_:: {
        'gsa.json': '%s-RETHINKDB_ETL_BQ_ACCESS' % cluster.project_short,
      },
    },
  },

  etlconfigmap: k.ConfigMap('%s-etl' % name, namespace) {
    data: {
      'load.sh': importstr './snippets/rethinkdb-load.sh',
    },
  },

  etldeployment: k.Deployment('%s-etl' % name, namespace) {
    local this = self,
    credsPath:: '/etc/google',
    tmpPath:: '/tmp',
    metadata+: {
      annotations+: { 'reloader.stakater.com/auto': 'true' },
      labels+: {
        'tags.datadoghq.com/env': cluster.environment,
        'tags.datadoghq.com/service': this.metadata.labels.name,
      },
    },
    spec+: {
      progressDeadlineSeconds: 600,
      replicas: 1,
      revisionHistoryLimit: 10,
      strategy: { type: 'Recreate' },
      template+: {
        metadata+: {
          annotations+: { 'cluster-autoscaler.kubernetes.io/safe-to-evict': 'true' },
          labels: this.metadata.labels,
        },
        spec+: {
          containers_:: {
            default: k.Container(this.metadata.labels.name) {
              command: [
                '%(mountPath)s/load.sh' % self.volumeMounts_.bin.mountPath,
                rethinkdb_buckets[cluster.environment].project,
                rethinkdb_buckets[cluster.environment].gcs,
              ],
              env_:: {
                GOOGLE_APPLICATION_CREDENTIALS: '%s/gsa.json' % this.credsPath,
                RETHINKDB_HOST: 'rethinkdb-proxy',
              },
              image: 'eu.gcr.io/roobet-ops/rethinkdb-etl:latest',
              imagePullPolicy: 'IfNotPresent',
              resources: {
                requests: { cpu: '100m', memory: '512Mi' },
              },
              volumeMounts_:: {
                bin: { mountPath: '/opt/bin' },
                creds: { mountPath: this.credsPath },
                tmp: { mountPath: this.tmpPath },
              },
            },
          },
          volumes_:: {
            bin: k.ConfigMapVolume($.etlconfigmap) {
              configMap+: { defaultMode: 500 },
            },
            creds: k.SecretVolume($.etlsecret) {
              secret+: { defaultMode: 420 },
            },
            tmp: k.PVCVolume($.etlpvc),
          },
          restartPolicy: 'Always',
          terminationGracePeriodSeconds: 30,
        },
      },
    },
  },

  etlvpa: k.VPA('%s-etl' % name, namespace) {
    metadata+: { labels+: $.etldeployment.metadata.labels },
    target:: $.etldeployment,
    spec+: {
      updatePolicy+: { updateMode: 'Initial' },
    },
  },

  etlpvc: k.PersistentVolumeClaim('%s-etl' % name, namespace) {
    storageClass:: 'standard',
    storage:: '100Gi',
    spec+: { accessModes: ['ReadWriteOnce'] },
  },

  proxystatefulset: k.StatefulSet('%s-proxy' % name, namespace) {
    local this = self,
    metadata+: {
      annotations+: { 'reloader.stakater.com/auto': 'true' },
      labels+: {
        'tags.datadoghq.com/env': cluster.environment,
        'tags.datadoghq.com/service': this.metadata.labels.name,
      },
    },
    spec+: {
      replicas: 3,
      template+: {
        metadata+: {
          annotations+: { 'cluster-autoscaler.kubernetes.io/safe-to-evict': 'true' },
          labels: this.metadata.labels,
        },
        spec+: {
          containers_:: {
            default: k.Container(this.metadata.labels.name) {
              local server_join = std.flattenArrays([
                ['--join', ip]
                for ip in rethinkdb_servers[cluster.environment]
              ]),
              command: [
                'rethinkdb',
                'proxy',
                '--bind',
                'all',
              ] + server_join,
              image: 'rethinkdb:2.4.2',
              imagePullPolicy: 'IfNotPresent',
              lifecycle: {
                preStop: {
                  exec: {
                    command: ['sh', '-c', 'kill -INT 1 && sleep 30'],
                  },
                },
              },
              livenessProbe: {
                failureThreshold: 5,
                periodSeconds: 10,
                successThreshold: 1,
                tcpSocket: {
                  port: 28015,
                },
                timeoutSeconds: 10,
              },
              ports_:: {
                cluster: { containerPort: 29015 },
                driver: { containerPort: 28015 },
              },
              readinessProbe: {
                failureThreshold: 3,
                httpGet: {
                  path: '/',
                  port: 8080,
                  scheme: 'HTTP',
                },
                periodSeconds: 1,
                successThreshold: 1,
                timeoutSeconds: 1,
              },
              resources: {
                requests: { cpu: '100m', memory: '512Mi' },
              },
            },
          },
          restartPolicy: 'Always',
          terminationGracePeriodSeconds: 30,
        },
      },
    },
  },

  proxypdb: k.PDB(name, namespace) {
    target:: $.proxystatefulset,
    spec+: { maxUnavailable: 1 },
  },

  proxyservice: k.Service('%s-proxy' % name, namespace) {
    target:: $.proxystatefulset,
    spec+: {
      ports: [
        { name: 'driver', port: 28015, targetPort: 'driver' },
      ],
    },
  },

  proxyvpa: k.VPA('%s-proxy' % name, namespace) {
    metadata+: { labels+: $.proxystatefulset.metadata.labels },
    target:: $.proxystatefulset,
    spec+: {
      updatePolicy+: { updateMode: 'Initial' },
    },
  },
};

k.List() { items_:: all }
