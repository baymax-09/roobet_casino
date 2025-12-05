# Backend Helm Chart

This helm chart is intended to spin up all workloads necessary for the backend app/api/workers to run and serve traffic. It strives to be as dry as possible, reducing duplication, while still allowing extension and overrides as necessary. It is intended to be deployed/managed via ArgoCD and leverages separate yaml files to allow for easy separation of apps within ArgoCD.

## Contents
- [File Structure](#file-structure)
- [Yaml Structure](#yaml-structure)
  - [Overwriting Values](#overwriting-values)
- [Rendering Locally](#rendering-locally)

### File Structure
This chart leverages helm's default behavior of layering configuration utilizing multiple "values" yaml files.

- `values.yaml`: This yaml file is intended to store default values for all environments/deployments. 
- `stage.yaml`: This yaml file is intended to store values that apply to most workloads in the staging deployment as well as extend/overwrite default values from the `values.yaml` file.
- `stage/<workload>.yaml`: These yaml files are intended to store values that apply for the specific workload for the staging deployment as well as extend/overwrite any values from the `values.yaml` or `stage.yaml`.  
-- We've chosen to separate the non worker workloads as their own files as there are significant differences between these workloads. Furthermore this allows us to easily create separate ArgoCD apps for each non worker workload, making visualization more consumable in the UI.  
-- We've chosen to group the worker workloads into a single file as their configurations are extremely similar. By leveraging a list of worker names this also allows for easy creation of new workers. This also allows us to use the default values for the majority of workers and only overwrite as needed. Worker resources will still follow the usual `w-<name>` convention as well as automatically including the correct `WORKER` configuration variable (accomplished via `named templates/helpers`).

### Yaml Structure
The structure of the yaml files are broken into 2 main sections:
- `global`: Keys/Values within `global` are intended to be used/applicable across multiple workloads and/or workloads of different types. Values set in `global` are primary intended to be overridden as needed in different `yaml` files.
- `app`: Keys/Values within `app` are intended to either extend values set in `global` (ie `additionalConfigs` or `additionalSecrets`) or to set values for which there are no defaults in `global` (ie `replicas` or `paths`). Typically these will be very unique to the workload.

##### Overwriting Values
To overwrite values within a non-worker `yaml` file, just follow the same yaml structure for the key/values you wish to overwrite. For example, to overwrite the default resource requests/limits for the `api` workload in your `api.yaml`:
```
global:
  resources:
    limits:
      memory: 2Gi
    requests:
      cpu: 100m
      memory: 2Gi
app:
  name: api
  type: deployment

  ...
```

To overwrite values within a worker `yaml` file, add your worker name as a key at the top level then following the same yaml structure for the key/values you wish to overwrite underneath that key. This is due to how we loop over the `workers` list to generate resources in our `templates`. For example, to overwrite the default resource requests/limits for the `analytics` worker in your `workers-statefulset.yaml`:
```
app:
  type: statefulset
  workers:
    - analytics
    ...

analytics:
  global:
    resources:
      limits:
        memory: 2Gi
      requests:
        cpu: 100m
        memory: 2Gi
```

### Rendering Locally
In order to test changes to this chart you can render the resulting k8s resource yamls by leveraging the `helm template` command. Helm will automatically use the `values.yaml` so only the `deployment` and `app` yamls need to be explicitly passed. For example, to see the resource yamls for `api` from within the `charts` directory:
```
helm template backend . --values stage.yaml --values stage/api.yaml
```
