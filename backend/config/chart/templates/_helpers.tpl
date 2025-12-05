{{/*
Create app configs
*/}}
{{- define "app.configs" -}}
    {{- $configs := "" -}}
    {{- if .app.additionalConfigs -}}
        {{- if .global.configs -}}
            {{ $configs = mergeOverwrite .global.configs .app.additionalConfigs }}
        {{- else -}}
            {{ $configs = .app.additionalConfigs }}
        {{- end -}}
    {{- else -}}
        {{ $configs = .global.configs }}
    {{- end -}}

    {{- range $key, $val := $configs }}
        {{- $key | nindent 0 }}: {{ $val | quote }}
    {{- end }}

    {{- if .app.workers -}}
        {{- "DD_SERVICE" | nindent 0 }}: {{ printf "w-%s" (lower .app.name) | quote }}
    {{- else -}}
        {{- "DD_SERVICE" | nindent 0 }}: {{ lower .app.name | quote }}
    {{- end -}}

    {{- "DD_ENV" | nindent 0 }}: {{ .global.deployment | quote }}
    {{- "DD_ENTITY_ID" | nindent 0 }}: {{ "(v1:metadata.uid)" | quote }}
    {{- "DD_AGENT_HOST" | nindent 0 }}: {{ printf "bootstrap-datadog-%s.monitoring.svc.cluster.local" .global.environment | quote }}
    {{- "DD_TRACE_REPORT_HOSTNAME" | nindent 0 }}: {{ true | quote }}

    {{- if .app.workers -}}
        {{- "WORKER" | nindent 0 }}: {{ .app.name | quote }}
    {{- end -}}
{{- end -}}

{{/*
Create app ingress annotations
*/}}
{{- define "app.ingressAnnotations" -}}
    {{- if .global.ingress.annotations -}}
        {{- range $key, $val := .global.ingress.annotations }}
            {{- $key | nindent 0 }}: {{ $val | quote }}
        {{- end -}}
    {{- end -}}
    {{- range $key, $val := .app.additionalIngressAnnotations }}
        {{- $key | nindent 0 }}: {{ $val | quote }}
    {{- end -}}

{{- if contains "roobet.systems" .domain }}
cert-manager.io/cluster-issuer: "letsencrypt-issuer"
{{- end -}}

{{- end -}}

{{/*
Create app ingress paths
*/}}
{{- define "app.ingressPaths" -}}   
    {{- range $val := .app.paths }}
        - pathType: Prefix
          path: {{ $val }}
          backend:
            service:
              name: {{ printf "%s-%s" (lower $.app.name) $.global.deployment }}
              port:
                number: 80
    {{- end }}
{{- end -}}

{{/*
Create app labels
*/}}
{{- define "app.labels" -}}
    {{- if .app.workers -}}
        app: {{ printf "w-%s" (lower .app.name) | quote }}
    {{- else -}}
        app: {{ (lower .app.name) | quote }}
    {{- end -}}
    {{- range $key, $val := .global.labels }}
        {{- $key | nindent 0 }}: {{ $val | quote }}
    {{- end }}
    {{- range $key, $val := .app.additionalLabels }}
        {{- $key | nindent 0 }}: {{ $val | quote }}
    {{- end }}
tags.datadoghq.com/deployment: {{ .global.deployment }}
{{- end -}}

{{/*
Create app metrics annotation
*/}}
{{- define "app.metricsAnnotations" -}}
ad.datadoghq.com/{{ printf "%s-%s" (lower $.app.name) $.global.deployment }}.checks: |
    {
        "openmetrics": {
            "init_config": {},
            "instances": [
                {
                    "histogram_buckets_as_distributions": true,
                    "max_returned_metrics": 6000,
                    "metrics": [".*"],
                    "openmetrics_endpoint": "http://%%host%%:{{ $.global.metrics.port }}{{ $.global.metrics.path }}"
                }
            ]
        }
    }
{{- end }}

{{/*
Create app lowerName
*/}}
{{- define "app.lowerName" -}}
    {{- if .app.workers -}}
        {{ printf "w-%s-%s" (lower .app.name) .global.deployment }}
    {{- else -}}
        {{ printf "%s-%s" (lower .app.name) .global.deployment }}
    {{- end -}}
{{- end -}}

{{/*
Create app secrets
*/}}
{{- define "app.secrets" -}}
    {{- $secrets := "" -}}
    {{- if .app.additionalSecrets -}}
        {{- if .global.secrets -}}
            {{ $secrets = concat .global.secrets .app.additionalSecrets }}
        {{- else -}}
            {{ $secrets = .app.additionalSecrets }}
        {{- end -}}
    {{- else -}}
        {{ $secrets = .global.secrets }}
    {{- end -}}

    {{- range $key := $secrets }}
    - secretKey: {{ $key }}
      remoteRef:
        key: {{ printf "/%s/%s/%s/%s" $.global.owner $.global.component $.global.deployment (lower $key) }}
    {{- end }}
{{- end -}}

{{/*
Create app tag
*/}}
{{- define "app.tag" -}}
{{- $tag := .global.image.tag}}
    {{- if .app.image -}}
        {{- if .app.image.tag -}}
            {{- $tag = .app.image.tag }}
        {{- end -}}
    {{- end -}}

    {{- $tag -}}
{{- end -}}

{{/*
Create ip2location pvc name
*/}}
{{- define "ip2location.name" -}}
    {{ printf "%s-%s" .global.ip2location.name .global.deployment }}
{{- end -}}
