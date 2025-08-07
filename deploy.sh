#!/bin/bash

# Credentials Management System - Deployment Script
# Usage: ./deploy.sh [environment] [action]
# Environment: development, staging, production
# Action: build, deploy, update, rollback, scale

set -e

# Configuration
DOCKER_REGISTRY="your-registry.com"
PROJECT_NAME="credentials"
NAMESPACE="credentials-system"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi

    # Check Helm (optional)
    if ! command -v helm &> /dev/null; then
        print_warning "Helm is not installed (optional for advanced deployments)"
    fi

    print_status "Prerequisites check completed ✓"
}

# Function to build Docker images
build_images() {
    local environment=$1
    print_status "Building Docker images for ${environment}..."

    # Build API image
    print_status "Building API image..."
    docker build -f apps/api/Dockerfile.production -t ${DOCKER_REGISTRY}/${PROJECT_NAME}/api:${environment} apps/api/

    # Build UI image
    print_status "Building UI image..."
    docker build -f apps/ui/Dockerfile -t ${DOCKER_REGISTRY}/${PROJECT_NAME}/ui:${environment} apps/ui/

    print_status "Docker images built successfully ✓"
}

# Function to push images to registry
push_images() {
    local environment=$1
    print_status "Pushing images to registry..."

    docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}/api:${environment}
    docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}/ui:${environment}

    print_status "Images pushed successfully ✓"
}

# Function to deploy with Docker Compose
deploy_compose() {
    local environment=$1
    print_status "Deploying with Docker Compose (${environment})..."

    case $environment in
        development)
            docker-compose -f docker-compose.yml up -d
            ;;
        production)
            docker-compose -f docker-compose.production.yml up -d
            ;;
        *)
            print_error "Unknown environment: $environment"
            exit 1
            ;;
    esac

    print_status "Docker Compose deployment completed ✓"
}

# Function to deploy to Kubernetes
deploy_k8s() {
    local environment=$1
    print_status "Deploying to Kubernetes (${environment})..."

    # Create namespace if it doesn't exist
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

    # Apply Kubernetes manifests
    kubectl apply -f k8s/01-namespace-config.yaml
    kubectl apply -f k8s/02-redis-cluster.yaml
    kubectl apply -f k8s/03-api-deployment.yaml
    kubectl apply -f k8s/04-ui-deployment.yaml
    kubectl apply -f k8s/05-ingress.yaml

    # Wait for deployments to be ready
    print_status "Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/api-deployment -n ${NAMESPACE}
    kubectl wait --for=condition=available --timeout=300s deployment/ui-deployment -n ${NAMESPACE}

    print_status "Kubernetes deployment completed ✓"
}

# Function to scale services
scale_services() {
    local api_replicas=$1
    local ui_replicas=$2

    print_status "Scaling services (API: ${api_replicas}, UI: ${ui_replicas})..."

    kubectl scale deployment api-deployment --replicas=${api_replicas} -n ${NAMESPACE}
    kubectl scale deployment ui-deployment --replicas=${ui_replicas} -n ${NAMESPACE}

    print_status "Services scaled successfully ✓"
}

# Function to rollback deployment
rollback_deployment() {
    print_status "Rolling back deployment..."

    kubectl rollout undo deployment/api-deployment -n ${NAMESPACE}
    kubectl rollout undo deployment/ui-deployment -n ${NAMESPACE}

    print_status "Rollback completed ✓"
}

# Function to check deployment status
check_status() {
    print_status "Checking deployment status..."

    echo "Pods:"
    kubectl get pods -n ${NAMESPACE}

    echo -e "\nServices:"
    kubectl get services -n ${NAMESPACE}

    echo -e "\nIngress:"
    kubectl get ingress -n ${NAMESPACE}

    echo -e "\nHPA Status:"
    kubectl get hpa -n ${NAMESPACE}
}

# Function to view logs
view_logs() {
    local service=$1
    print_status "Viewing logs for ${service}..."

    kubectl logs -f deployment/${service}-deployment -n ${NAMESPACE}
}

# Function to run load tests
run_load_tests() {
    print_status "Running load tests..."

    # Start k6 load testing
    docker-compose -f docker-compose.production.yml --profile loadtest up k6

    print_status "Load tests completed ✓"
}

# Main script logic
main() {
    local environment=${1:-development}
    local action=${2:-deploy}

    print_status "Starting deployment process..."
    print_status "Environment: ${environment}"
    print_status "Action: ${action}"

    check_prerequisites

    case $action in
        build)
            build_images $environment
            ;;
        push)
            build_images $environment
            push_images $environment
            ;;
        deploy)
            case $environment in
                development)
                    deploy_compose $environment
                    ;;
                staging|production)
                    build_images $environment
                    push_images $environment
                    deploy_k8s $environment
                    ;;
            esac
            ;;
        update)
            build_images $environment
            push_images $environment
            kubectl rollout restart deployment/api-deployment -n ${NAMESPACE}
            kubectl rollout restart deployment/ui-deployment -n ${NAMESPACE}
            ;;
        rollback)
            rollback_deployment
            ;;
        scale)
            local api_replicas=${3:-5}
            local ui_replicas=${4:-3}
            scale_services $api_replicas $ui_replicas
            ;;
        status)
            check_status
            ;;
        logs)
            local service=${3:-api}
            view_logs $service
            ;;
        loadtest)
            run_load_tests
            ;;
        *)
            print_error "Unknown action: $action"
            echo "Available actions: build, push, deploy, update, rollback, scale, status, logs, loadtest"
            exit 1
            ;;
    esac

    print_status "Deployment process completed successfully! 🚀"
}

# Run main function with all arguments
main "$@"
