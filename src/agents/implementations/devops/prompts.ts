/**
 * DevOps Agent Prompts
 * Centralized prompt templates for DevOps and infrastructure tasks
 */

export const DevOpsPrompts = {
  // Infrastructure Analysis Templates
  infrastructureAnalysis: {
    systemArchitectureReview: `
As a DevOps Engineer, I need to analyze the current system architecture. Please help me understand:

## Infrastructure Assessment

### Current Architecture
1. **Compute Resources**:
   - What servers/instances are currently running?
   - What are the CPU, memory, and storage specifications?
   - How is the workload distributed across resources?

2. **Network Architecture**:
   - What is the network topology?
   - How are services connected (VPC, subnets, security groups)?
   - What load balancing is in place?

3. **Data Storage**:
   - What databases are being used?
   - How is data backed up and replicated?
   - What are the storage performance requirements?

4. **Security Infrastructure**:
   - What security measures are currently implemented?
   - How is access control managed?
   - What compliance requirements must be met?

### Performance Metrics
- **Current Load**: [Describe current system load]
- **Response Times**: [Current performance metrics]
- **Availability**: [Uptime statistics]
- **Scalability Limits**: [Current scaling constraints]

Please provide detailed information about each component.
    `,

    capacityPlanning: `
Let's perform capacity planning analysis:

## Capacity Planning Assessment

### Current Utilization
1. **CPU Utilization**:
   - Average: [%]
   - Peak: [%]
   - Trends: [Growing/Stable/Declining]

2. **Memory Utilization**:
   - Average: [%]
   - Peak: [%]
   - Memory leaks detected: [Yes/No]

3. **Storage Utilization**:
   - Current usage: [GB/TB]
   - Growth rate: [GB per month]
   - I/O performance: [IOPS]

4. **Network Utilization**:
   - Bandwidth usage: [Mbps]
   - Latency: [ms]
   - Packet loss: [%]

### Growth Projections
- **User Growth**: [Expected % increase]
- **Data Growth**: [Expected volume increase]
- **Transaction Growth**: [Expected load increase]

### Scaling Requirements
- **Horizontal Scaling**: [When and how to scale out]
- **Vertical Scaling**: [When and how to scale up]
- **Auto-scaling Triggers**: [Metrics and thresholds]

### Recommendations
1. **Immediate Actions**: [What needs attention now]
2. **Short-term (1-3 months)**: [Upcoming capacity needs]
3. **Long-term (6+ months)**: [Strategic capacity planning]

Please provide current metrics and growth expectations.
    `,

    securityAssessment: `
Let's conduct a security infrastructure assessment:

## Security Infrastructure Review

### Access Control
1. **Authentication**:
   - What authentication methods are used?
   - Is multi-factor authentication implemented?
   - How are service accounts managed?

2. **Authorization**:
   - What role-based access controls are in place?
   - How are permissions managed and audited?
   - Are there any overprivileged accounts?

3. **Network Security**:
   - What firewalls and security groups are configured?
   - Is network segmentation implemented?
   - Are there any exposed services?

### Data Protection
1. **Encryption**:
   - Is data encrypted at rest?
   - Is data encrypted in transit?
   - How are encryption keys managed?

2. **Backup Security**:
   - Are backups encrypted?
   - How is backup access controlled?
   - What is the backup retention policy?

### Monitoring and Compliance
1. **Security Monitoring**:
   - What security monitoring tools are in place?
   - How are security events logged and analyzed?
   - What alerting mechanisms exist?

2. **Compliance**:
   - What compliance standards must be met?
   - How is compliance monitored and reported?
   - When was the last security audit?

### Vulnerability Management
- **Patch Management**: [How are systems patched?]
- **Vulnerability Scanning**: [What tools are used?]
- **Incident Response**: [What is the response plan?]

Please provide details about current security measures.
    `
  },

  // Deployment Guides
  deploymentGuides: {
    cicdPipeline: `
# CI/CD Pipeline Setup Guide

## Pipeline Overview
- **Source Control**: [Git repository details]
- **CI/CD Platform**: [Jenkins/GitLab CI/GitHub Actions/Azure DevOps]
- **Target Environment**: [Development/Staging/Production]

## Pipeline Stages

### 1. Source Code Management
\`\`\`yaml
# Example configuration
source:
  repository: [repository-url]
  branch: [main/develop]
  triggers:
    - push
    - pull_request
\`\`\`

### 2. Build Stage
\`\`\`yaml
build:
  steps:
    - name: Install Dependencies
      run: [package manager install command]
    
    - name: Compile/Build
      run: [build command]
    
    - name: Run Unit Tests
      run: [test command]
    
    - name: Code Quality Check
      run: [linting/sonar command]
\`\`\`

### 3. Security Scanning
\`\`\`yaml
security:
  steps:
    - name: Dependency Scan
      run: [dependency vulnerability scan]
    
    - name: Static Code Analysis
      run: [SAST tool]
    
    - name: Container Scan
      run: [container security scan]
\`\`\`

### 4. Package and Artifact Management
\`\`\`yaml
package:
  steps:
    - name: Build Container Image
      run: docker build -t [image-name]:[tag] .
    
    - name: Push to Registry
      run: docker push [registry]/[image-name]:[tag]
    
    - name: Store Artifacts
      artifacts:
        - build/
        - dist/
\`\`\`

### 5. Deployment Stages

#### Development Environment
\`\`\`yaml
deploy_dev:
  environment: development
  steps:
    - name: Deploy to Dev
      run: [deployment command]
    
    - name: Run Integration Tests
      run: [integration test command]
    
    - name: Smoke Tests
      run: [smoke test command]
\`\`\`

#### Staging Environment
\`\`\`yaml
deploy_staging:
  environment: staging
  requires: [deploy_dev]
  steps:
    - name: Deploy to Staging
      run: [deployment command]
    
    - name: Run E2E Tests
      run: [e2e test command]
    
    - name: Performance Tests
      run: [performance test command]
\`\`\`

#### Production Environment
\`\`\`yaml
deploy_production:
  environment: production
  requires: [deploy_staging]
  manual_approval: true
  steps:
    - name: Blue-Green Deployment
      run: [blue-green deployment script]
    
    - name: Health Check
      run: [health check script]
    
    - name: Rollback Plan
      run: [rollback script if needed]
\`\`\`

## Pipeline Configuration

### Environment Variables
\`\`\`yaml
variables:
  - DATABASE_URL: [encrypted]
  - API_KEY: [encrypted]
  - ENVIRONMENT: [dev/staging/prod]
\`\`\`

### Notifications
\`\`\`yaml
notifications:
  slack:
    channel: #deployments
    on_success: true
    on_failure: true
  
  email:
    recipients: [team-email]
    on_failure: true
\`\`\`

## Best Practices
1. **Version Control**: Tag releases and maintain changelog
2. **Testing**: Ensure comprehensive test coverage
3. **Security**: Scan for vulnerabilities at each stage
4. **Monitoring**: Set up deployment monitoring and alerting
5. **Rollback**: Always have a rollback strategy

## Troubleshooting
- **Build Failures**: [Common issues and solutions]
- **Test Failures**: [How to handle test failures]
- **Deployment Issues**: [Deployment troubleshooting steps]
    `,

    containerDeployment: `
# Container Deployment Guide

## Container Strategy
- **Container Runtime**: [Docker/Podman]
- **Orchestration**: [Kubernetes/Docker Swarm/ECS]
- **Registry**: [Docker Hub/ECR/ACR/GCR]

## Dockerfile Best Practices

### Multi-stage Build Example
\`\`\`dockerfile
# Build stage
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM node:16-alpine AS runtime
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Set ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000
CMD [\"node\", \"dist/index.js\"]
\`\`\`

## Kubernetes Deployment

### Deployment Manifest
\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: [app-name]
  namespace: [namespace]
spec:
  replicas: 3
  selector:
    matchLabels:
      app: [app-name]
  template:
    metadata:
      labels:
        app: [app-name]
    spec:
      containers:
      - name: [app-name]
        image: [registry]/[image]:[tag]
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: \"production\"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: [secret-name]
              key: database-url
        resources:
          requests:
            memory: \"256Mi\"
            cpu: \"250m\"
          limits:
            memory: \"512Mi\"
            cpu: \"500m\"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
\`\`\`

### Service Manifest
\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: [app-name]-service
  namespace: [namespace]
spec:
  selector:
    app: [app-name]
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
\`\`\`

### Ingress Manifest
\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: [app-name]-ingress
  namespace: [namespace]
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - [domain.com]
    secretName: [app-name]-tls
  rules:
  - host: [domain.com]
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: [app-name]-service
            port:
              number: 80
\`\`\`

## Deployment Strategies

### Rolling Update
\`\`\`yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 1
    maxSurge: 1
\`\`\`

### Blue-Green Deployment
\`\`\`bash
# Deploy to green environment
kubectl apply -f green-deployment.yaml

# Wait for green to be ready
kubectl rollout status deployment/[app-name]-green

# Switch traffic to green
kubectl patch service [app-name]-service -p '{\"spec\":{\"selector\":{\"version\":\"green\"}}}'

# Clean up blue environment
kubectl delete deployment [app-name]-blue
\`\`\`

## Monitoring and Logging

### Container Monitoring
\`\`\`yaml
# Prometheus monitoring
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: [app-name]-monitor
spec:
  selector:
    matchLabels:
      app: [app-name]
  endpoints:
  - port: metrics
    path: /metrics
\`\`\`

### Logging Configuration
\`\`\`yaml
# Fluentd logging
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*[app-name]*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      format json
    </source>
\`\`\`

## Security Considerations
1. **Image Scanning**: Scan images for vulnerabilities
2. **Non-root User**: Run containers as non-root
3. **Resource Limits**: Set appropriate resource limits
4. **Network Policies**: Implement network segmentation
5. **Secrets Management**: Use Kubernetes secrets or external secret managers
    `,

    infrastructureAsCode: `
# Infrastructure as Code Guide

## Terraform Configuration

### Provider Configuration
\`\`\`hcl
terraform {
  required_version = \">= 1.0\"
  required_providers {
    aws = {
      source  = \"hashicorp/aws\"
      version = \"~> 5.0\"
    }
  }
  
  backend \"s3\" {
    bucket = \"[terraform-state-bucket]\"
    key    = \"[environment]/terraform.tfstate\"
    region = \"[region]\"
  }
}

provider \"aws\" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = \"terraform\"
    }
  }
}
\`\`\`

### Variables
\`\`\`hcl
variable \"environment\" {
  description = \"Environment name\"
  type        = string
  validation {
    condition     = contains([\"dev\", \"staging\", \"prod\"], var.environment)
    error_message = \"Environment must be dev, staging, or prod.\"
  }
}

variable \"aws_region\" {
  description = \"AWS region\"
  type        = string
  default     = \"us-west-2\"
}

variable \"instance_type\" {
  description = \"EC2 instance type\"
  type        = string
  default     = \"t3.medium\"
}
\`\`\`

### VPC Configuration
\`\`\`hcl
module \"vpc\" {
  source = \"terraform-aws-modules/vpc/aws\"
  
  name = \"\${var.project_name}-\${var.environment}\"
  cidr = \"10.0.0.0/16\"
  
  azs             = [\"\${var.aws_region}a\", \"\${var.aws_region}b\", \"\${var.aws_region}c\"]
  private_subnets = [\"10.0.1.0/24\", \"10.0.2.0/24\", \"10.0.3.0/24\"]
  public_subnets  = [\"10.0.101.0/24\", \"10.0.102.0/24\", \"10.0.103.0/24\"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  
  tags = {
    Environment = var.environment
  }
}
\`\`\`

### Security Groups
\`\`\`hcl
resource \"aws_security_group\" \"web\" {
  name_prefix = \"\${var.project_name}-web-\"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = \"tcp\"
    cidr_blocks = [\"0.0.0.0/0\"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = \"tcp\"
    cidr_blocks = [\"0.0.0.0/0\"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = \"-1\"
    cidr_blocks = [\"0.0.0.0/0\"]
  }
}
\`\`\`

### Auto Scaling Group
\`\`\`hcl
resource \"aws_launch_template\" \"app\" {
  name_prefix   = \"\${var.project_name}-\"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  
  vpc_security_group_ids = [aws_security_group.web.id]
  
  user_data = base64encode(templatefile(\"\${path.module}/user_data.sh\", {
    environment = var.environment
  }))
  
  tag_specifications {
    resource_type = \"instance\"
    tags = {
      Name = \"\${var.project_name}-\${var.environment}\"
    }
  }
}

resource \"aws_autoscaling_group\" \"app\" {
  name                = \"\${var.project_name}-\${var.environment}\"
  vpc_zone_identifier = module.vpc.private_subnets
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = \"ELB\"
  
  min_size         = 2
  max_size         = 10
  desired_capacity = 3
  
  launch_template {
    id      = aws_launch_template.app.id
    version = \"$Latest\"
  }
}
\`\`\`

## Ansible Playbooks

### Inventory
\`\`\`yaml
# inventory/production.yml
all:
  children:
    webservers:
      hosts:
        web1:
          ansible_host: 10.0.1.10
        web2:
          ansible_host: 10.0.1.11
    databases:
      hosts:
        db1:
          ansible_host: 10.0.2.10
  vars:
    ansible_user: ubuntu
    ansible_ssh_private_key_file: ~/.ssh/production.pem
\`\`\`

### Main Playbook
\`\`\`yaml
# site.yml
---
- name: Configure web servers
  hosts: webservers
  become: yes
  roles:
    - common
    - nginx
    - application
  
- name: Configure database servers
  hosts: databases
  become: yes
  roles:
    - common
    - postgresql
\`\`\`

### Application Role
\`\`\`yaml
# roles/application/tasks/main.yml
---
- name: Install application dependencies
  package:
    name: \"{{ item }}\"
    state: present
  loop:
    - nodejs
    - npm
    - git

- name: Create application user
  user:
    name: \"{{ app_user }}\"
    system: yes
    shell: /bin/bash
    home: \"{{ app_directory }}\"

- name: Clone application repository
  git:
    repo: \"{{ app_repository }}\"
    dest: \"{{ app_directory }}\"
    version: \"{{ app_version }}\"
  become_user: \"{{ app_user }}\"
  notify: restart application

- name: Install application dependencies
  npm:
    path: \"{{ app_directory }}\"
    production: yes
  become_user: \"{{ app_user }}\"

- name: Create systemd service
  template:
    src: application.service.j2
    dest: /etc/systemd/system/{{ app_name }}.service
  notify:
    - reload systemd
    - restart application

- name: Start and enable application service
  systemd:
    name: \"{{ app_name }}\"
    state: started
    enabled: yes
\`\`\`

## Best Practices
1. **Version Control**: Store all IaC in version control
2. **State Management**: Use remote state storage
3. **Modules**: Create reusable modules
4. **Testing**: Test infrastructure changes
5. **Documentation**: Document infrastructure decisions
    `
  },

  // Monitoring Setup Prompts
  monitoringSetup: {
    systemMonitoring: `
# System Monitoring Setup Guide

## Monitoring Stack Overview
- **Metrics Collection**: Prometheus
- **Visualization**: Grafana
- **Alerting**: AlertManager
- **Log Aggregation**: ELK Stack (Elasticsearch, Logstash, Kibana)

## Prometheus Configuration

### prometheus.yml
\`\`\`yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - \"alert_rules.yml\"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
  
  - job_name: 'application'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s
  
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
\`\`\`

### Alert Rules
\`\`\`yaml
# alert_rules.yml
groups:
  - name: system_alerts
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: \"High CPU usage detected\"
          description: \"CPU usage is above 80% for more than 5 minutes\"
      
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: \"High memory usage detected\"
          description: \"Memory usage is above 85% for more than 5 minutes\"
      
      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: \"Low disk space\"
          description: \"Disk space is below 10%\"
      
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: \"Service is down\"
          description: \"{{ $labels.instance }} has been down for more than 1 minute\"
\`\`\`

## Grafana Dashboards

### System Overview Dashboard
\`\`\`json
{
  \"dashboard\": {
    \"title\": \"System Overview\",
    \"panels\": [
      {
        \"title\": \"CPU Usage\",
        \"type\": \"graph\",
        \"targets\": [
          {
            \"expr\": \"100 - (avg by(instance) (irate(node_cpu_seconds_total{mode=\\\"idle\\\"}[5m])) * 100)\",
            \"legendFormat\": \"{{ instance }}\"
          }
        ]
      },
      {
        \"title\": \"Memory Usage\",
        \"type\": \"graph\",
        \"targets\": [
          {
            \"expr\": \"(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100\",
            \"legendFormat\": \"{{ instance }}\"
          }
        ]
      },
      {
        \"title\": \"Disk Usage\",
        \"type\": \"graph\",
        \"targets\": [
          {
            \"expr\": \"(node_filesystem_size_bytes - node_filesystem_avail_bytes) / node_filesystem_size_bytes * 100\",
            \"legendFormat\": \"{{ instance }} - {{ mountpoint }}\"
          }
        ]
      }
    ]
  }
}
\`\`\`

## ELK Stack Configuration

### Elasticsearch
\`\`\`yaml
# elasticsearch.yml
cluster.name: \"logging-cluster\"
node.name: \"elasticsearch-node-1\"
network.host: 0.0.0.0
http.port: 9200
discovery.type: single-node
xpack.security.enabled: false
\`\`\`

### Logstash
\`\`\`ruby
# logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][log_type] == \"application\" {
    grok {
      match => { \"message\" => \"%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}\" }
    }
    
    date {
      match => [ \"timestamp\", \"ISO8601\" ]
    }
  }
}

output {
  elasticsearch {
    hosts => [\"elasticsearch:9200\"]
    index => \"logs-%{+YYYY.MM.dd}\"
  }
}
\`\`\`

### Filebeat
\`\`\`yaml
# filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/application/*.log
  fields:
    log_type: application
  fields_under_root: true

output.logstash:
  hosts: [\"logstash:5044\"]

logging.level: info
\`\`\`

## Application Performance Monitoring (APM)

### New Relic Configuration
\`\`\`javascript
// newrelic.js
exports.config = {
  app_name: ['Your Application Name'],
  license_key: 'your-license-key',
  logging: {
    level: 'info'
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  }
};
\`\`\`

### Datadog APM
\`\`\`javascript
// app.js
const tracer = require('dd-trace').init({
  service: 'your-service-name',
  env: process.env.NODE_ENV,
  version: process.env.APP_VERSION
});

// Your application code
const express = require('express');
const app = express();
\`\`\`

## Alerting Configuration

### AlertManager
\`\`\`yaml
# alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@yourcompany.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  email_configs:
  - to: 'admin@yourcompany.com'
    subject: 'Alert: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}
  
  slack_configs:
  - api_url: 'YOUR_SLACK_WEBHOOK_URL'
    channel: '#alerts'
    title: 'Alert: {{ .GroupLabels.alertname }}'
    text: |
      {{ range .Alerts }}
      {{ .Annotations.summary }}
      {{ .Annotations.description }}
      {{ end }}
\`\`\`

## Best Practices
1. **Metric Naming**: Use consistent naming conventions
2. **Alert Fatigue**: Avoid too many low-priority alerts
3. **Dashboard Design**: Create focused, actionable dashboards
4. **Data Retention**: Set appropriate retention policies
5. **Security**: Secure monitoring endpoints and data
    `,

    applicationPerformanceMonitoring: `
# Application Performance Monitoring (APM) Setup

## APM Strategy
- **Performance Metrics**: Response time, throughput, error rate
- **User Experience**: Real user monitoring (RUM)
- **Infrastructure Correlation**: Link app performance to infrastructure
- **Business Metrics**: Track business-relevant KPIs

## Prometheus Application Metrics

### Custom Metrics in Node.js
\`\`\`javascript
const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);

// Middleware to track metrics
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
}

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
\`\`\`

### Python Flask Metrics
\`\`\`python
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from flask import Flask, request, Response
import time

app = Flask(__name__)

# Metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

ACTIVE_REQUESTS = Gauge(
    'active_requests',
    'Number of active requests'
)

@app.before_request
def before_request():
    request.start_time = time.time()
    ACTIVE_REQUESTS.inc()

@app.after_request
def after_request(response):
    request_latency = time.time() - request.start_time
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.endpoint,
        status=response.status_code
    ).inc()
    
    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.endpoint
    ).observe(request_latency)
    
    ACTIVE_REQUESTS.dec()
    return response

@app.route('/metrics')
def metrics():
    return Response(generate_latest(), mimetype='text/plain')
\`\`\`

## Distributed Tracing

### Jaeger Setup
\`\`\`yaml
# docker-compose.yml for Jaeger
version: '3.7'
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - \"16686:16686\"
      - \"14268:14268\"
    environment:
      - COLLECTOR_OTLP_ENABLED=true
\`\`\`

### OpenTelemetry Node.js
\`\`\`javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

const jaegerExporter = new JaegerExporter({
  endpoint: 'http://localhost:14268/api/traces',
});

const sdk = new NodeSDK({
  traceExporter: jaegerExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
\`\`\`

## Error Tracking

### Sentry Configuration
\`\`\`javascript
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});

// Error handling middleware
app.use(Sentry.Handlers.errorHandler());
\`\`\`

## Performance Budgets

### Lighthouse CI
\`\`\`json
{
  \"ci\": {
    \"collect\": {
      \"url\": [\"http://localhost:3000\"],
      \"numberOfRuns\": 3
    },
    \"assert\": {
      \"assertions\": {
        \"categories:performance\": [\"error\", {\"minScore\": 0.9}],
        \"categories:accessibility\": [\"error\", {\"minScore\": 0.9}],
        \"categories:best-practices\": [\"error\", {\"minScore\": 0.9}],
        \"categories:seo\": [\"error\", {\"minScore\": 0.9}]
      }
    },
    \"upload\": {
      \"target\": \"temporary-public-storage\"
    }
  }
}
\`\`\`

## SLI/SLO Monitoring

### Prometheus SLO Rules
\`\`\`yaml
# SLO rules
groups:
  - name: slo_rules
    interval: 30s
    rules:
      # Availability SLI
      - record: sli:availability:rate5m
        expr: |
          (
            sum(rate(http_requests_total{status!~\"5..\"}[5m]))
            /
            sum(rate(http_requests_total[5m]))
          )
      
      # Latency SLI (95th percentile)
      - record: sli:latency:p95:5m
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
          )
      
      # Error rate SLI
      - record: sli:error_rate:rate5m
        expr: |
          (
            sum(rate(http_requests_total{status=~\"5..\"}[5m]))
            /
            sum(rate(http_requests_total[5m]))
          )
\`\`\`

### SLO Alerts
\`\`\`yaml
# SLO alerts
groups:
  - name: slo_alerts
    rules:
      - alert: AvailabilitySLOBreach
        expr: sli:availability:rate5m < 0.99
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: \"Availability SLO breach\"
          description: \"Availability is {{ $value | humanizePercentage }}, below 99% SLO\"
      
      - alert: LatencySLOBreach
        expr: sli:latency:p95:5m > 0.5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: \"Latency SLO breach\"
          description: \"95th percentile latency is {{ $value }}s, above 500ms SLO\"
      
      - alert: ErrorRateSLOBreach
        expr: sli:error_rate:rate5m > 0.01
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: \"Error rate SLO breach\"
          description: \"Error rate is {{ $value | humanizePercentage }}, above 1% SLO\"
\`\`\`

## Best Practices
1. **Golden Signals**: Monitor latency, traffic, errors, and saturation
2. **SLI/SLO**: Define and track service level indicators and objectives
3. **Distributed Tracing**: Implement tracing for microservices
4. **Error Budgets**: Use error budgets to balance reliability and velocity
5. **Performance Testing**: Regular performance testing and monitoring
    `
  },

  // Troubleshooting Workflows
  troubleshootingWorkflows: {
    performanceTroubleshooting: `
# Performance Troubleshooting Workflow

## Initial Assessment

### 1. Identify the Problem
- **Symptoms**: What performance issues are being reported?
- **Scope**: Is it affecting all users or specific segments?
- **Timeline**: When did the issue start?
- **Severity**: How critical is the performance impact?

### 2. Gather Initial Data
\`\`\`bash
# Check system resources
top -p $(pgrep -d',' -f 'your-application')
htop
iostat -x 1
vmstat 1

# Check network
netstat -i
ss -tuln
ping -c 5 external-service.com

# Check disk usage
df -h
du -sh /var/log/*
lsof +D /path/to/app
\`\`\`

## Application-Level Investigation

### 3. Application Metrics Analysis
\`\`\`promql
# Response time trends
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# Error rate
rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m])

# Throughput
rate(http_requests_total[5m])

# Memory usage
process_resident_memory_bytes

# CPU usage
rate(process_cpu_seconds_total[5m])
\`\`\`

### 4. Database Performance
\`\`\`sql
-- PostgreSQL slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Lock analysis
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
\`\`\`

### 5. Application Profiling
\`\`\`javascript
// Node.js profiling
const v8Profiler = require('v8-profiler-next');

// Start CPU profiling
const title = 'performance-issue-' + Date.now();
v8Profiler.startProfiling(title, true);

// ... run your application code ...

// Stop profiling and save
const profile = v8Profiler.stopProfiling(title);
profile.export(function(error, result) {
  fs.writeFileSync('./profile.cpuprofile', result);
  profile.delete();
});
\`\`\`

## Infrastructure-Level Investigation

### 6. Container/Pod Analysis
\`\`\`bash
# Kubernetes pod resource usage
kubectl top pods -n your-namespace
kubectl describe pod your-pod-name
kubectl logs your-pod-name --previous

# Docker container stats
docker stats container-name
docker exec -it container-name /bin/bash

# Check container limits
kubectl get pod your-pod-name -o yaml | grep -A 10 resources
\`\`\`

### 7. Network Analysis
\`\`\`bash
# Network latency
ping -c 10 target-host
traceroute target-host
mtr --report target-host

# Bandwidth testing
iperf3 -c target-host

# DNS resolution
nslookup target-host
dig target-host
\`\`\`

### 8. Load Balancer Analysis
\`\`\`bash
# AWS ALB metrics
aws cloudwatch get-metric-statistics \\
  --namespace AWS/ApplicationELB \\
  --metric-name TargetResponseTime \\
  --dimensions Name=LoadBalancer,Value=your-alb \\
  --start-time 2023-01-01T00:00:00Z \\
  --end-time 2023-01-01T01:00:00Z \\
  --period 300 \\
  --statistics Average

# NGINX access log analysis
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10
\`\`\`

## Root Cause Analysis

### 9. Correlation Analysis
- **Timeline Correlation**: Match performance degradation with deployments, config changes
- **Resource Correlation**: Identify resource bottlenecks (CPU, memory, disk, network)
- **External Dependencies**: Check third-party service status and performance
- **Traffic Patterns**: Analyze if performance issues correlate with traffic spikes

### 10. Hypothesis Testing
\`\`\`bash
# Test specific scenarios
# Load testing
wrk -t12 -c400 -d30s --latency http://your-app.com/api/endpoint

# Stress testing specific endpoints
ab -n 1000 -c 10 http://your-app.com/slow-endpoint

# Database query testing
psql -c \"EXPLAIN ANALYZE SELECT * FROM large_table WHERE condition;\"
\`\`\`

## Resolution Strategies

### 11. Immediate Mitigations
- **Scale Resources**: Increase CPU/memory limits
- **Circuit Breakers**: Implement circuit breakers for failing dependencies
- **Rate Limiting**: Apply rate limiting to protect resources
- **Cache Warming**: Pre-warm caches if cache misses are causing issues
- **Traffic Routing**: Route traffic away from problematic instances

### 12. Long-term Fixes
- **Code Optimization**: Fix inefficient algorithms or database queries
- **Architecture Changes**: Implement caching, CDN, or microservices patterns
- **Infrastructure Scaling**: Auto-scaling policies and resource optimization
- **Monitoring Improvements**: Add more granular monitoring and alerting

## Documentation and Follow-up

### 13. Incident Documentation
\`\`\`markdown
# Performance Incident Report

## Summary
- **Date/Time**: [When the incident occurred]
- **Duration**: [How long the incident lasted]
- **Impact**: [What was affected and severity]

## Timeline
- **Detection**: [How and when was it detected]
- **Investigation**: [Key investigation steps]
- **Resolution**: [What fixed the issue]

## Root Cause
- **Primary Cause**: [Main reason for the performance issue]
- **Contributing Factors**: [Other factors that made it worse]

## Action Items
- [ ] Implement monitoring for early detection
- [ ] Optimize identified bottlenecks
- [ ] Update runbooks with new procedures
- [ ] Schedule performance testing
\`\`\`

### 14. Prevention Measures
- **Performance Testing**: Regular load and stress testing
- **Monitoring Enhancements**: Add SLI/SLO monitoring
- **Capacity Planning**: Proactive capacity planning
- **Code Reviews**: Performance-focused code reviews
- **Architecture Reviews**: Regular architecture assessments

## Tools and Commands Reference

### System Monitoring
\`\`\`bash
# CPU and memory
top, htop, ps aux
sar -u 1 10  # CPU usage
sar -r 1 10  # Memory usage

# Disk I/O
iostat -x 1
iotop
lsof +D /path

# Network
netstat -i
ss -tuln
iftop
nload

# Process analysis
strace -p PID
perf top -p PID
\`\`\`

### Application Debugging
\`\`\`bash
# Java applications
jstack PID  # Thread dump
jmap -histo PID  # Heap histogram
jstat -gc PID 1s  # GC statistics

# Node.js applications
node --inspect app.js
node --prof app.js

# Python applications
py-spy top --pid PID
python -m cProfile script.py
\`\`\`
    `,

    systemDiagnostics: `
# System Diagnostics Workflow

## System Health Check

### 1. Overall System Status
\`\`\`bash
# System uptime and load
uptime
w
who

# System information
uname -a
hostnamectl
lsb_release -a

# Hardware information
lscpu
lsmem
lsblk
lspci
lsusb
\`\`\`

### 2. Resource Utilization
\`\`\`bash
# CPU usage
top -n 1
htop
sar -u 1 5
mpstat 1 5

# Memory usage
free -h
cat /proc/meminfo
sar -r 1 5
ps aux --sort=-%mem | head -10

# Disk usage
df -h
du -sh /*
lsof +D /
iostat -x 1 5

# Network usage
netstat -i
ss -tuln
iftop
nload
\`\`\`

### 3. Process Analysis
\`\`\`bash
# Running processes
ps aux
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%cpu | head -10
pstree

# Process resource usage
top -p $(pgrep -d',' process-name)
ps -o pid,ppid,cmd,%mem,%cpu -p PID

# Process file descriptors
lsof -p PID
ls -la /proc/PID/fd/

# Process network connections
netstat -p | grep PID
ss -p | grep PID
\`\`\`

## Service Diagnostics

### 4. Service Status
\`\`\`bash
# Systemd services
systemctl status service-name
systemctl list-units --failed
systemctl list-units --type=service --state=running

# Service logs
journalctl -u service-name
journalctl -u service-name --since \"1 hour ago\"
journalctl -f -u service-name

# Service configuration
systemctl show service-name
systemctl cat service-name
\`\`\`

### 5. Application Logs
\`\`\`bash
# Common log locations
tail -f /var/log/syslog
tail -f /var/log/messages
tail -f /var/log/application.log

# Log analysis
grep -i error /var/log/application.log
grep -i \"out of memory\" /var/log/syslog
awk '/ERROR/ {print $0}' /var/log/application.log

# Log rotation status
logrotate -d /etc/logrotate.conf
ls -la /var/log/*.gz
\`\`\`

## Network Diagnostics

### 6. Network Connectivity
\`\`\`bash
# Basic connectivity
ping -c 5 google.com
ping -c 5 8.8.8.8
traceroute google.com
mtr --report google.com

# DNS resolution
nslookup google.com
dig google.com
host google.com

# Network interfaces
ip addr show
ifconfig
ethtool eth0
\`\`\`

### 7. Port and Service Connectivity
\`\`\`bash
# Port scanning
nmap -p 80,443 target-host
telnet target-host 80
nc -zv target-host 80

# Local port listening
netstat -tuln
ss -tuln
lsof -i :80

# Firewall status
ufw status
iptables -L
systemctl status firewalld
\`\`\`

## Storage Diagnostics

### 8. Disk Health
\`\`\`bash
# Disk space
df -h
du -sh /var/log/*
find / -type f -size +100M 2>/dev/null

# Disk I/O
iostat -x 1 5
iotop
lsof +D /var

# Disk errors
dmesg | grep -i error
cat /var/log/kern.log | grep -i error
sudo smartctl -a /dev/sda
\`\`\`

### 9. Filesystem Issues
\`\`\`bash
# Filesystem check
sudo fsck /dev/sda1
sudo e2fsck -f /dev/sda1

# Mount points
mount | column -t
cat /proc/mounts
findmnt

# Inode usage
df -i
find / -xdev -type f | cut -d \"/\" -f 2 | sort | uniq -c | sort -n
\`\`\`

## Security Diagnostics

### 10. Security Events
\`\`\`bash
# Authentication logs
tail -f /var/log/auth.log
grep -i \"failed\" /var/log/auth.log
grep -i \"invalid\" /var/log/auth.log

# Failed login attempts
lastb
faillog

# Active sessions
who
w
last
\`\`\`

### 11. File Permissions and Ownership
\`\`\`bash
# Permission issues
ls -la /path/to/file
stat /path/to/file
getfacl /path/to/file

# Find files with specific permissions
find / -perm 777 2>/dev/null
find / -perm +6000 2>/dev/null
find / -nouser -o -nogroup 2>/dev/null
\`\`\`

## Performance Diagnostics

### 12. System Performance
\`\`\`bash
# Load average analysis
uptime
cat /proc/loadavg
sar -q 1 5

# Context switches
vmstat 1 5
sar -w 1 5

# Interrupts
cat /proc/interrupts
sar -I SUM 1 5
\`\`\`

### 13. Memory Diagnostics
\`\`\`bash
# Memory usage breakdown
cat /proc/meminfo
free -h
ps aux --sort=-%mem | head -10

# Memory leaks
valgrind --leak-check=full ./your-program
top -o %MEM

# Swap usage
swapon -s
cat /proc/swaps
sar -S 1 5
\`\`\`

## Container Diagnostics

### 14. Docker Diagnostics
\`\`\`bash
# Container status
docker ps -a
docker stats
docker inspect container-name

# Container logs
docker logs container-name
docker logs -f container-name
docker logs --since "1 hour ago" container-name

# Check container limits
kubectl get pod your-pod-name -o yaml | grep -A 10 resources
\`\`\`

### 15. Kubernetes Diagnostics
\`\`\`bash
# Pod status
kubectl get pods -n your-namespace
kubectl describe pod your-pod-name
kubectl logs your-pod-name --previous

# Node status
kubectl get nodes
kubectl describe node your-node-name
kubectl top nodes

# Resource usage
kubectl top pods -n your-namespace
kubectl get events -n your-namespace --sort-by='.lastTimestamp'
\`\`\`

## Best Practices
1. **Regular Monitoring**: Implement automated health checks
2. **Log Rotation**: Ensure proper log rotation to prevent disk space issues
3. **Documentation**: Document all diagnostic procedures
4. **Automation**: Automate common diagnostic tasks
5. **Alerting**: Set up proactive alerting for critical issues
    `
  },

  // Security and Backup Templates
  securityAutomation: `
# Security Automation Scripts

## Vulnerability Scanning
\`\`\`bash
#!/bin/bash
# security-scan.sh

echo "Starting security scan..."

# Update vulnerability database
trivy image --download-db-only

# Scan container images
for image in $(docker images --format "{{.Repository}}:{{.Tag}}"); do
    echo "Scanning $image..."
    trivy image --severity HIGH,CRITICAL $image
done

# Generate report
trivy image --format json --output scan-report.json myapp:latest

echo "Security scan completed"
\`\`\`
    `,

  backupStrategy: `
# Comprehensive Backup Strategy

## Database Backup
\`\`\`bash
#!/bin/bash
# database-backup.sh

BACKUP_DIR="/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# PostgreSQL backup
pg_dump -h localhost -U postgres -d myapp > "$BACKUP_DIR/myapp_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/myapp_$DATE.sql"

# Upload to S3
aws s3 cp "$BACKUP_DIR/myapp_$DATE.sql.gz" s3://my-backups/database/

# Clean old backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: myapp_$DATE.sql.gz"
\`\`\`
    `
};

// Export individual prompt categories for easier access
export const {
  infrastructureAnalysis,
  deploymentGuides,
  monitoringSetup,
  troubleshootingWorkflows,
  securityAutomation,
  backupStrategy
} = DevOpsPrompts;