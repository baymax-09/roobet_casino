local k = import './lib/kube.libsonnet';
local cluster = std.extVar('cluster');

local all = {
  name:: 'ip2location',
  namespace:: 'default',

  // Reference only, store created in secretstores.jsonnet
  secretstore:: k.SecretStore('global', $.namespace) {
    provider:: 'gcp',
    projectID:: 'roobet-ops',
  },

  ip2locationsecret: k.ExternalSecret($.name, $.namespace) {
    secretStoreRef:: $.secretstore,
    spec+: {
      refreshInterval: '1h',
      data_:: {
        TOKEN: 'IP2LOCATION_TOKEN',
      },
    },
  },

  configmap: k.ConfigMap($.name, $.namespace) {
    data: {
      'update.sh': |||
        #!/usr/bin/env ash
        set -euo pipefail

        apk update && apk add jq

        echo "Downloading ip2location paid databases" 1>&2
        for file in PX2BIN DB3BINIPV6; do
          wget -O ${file}.zip "${BASEURL}?token=${TOKEN}&file=${file}"
        done

        echo "Downloading ip2location iso3166 free database" 1>&2
        wget -O ISO3166-2.zip "${ISO3166_2_URL}"

        echo "Comparing to previous checksums" 1>&2
        if sha256sum -c checksums.txt; then
          echo "No changes required, exiting..." 1>&2
          exit 0
        fi

        echo "Stashing new checksums" 1>&2
        sha256sum *.zip > checksums.txt

        echo "Extracting updated db files" 1>&2
        unzip -p ISO3166-2.zip IP2LOCATION-ISO3166-2.CSV > iso3166-2.csv.new
        unzip -p DB3BINIPV6.zip IPV6-COUNTRY-REGION-CITY.BIN > ipGeo.bin.new
        unzip -p PX2BIN.zip IP2PROXY-IP-PROXYTYPE-COUNTRY.BIN > ipProxy.bin.new
        rm -f *.zip

        mv ipGeo.bin.new ipGeo.bin
        mv ipProxy.bin.new ipProxy.bin
        mv iso3166-2.csv.new iso3166-2.csv

        echo "Rolling api deployments" 1>&2
        kubectl rollout restart deployment -l service=api
      |||,
    },
  },

  cronjob: k.CronJob($.name, $.namespace) {
    apiVersion: 'batch/v1',
    spec+: {
      failedJobsHistoryLimit: 1,
      jobTemplate+: {
        spec+: {
          backoffLimit: 1,
          template+: {
            spec+: {
              containers_:: {
                default: k.Container($.name) {
                  command: [
                    '%(mountPath)s/update.sh' % self.volumeMounts_.script.mountPath,
                  ],
                  env_+:: {
                    BASEURL: 'https://www.ip2location.com/download',
                    ISO3166_2_URL: 'https://www.ip2location.com/downloads/ip2location-iso3166-2.zip',
                  },
                  envFrom: [{
                    secretRef: { name: $.ip2locationsecret.metadata.name },
                  }],
                  image: 'alpine',
                  volumeMounts_:: {
                    data: { mountPath: '/data' },
                    kubectl: { mountPath: '/usr/local/bin' },
                    script: { mountPath: '/opt/bin' },
                  },
                  workingDir: self.volumeMounts_.data.mountPath,
                },
              },
              initContainers_:: {
                kubectl: k.Container('kubectl') {
                  command: [
                    'cp',
                    '/opt/bitnami/kubectl/bin/kubectl',
                    '%(mountPath)s/kubectl' % self.volumeMounts_.kubectl,
                  ],
                  image: 'bitnami/kubectl:%s' % cluster.min_master_version,
                  volumeMounts_:: {
                    kubectl: { mountPath: '/opt/bin' },
                  },
                },
              },
              serviceAccount: $.serviceaccount.metadata.name,
              volumes_:: {
                data: k.PVCVolume($.pvc),
                kubectl: k.EmptyDirVolume(),
                script: k.ConfigMapVolume($.configmap) {
                  configMap+: { defaultMode: 500 },
                },
              },
            },
          },
        },
      },
      schedule: '@daily',
      successfulJobsHistoryLimit: 1,
      suspend: false,
    },
  },

  pvc: k.PersistentVolumeClaim($.name, $.namespace) {
    storageClass:: 'filestore-standard',
    storage:: '1Gi',
    spec+: { accessModes: ['ReadWriteMany'] },
  },

  role: k.Role($.name, namespace=$.namespace) {
    rules: [
      {
        apiGroups: ['snapshot.storage.k8s.io'],
        resources: ['volumesnapshots'],
        verbs: ['create', 'delete', 'get', 'list', 'watch'],
      },
      {
        apiGroups: ['apps'],
        resources: ['deployments'],
        verbs: ['get', 'list', 'patch', 'update', 'watch'],
      },
      {
        apiGroups: [''],
        resources: ['persistentvolumeclaims'],
        verbs: ['create', 'delete', 'get', 'list', 'watch'],
      },
    ],
  },

  rolebinding: k.RoleBinding($.name, $.namespace) {
    roleRef_:: $.role,
    subjects_:: [$.serviceaccount],
  },

  serviceaccount: k.ServiceAccount($.name, $.namespace),
};

// Don't deploy to the "production" cluster, this only works on GKE
k.List() { items_:: if cluster.cluster != 'production' then all else {} }
