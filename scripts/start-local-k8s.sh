#!/bin/bash
set -e

# Add local bin to PATH for this script
export PATH=$HOME/.local/bin:$PATH

echo "🚀 Starting Minikube Cluster..."
minikube start --driver=docker

echo "📦 Enabling Ingress addon..."
minikube addons enable ingress

echo "🏗️  Building Docker Image (inside Minikube)..."
# Point shell to minikube's docker-daemon so we don't need a registry
eval $(minikube -p minikube docker-env)
docker build -t aiscrape:latest .

echo "☸️  Deploying Manifests..."
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/hpa.yaml

echo "✅ Deployment Complete!"
echo "➡️  Check status: kubectl get pods"
echo "➡️  Watch scaling: kubectl get hpa --watch"
echo "➡️  Access App: minikube service aiscrape-web-service"
