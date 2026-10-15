from typing import List
from ..models import DemoScenario, FilePayload

TERRAFORM_SAMPLE = """terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region     = "us-east-1"
  # VULNERABILITY: Hardcoded AWS Credentials
  access_key = "AKIAIOSFODNN7EXAMPLE"
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}

# VULNERABILITY: Security Group open to the entire world on SSH
resource "aws_security_group" "dev_bastion_sg" {
  name        = "dev-bastion-sg"
  description = "Allow inbound SSH access from developers"

  ingress {
    description = "Public SSH Access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # HIGH RISK: Open to 0.0.0.0/0
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# FINOPS WASTE: Oversized instance type for dev environment (CPU usage avg < 10%)
resource "aws_instance" "dev_backend_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "m5.4xlarge" # COST WASTE: $560.64/mo! Should rightsize to t4g.xlarge
  
  vpc_security_group_ids = [aws_security_group.dev_bastion_sg.id]

  # FINOPS WASTE: Legacy gp2 volume (1000 GB)
  root_block_device {
    volume_type = "gp2"
    volume_size = 1000 # gp2 is 20% more expensive than gp3
  }

  tags = {
    Environment = "development"
    Team        = "Core-API"
  }
}

# VULNERABILITY & FINOPS: Public S3 bucket without lifecycle tiering policy
resource "aws_s3_bucket" "company_customer_assets" {
  bucket = "prod-corp-data-lake-unrestricted"
  acl    = "public-read" # CRITICAL: Publicly readable corporate assets

  tags = {
    DataClassification = "Confidential"
  }
}

# VULNERABILITY: Unencrypted RDS database exposed publicly
resource "aws_db_instance" "customer_rds" {
  allocated_storage   = 100
  engine              = "postgres"
  instance_class      = "db.t3.medium"
  username            = "postgres"
  password            = "ProductionMasterPass2026!" # Plaintext DB secret
  publicly_accessible = true
  storage_encrypted   = false # COMPLIANCE VIOLATION: Unencrypted storage at rest
}
"""

KUBERNETES_SAMPLE = """apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-processing-service
  namespace: production
  labels:
    app: order-processor
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-processor
  template:
    metadata:
      labels:
        app: order-processor
    spec:
      containers:
      - name: processor
        image: company/order-engine:v1.2.0
        # VULNERABILITY: Container escape risk with privileged flag
        securityContext:
          privileged: true
          runAsUser: 0 # VULNERABILITY: Running container as root UID 0
        
        # FINOPS WASTE: Over-allocated CPU requests forcing cluster node expansion
        resources:
          requests:
            cpu: "4000m" # Excessive 4 cores for lightweight microservice
            memory: "8Gi"
          limits:
            cpu: "8000m"
            memory: "16Gi"
            
        env:
        - name: DATABASE_URL
          value: "postgres://dbadmin:SuperSecretPostgresPass99!@db.internal:5432/orders"
        - name: JWT_AUTH_TOKEN
          value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFVzZXIiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
"""

DOCKERFILE_SAMPLE = """# VULNERABILITY: Unpinned base image tag
FROM python:latest

WORKDIR /app

# VULNERABILITY: Leaked secret in build ARG
ARG GITHUB_ACCESS_TOKEN="ghp_1234567890abcdefghijklmnopqrstuv"
ENV DB_CONNECTION_STRING="mongodb+srv://admin:ProductionClusterSecretPass@cluster0.mongodb.net/app"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

# VULNERABILITY: Missing non-root USER instruction (Defaults to root execution)
CMD ["python", "app.py"]
"""

DEMO_SCENARIOS: List[DemoScenario] = [
    DemoScenario(
        id="aws-cloud-sprawl",
        title="Enterprise AWS Cloud Sprawl & IaC Vulnerabilities",
        description="A real-world Terraform infrastructure with hardcoded AWS keys, 0.0.0.0/0 SSH open to the internet, oversized m5.4xlarge compute, and public S3 bucket.",
        badge="High Severity",
        tags=["Terraform", "AWS", "FinOps Waste", "Leaked Secrets"],
        files=[
            FilePayload(
                name="main.tf",
                path="terraform/aws/main.tf",
                content=TERRAFORM_SAMPLE
            )
        ]
    ),
    DemoScenario(
        id="k8s-production-risk",
        title="Production Kubernetes Cluster Vulnerabilities & Node Overbilling",
        description="Kubernetes deployment running as root with privileged container flag, 4000m overprovisioned CPU request, and hardcoded JWT / database tokens.",
        badge="Critical Risk",
        tags=["Kubernetes", "Container Security", "FinOps Waste", "K8s CIS"],
        files=[
            FilePayload(
                name="deployment.yaml",
                path="k8s/production/deployment.yaml",
                content=KUBERNETES_SAMPLE
            )
        ]
    ),
    DemoScenario(
        id="azure-cloud-sprawl",
        title="Microsoft Azure Infrastructure Sprawl & Open RDP",
        description="Azure Resource Manager Terraform with oversized Standard_D16s_v3 VM, unencrypted Storage Account, and open RDP port 3389 to internet.",
        badge="Multi-Cloud",
        tags=["Azure", "Terraform", "FinOps Waste", "Open RDP"],
        files=[
            FilePayload(
                name="azure_infra.tf",
                path="terraform/azure/main.tf",
                content="""# Azure Resource Group & Oversized VM
resource "azurerm_resource_group" "rg" {
  name     = "rg-dev-enterprise"
  location = "eastus"
}

# FINOPS WASTE: Standard_D16s_v3 costs $584.00/mo! Rightsizing saves $347.48/mo
resource "azurerm_virtual_machine" "dev_vm" {
  name                  = "vm-dev-worker"
  location              = azurerm_resource_group.rg.location
  resource_group_name   = azurerm_resource_group.rg.name
  vm_size               = "Standard_D16s_v3"
}

# VULNERABILITY: Open RDP (3389) to the entire world
resource "azurerm_network_security_rule" "rdp_rule" {
  name                        = "Allow-RDP-All"
  priority                    = 100
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  destination_port_range      = "3389"
  source_address_prefix       = "0.0.0.0/0" # HIGH RISK
}
"""
            )
        ]
    ),
    DemoScenario(
        id="docker-supply-chain",
        title="Dockerfile Secret Leak & Root Execution",
        description="A container image utilizing mutable ':latest' tags, hardcoded GitHub tokens and MongoDB connection strings, and lacking non-root user separation.",
        badge="Secret Exposure",
        tags=["Docker", "Supply Chain", "Secrets", "CWE-798"],
        files=[
            FilePayload(
                name="Dockerfile",
                path="services/api/Dockerfile",
                content=DOCKERFILE_SAMPLE
            )
        ]
    )
]

def get_demo_scenarios() -> List[DemoScenario]:
    return DEMO_SCENARIOS

def get_scenario_by_id(scenario_id: str) -> DemoScenario:
    for s in DEMO_SCENARIOS:
        if s.id == scenario_id:
            return s
    return DEMO_SCENARIOS[0]
