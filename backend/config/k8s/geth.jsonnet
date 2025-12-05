local k = import 'lib/kube.libsonnet';
local cluster = std.extVar('cluster');

local ports_geth = {
  'eth-rpc-http': 8545,  // Ethereum JSON-RPC HTTP endpoint
  'admin-debug': 6060,  // Debug and administrative HTTP endpoint
  'eth-rpc-shh': 8551,  // Whisper (SHH) protocol RPC (note: Whisper has been deprecated in many versions)
  'eth-p2p': 30303,  // Ethereum mainnet P2P communication port (TCP)
  'eth-p2p-udp': 30303,  // Ethereum mainnet P2P communication port (UDP)
  'eth-rpc-ws': 8546,  // Ethereum JSON-RPC WebSocket endpoint
};


local ports_prysm = {
  'beacon-rpc': 4000,  // gRPC server for Beacon Node interactions
  'beacon-api': 8080,  // RESTful web API for the Beacon Node
  'beacon-grpc': 3500,  // gRPC port
  'beacon-p2p-tcp': 13000,  // TCP port for p2p communication of the Beacon Node
  'beacon-p2p-udp': 12000,  // UDP port for p2p discovery (Discovery v5 protocol)
};


local resources = {
  // Resources for the default instance
  gethCpuRequest: '2',  // Initially was set to 4. Adjusting for staging environment.
  gethMemoryRequest: '6Gi',  // Initially was set to 10Gi. Adjusting for staging environment.
  prysmCpuRequest: '1',  // Initially was set to 1419m. Adjusting for staging environment.
  prysmMemoryRequest: '3Gi',  // Initially was set to 8780737608 (approx 8.5Gi). Adjusting for staging environment.
};

