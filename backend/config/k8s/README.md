# Deployment Guide

## Installation Guide

Before deploying on GKE, you need to have `kubectl` and the `gcloud` CLI tools installed. Here's how to install both on various platforms:

### `kubectl` and `kubecfg` Installation

#### **Linux**

From Source:

```bash
curl -LO "https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/$ARCH/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

#### **Windows**

Download the latest release from [this link](https://storage.googleapis.com/kubernetes-release/release/v1.22.0/bin/windows/amd64/kubectl.exe) and add it to your PATH.

#### **Mac**

- Using `brew`:

  ```bash
  brew install kubectl
  ```

- Manual installation:

  ```bash
  curl -LO "https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/darwin/$ARCH/kubectl"
  chmod +x kubectl
  sudo mv kubectl /usr/local/bin/
  ```

### `gcloud` SDK Installation

#### **Ubuntu/Debian-based distributions**

```bash
export CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)"
echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
sudo apt-get update && sudo apt-get install google-cloud-sdk
```

#### **Windows**

Navigate to the [Google Cloud SDK Downloads page](https://cloud.google.com/sdk/docs/downloads-interactive) and download and run the interactive installer for Windows.

#### **Mac**

- Using `brew`:

  ```bash
  brew install --cask google-cloud-sdk
  ```

- Manual installation:

  1. Navigate to the [Google Cloud SDK Downloads page](https://cloud.google.com/sdk/docs/downloads-versioned-archives).
  2. Download the version for Darwin (Mac OS).
  3. Extract the archive and run the `./install.sh` script inside the extracted directory.

#### **gke-gcloud-auth-plugin Installation**

After setting up `kubectl` and the `gcloud SDK`, you might also need the `gke-gcloud-auth-plugin` to authenticate with Google Kubernetes Engine (GKE) clusters.

To install the `gke-gcloud-auth-plugin`, use the following command:

```bash
gcloud components install gke-gcloud-auth-plugin
```

## Prerequisites

- A Google Cloud Platform (GCP) account.
- [`gcloud` CLI](https://cloud.google.com/sdk/docs/install)
- [`kubectl` CLI](https://kubernetes.io/docs/tasks/tools/install-kubectl/)

## Setting up GCP and GKE Access

### **Authenticate with GCP**

Run the following command and follow the instructions:

```bash
gcloud auth login
```

### **Set your project**

```bash
gcloud config set project roobet-staging
```

### **Get GKE Cluster Credentials**

```bash
gcloud container clusters get-credentials blue --region europe-west3
```

This configures `kubectl` to use the credentials for the specified GKE cluster.

## Verifying Access

### **Check Cluster Info**

Ensure you can view the cluster info:

```bash
kubectl -n default cluster-info
```

### **List Deployments**

Ensure you can view the deployments in your specified namespace:

```bash
kubectl -n default get deployments
```

## Restarting the Deployment

### **Use Rollout Command**

```bash
kubectl rollout restart deployment -n default -l roobet.com/repo=backend
```

## Updating the Deployment from a Local File

```bash
kubecfg update api.jsonnet --ext-code-file cluster=./platform-clusters/blue.json
kubecfg update workers.jsonnet --ext-code-file cluster=./platform-clusters/blue.json
```

## Troubleshooting

- **Installing `kubecfg`**

`kubecfg` is a valuable tool for diagnosing issues within the cluster's config files as well as mnanaging complexex infrastructures. It can be installed via pip via your teminal of choice on most operating systems as long as Python3 is installed:

     pip install kubecfg

As well as `brew` via MacOS:

     brew install kubecfg

- **Unauthorized or Permissions error** Ensure you have the necessary IAM permissions on GCP. You can check your permissions by running:

  ```bash
  gcloud projects get-iam-policy roobet-staging
  ```

- **Deployment not found** Ensure the label selector is correct. You can list all deployments with their labels using:

  ```bash
  kubectl -n NAMESPACE get deployments --show-labels
  ```

- **Deployment not found** Ensure you are using the correct namespace. You can list all namespaces using:

  ```bash
  kubectl get namespaces
  ```

- **SSL Error or Command Timeout** If you encounter an SSL error or experience a timeout when using the `kubectl` command, ensure that you are connected to the dev VPN.