local all = {
  name:: 'geth',
  name_geth:: 'geth',
  name_prysm:: 'prysm',
  namespace:: 'ethereum',
  replicas:: if cluster.environment == 'production' then 3 else 1,

  secretstore: k.SecretStore(cluster.environment, $.namespace) {
    provider:: 'gcp',
    projectID:: cluster.project,
  },

  geth_secret: k.ExternalSecret($.name, $.namespace) {
    secretStoreRef:: $.secretstore,
    spec+: {
      refreshInterval: '1h',
      data_:: {
        'jwt.hex': '%s-GETH_JWT' % cluster.environment,
      },
    },
  },

  statefulset: k.StatefulSet($.name_geth, $.namespace) {
    local this = self,
    metadata+: {
      name: $.name_geth,
      annotations+: {
        ['ad.datadoghq.com/' + $.name_geth + '.logs']: '[{"source": "' + $.name_geth + '","service": "' + $.name_geth + '","log_processing_rules": [{"type": "multi_line", "name": "new_log_start_with_date","pattern": "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}"  },  {"type": "parse_json"}]  }]',
        ['ad.datadoghq.com/' + $.name_prysm + '.logs']: '[  {"source": "' + $.name_prysm + '","service": "' + $.name_prysm + '","log_processing_rules": [  {"type": "multi_line", "name": "new_log_start_with_date", "pattern": "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}"  },  {"type": "parse_json"}]  }]',
      },
      labels+: {
        'tags.datadoghq.com/env': cluster.environment,
        'tags.datadoghq.com/service': $.name_geth,
      },
    },
    spec+: {
      replicas: $.replicas,
      template+: {
        metadata+: {
          labels: this.metadata.labels,
          annotations+: {
            //@formatter:off
            ['ad.datadoghq.com/%s.checks' % $.name_geth]: std.manifestJsonMinified({
              openmetrics: {
                init_config: {},
                instances: [
                  {
                    openmetrics_endpoint: 'http://%%host%%:6060/debug/metrics/prometheus',
                    metrics: ['.*'],
                    namespace: 'geth',
                    histogram_buckets_as_distributions: true,
                    collect_histogram_buckets: true,
                    collect_counters_with_distributions: true,
                  },
                ],
              },
            }),
            'ad.datadoghq.com/tags': std.manifestJsonMinified({
              'tags.datadoghq.com/env': cluster.environment,
              'tags.datadoghq.com/service': $.name_geth,
            }),
          },
        },
        spec+: {
          containers_:: {
            default: k.Container($.name) {
              command: ['/bin/sh', '-c'],
              args: [
                'PUBLIC_IP=$(cat /etc/shared-volume/lb-ip) &&  ' +
                'geth ' +
                '--authrpc.addr=0.0.0.0 ' +
                '--authrpc.jwtsecret=/etc/ethereum/jwt.hex ' +
                '--authrpc.vhosts=* ' +
                '--datadir=/data/execution ' +
                '--goerli ' +
                '--graphql ' +
                '--graphql.corsdomain=* ' +
                '--graphql.vhosts=* ' +
                '--http ' +
                '--http.addr=0.0.0.0 ' +
                '--http.api=debug,admin,engine,eth,net,txpool,web3 ' +
                '--http.corsdomain=* ' +
                '--http.vhosts=* ' +
                '--log.json ' +
                '--maxpeers=100 ' +
                '--metrics ' +
                '--metrics.addr=0.0.0.0 ' +
                '--metrics.expensive ' +
                '--metrics.port=6060 ' +
                '--rpc.evmtimeout=30s ' +
                '--ws ' +
                '--ws.addr=0.0.0.0 ' +
                '--ws.api=debug,admin,engine,eth,net,txpool,web3 ' +
                '--ws.origins=* ' +
                '--ws.rpcprefix=/ ' +
                '--gcmode=full ' +
                '--syncmode=snap ' +
                '--nat=extip:$PUBLIC_IP ' +
                '--discovery.port=35909',
              ],
              image: 'docker.io/ethereum/client-go:v1.11.5',
              imagePullPolicy: 'IfNotPresent',
              ports: [
                { name: 'eth-rpc-http', containerPort: ports_geth['eth-rpc-http'] },
                { name: 'admin-debug', containerPort: ports_geth['admin-debug'] },
                { name: 'eth-rpc-shh', containerPort: ports_geth['eth-rpc-shh'] },
                { name: 'eth-p2p', containerPort: ports_geth['eth-p2p'] },
                { name: 'eth-p2p-udp', containerPort: ports_geth['eth-p2p'], protocol: 'UDP' },
                { name: 'eth-rpc-ws', containerPort: ports_geth['eth-rpc-ws'] },
              ],
              volumeMounts_:: {
                data: { mountPath: '/data' },
                jwt: { mountPath: '/etc/ethereum' },
                'shared-volume': { mountPath: '/etc/shared-volume' },
              },
              resources: {
                requests: {
                  cpu: resources.gethCpuRequest,
                  memory: resources.gethMemoryRequest,
                },
              },
            },
            prysm: k.Container($.name_prysm) {
              image: 'gcr.io/prysmaticlabs/prysm/beacon-chain:v3.2.2',
              args: [
                '--accept-terms-of-use',
                '--block-batch-limit=128',
                '--checkpoint-sync-url=https://sync-goerli.beaconcha.in',
                '--datadir=/data/consensus',
                '--enable-debug-rpc-endpoints',
                '--eth1-header-req-limit=2000',
                '--execution-endpoint=http://127.0.0.1:8551',
                '--genesis-beacon-api-url=https://sync-goerli.beaconcha.in',
                '--grpc-gateway-host=0.0.0.0',
                '--grpc-max-msg-size=6568081',
                '--jwt-secret=/etc/ethereum/jwt.hex',
                '--log-file=/data/consensus/beacon.log',
                '--log-format=json',
                '--monitoring-host=0.0.0.0',
                '--monitoring-port=8080',
                '--p2p-host-ip=34.89.178.193',
                '--prater',
                '--rpc-host=0.0.0.0',
                '--verbosity=debug',
              ],
              ports: [
                { name: 'beacon-rpc', containerPort: ports_prysm['beacon-rpc'] },
                { name: 'beacon-api', containerPort: ports_prysm['beacon-api'] },
                { name: 'beacon-grpc', containerPort: ports_prysm['beacon-grpc'] },
                { name: 'beacon-p2p-tcp', containerPort: ports_prysm['beacon-p2p-tcp'] },
                { name: 'beacon-p2p-udp', containerPort: ports_prysm['beacon-p2p-udp'], protocol: 'UDP' },
              ],
              volumeMounts_:: {
                data: { mountPath: '/data' },
                jwt: { mountPath: '/etc/ethereum' },
              },
              resources: {
                requests: {
                  cpu: resources.prysmCpuRequest,
                  memory: resources.prysmMemoryRequest,
                },
              },
            },
          },
          initContainers: [
            {
              name: 'fetch-lb-ip',
              image: 'alpine:3.14',
              command: [
                '/bin/sh',
                '-c',
                |||
                  # Update APK repositories
                  apk update &&

                  # Install curl and ca-certificates
                  apk add --no-cache curl ca-certificates &&

                  # Set kubectl version
                  KUBECTL_VERSION=v1.21.0 &&

                  # Download kubectl for the specified version
                  curl -LO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" &&

                  # Make the downloaded kubectl binary executable
                  chmod +x kubectl &&

                  # Move the kubectl binary to the appropriate directory
                  mv kubectl /usr/local/bin/ &&

                  # Create a directory to store the load balancer IP
                  mkdir -p /etc/shared-volume &&

                  # Fetch the IP of the service 'geth-rpc' in the 'ethereum' namespace and store it in a file
                  kubectl -n ethereum get svc geth-rpc -o=jsonpath="{.status.loadBalancer.ingress[0].ip}" > /etc/shared-volume/lb-ip 
                |||,
              ],
              volumeMounts: [
                { name: 'shared-volume', mountPath: '/etc/shared-volume' },
              ],
            },
          ],
          restartPolicy: 'Always',
          terminationGracePeriodSeconds: 30,
          volumes_:: {
            jwt: k.SecretVolume($.geth_secret) {
              secret+: { defaultMode: 420 },
            },
            'shared-volume': {
              emptyDir: {
                sizeLimit: '1Gi',
              },
            },
          },
        },
      },
      updateStrategy: { type: 'OnDelete' },
      volumeClaimTemplates: [{
        metadata: { name: 'data' },
        spec: {
          accessModes: ['ReadWriteOnce'],
          resources: { requests: { storage: '1Ti' } },
        },
      }],
    },
  },
  vpa: {
    apiVersion: 'autoscaling.k8s.io/v1',
    kind: 'VerticalPodAutoscaler',
    metadata: {
      name: $.name_geth + '-vpa',
      namespace: $.namespace,
    },
    spec: {
      targetRef: {
        apiVersion: 'apps/v1',
        kind: 'StatefulSet',
        name: $.name_geth,
      },
      updatePolicy: {
        updateMode: 'Initial',
      },
    },
  },
  block_check_cron: {
    apiVersion: 'batch/v1',
    kind: 'CronJob',
    metadata+: {
      name: 'block-checker',
      namespace: $.namespace,
      labels: {
        app: 'block-checker',
      },
    },
    spec: {
      schedule: '*/10 * * * *',  // This is a comment in Jsonnet as well
      jobTemplate: {
        spec: {
          template: {
            metadata+: {
              labels: {
                app: 'block-checker',
                'tags.datadoghq.com/env': cluster.environment,
                'tags.datadoghq.com/service': 'block-checker',
              },
              annotations+: {
                'ad.datadoghq.com/block-checker.logs': '[{"source": "block-checker","service": "block-checker","log_processing_rules": [{"type": "multi_line",            "name": "new_log_start_with_date","pattern": "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}"},{"type": "parse_json"}]}]',
              },
            },
            spec: {
              containers: [{
                name: 'block-checker',
                image: 'alpine:latest',
                command: ['/bin/sh', '-c'],
                args: [|||
                  log_error() {
                    echo "{\"error\": \"$1\"}" >&2;
                    exit 1;
                  }

                  apk add --no-cache curl jq > /dev/null 2>&1 || log_error "Failed to install required packages"

                  # Fetch latest block from local Geth node
                  GETH_DATA=$(curl -s http://geth-rpc-internal:6060/debug/metrics/prometheus || log_error "Failed to fetch data from geth-rpc-internal")
                  NODE_BLOCK_1=$(echo "$GETH_DATA" | grep "chain_head_block" | grep -v 'TYPE' | awk '{print $2}' || log_error "Failed to parse block number from geth-rpc-internal")

                  # Fetch latest block from Goerli testnet via blockpi.network
                  LATEST_BLOCK=$(curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' https://goerli.blockpi.network/v1/rpc/public | jq -r .result | xargs printf "%d\n" || log_error "Failed to fetch latest block from blockpi.network")

                  # Compare and produce JSON logs for the Geth node
                  if [ $(($LATEST_BLOCK - $NODE_BLOCK_1)) -gt 5 ]; then
                      echo "{ \"node\": \"geth\", \"status\": \"behind\", \"blocks_behind\": $(($LATEST_BLOCK - $NODE_BLOCK_1)) }"
                  else
                      echo "{ \"node\": \"geth\", \"status\": \"in sync\" }"
                  fi

                  exit 0
                |||],
              }],
              restartPolicy: 'OnFailure',
            },
          },
        },
      },
    },
  },
  geth_service: k.Service($.name_geth, $.namespace) {
    target: all.statefulset,
    metadata+: {
      labels+: {
        app: $.name_geth,
        name: $.name_geth,
      },
    },
    spec+: {
      selector: {
        app: $.name_geth,
        name: $.name_geth,
      },
      type: 'ClusterIP',
      ipFamilyPolicy: 'SingleStack',
      ports: [
        { name: 'eth-rpc-http', port: ports_geth['eth-rpc-http'] },
        { name: 'admin-debug', port: ports_geth['admin-debug'] },
        { name: 'eth-rpc-shh', port: ports_geth['eth-rpc-shh'] },
        { name: 'eth-p2p', port: ports_geth['eth-p2p'], targetPort: 30303 },
        { name: 'eth-p2p-udp', port: ports_geth['eth-p2p'], protocol: 'UDP', targetPort: 30303 },
        { name: 'eth-rpc-ws', port: ports_geth['eth-rpc-ws'] },
      ],
    },
  },

  geth_headless_service: k.Service('geth-headless', $.namespace) {
    target: all.statefulset,
    metadata+: {
      labels+: {
        app: 'geth-headless',
        name: 'geth-headless',
      },
    },
    spec+: {
      clusterIP: 'None',
      type: 'ClusterIP',
      ports: [
        { name: 'eth-rpc-http', port: ports_geth['eth-rpc-http'] },
        { name: 'admin-debug', port: ports_geth['admin-debug'] },
        { name: 'eth-rpc-shh', port: ports_geth['eth-rpc-shh'] },
        { name: 'eth-p2p', port: ports_geth['eth-p2p'] },
        { name: 'eth-p2p-udp', port: ports_geth['eth-p2p'], protocol: 'UDP' }
        { name: 'eth-rpc-ws', port: ports_geth['eth-rpc-ws'] },
      ],
    },
  },

  geth_rpc_service: k.Service('geth-rpc', $.namespace) {
    target: all.statefulset,
    metadata+: {
      labels+: {
        app: 'geth-rpc',
        name: 'geth-rpc',
      },
    },
    spec+: {
      selector: {
        app: 'geth',
        name: 'geth',
      },
      type: 'LoadBalancer',
      ports: [
        { name: 'eth-p2p', port: ports_geth['eth-p2p'] },
        { name: 'eth-p2p-udp', port: ports_geth['eth-p2p-udp'], protocol: 'UDP' },
      ],
      externalTrafficPolicy: 'Cluster',
    },
  },
  geth_rpc_service_internal: k.Service('geth-rpc-internal', $.namespace) {
    target: all.statefulset,
    metadata+: {
      labels+: {
        app: 'geth-rpc-internal',
        name: 'geth-rpc-internal',
      },
      annotations: {
        'cloud.google.com/load-balancer-type': 'Internal',
      },
    },
    spec+: {
      selector: {
        app: 'geth',
        name: 'geth',
      },
      type: 'LoadBalancer',
      ports: [
        { name: 'metrics', port: 6060 },
      ],
    },
  },

  prysm_service: k.Service('prysm', $.namespace) {
    target: all.statefulset,
    metadata+: {
      labels+: {
        app: 'prysm',
        name: 'prysm',
      },
    },
    spec+: {
      selector: {
        app: 'prysm',
        name: 'prysm',
      },
      type: 'ClusterIP',
      ports: [
        { name: 'beacon-rpc', port: ports_prysm['beacon-rpc'] },
        { name: 'beacon-api', port: ports_prysm['beacon-api'] },
        { name: 'beacon-grpc', port: ports_prysm['beacon-grpc'] },
        { name: 'beacon-p2p-tcp', port: ports_prysm['beacon-p2p-tcp'] },
        { name: 'beacon-p2p-udp', port: ports_prysm['beacon-p2p-udp'], protocol: 'UDP' },
      ],
    },
  },

  prysm_headless_service: k.Service('prysm-headless', $.namespace) {
    target: all.statefulset,
    metadata+: {
      labels+: {
        app: 'prysm-headless',
        name: 'prysm-headless',
      },
    },
    spec+: {
      selector: {
        app: 'prysm',
        name: 'prysm',
      },
      type: 'ClusterIP',
      ports: [
        { name: 'beacon-rpc', port: ports_prysm['beacon-rpc'] },
        { name: 'beacon-api', port: ports_prysm['beacon-api'] },
        { name: 'beacon-grpc', port: ports_prysm['beacon-grpc'] },
        { name: 'beacon-p2p-tcp', port: ports_prysm['beacon-p2p-tcp'] },
        { name: 'beacon-p2p-udp', port: ports_prysm['beacon-p2p-udp'], protocol: 'UDP' },
      ],
    },
  },
};

// Don't deploy to the "production" cluster, this only works on GKE
k.List() { items_:: if cluster.cluster != 'production' then all else {} }
