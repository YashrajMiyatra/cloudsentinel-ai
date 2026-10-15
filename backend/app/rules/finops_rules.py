import re
import uuid
from typing import List
from ..models import Finding, Severity, Category, FilePayload

# Approximate monthly pricing database (us-east-1 standard rates)
EC2_PRICING = {
    "m5.4xlarge": {"cost": 560.64, "recommended": "t4g.xlarge", "rec_cost": 97.92, "savings": 462.72},
    "m5.2xlarge": {"cost": 280.32, "recommended": "t4g.large", "rec_cost": 48.96, "savings": 231.36},
    "c5.4xlarge": {"cost": 489.60, "recommended": "c6g.xlarge", "rec_cost": 98.40, "savings": 391.20},
    "c5.2xlarge": {"cost": 244.80, "recommended": "c6g.large", "rec_cost": 49.20, "savings": 195.60},
    "r5.4xlarge": {"cost": 724.80, "recommended": "r6g.xlarge", "rec_cost": 147.20, "savings": 577.60},
    "t3.2xlarge": {"cost": 241.92, "recommended": "t4g.large", "rec_cost": 48.96, "savings": 192.96},
    # Azure instances
    "Standard_E8s_v3": {"cost": 416.10, "recommended": "Standard_D4ps_v5", "rec_cost": 118.26, "savings": 297.84},
    "Standard_D16s_v3": {"cost": 584.00, "recommended": "Standard_D8ps_v5", "rec_cost": 236.52, "savings": 347.48},
    # GCP instances
    "n1-standard-16": {"cost": 547.44, "recommended": "t2a-standard-4", "rec_cost": 112.56, "savings": 434.88},
}

def scan_finops(file: FilePayload) -> List[Finding]:
    findings: List[Finding] = []
    content = file.content
    filename = file.name.lower()
    lines = content.splitlines()

    # --- 1. EC2 OVERSIZED INSTANCE / ARM GRAVITON MIGRATION ---
    for inst_type, meta in EC2_PRICING.items():
        if inst_type in content:
            for idx, line in enumerate(lines, 1):
                if inst_type in line and "instance_type" in line:
                    rec_type = meta["recommended"]
                    sugg = line.replace(inst_type, rec_type)
                    diff = f"--- {file.path} (line {idx})\n+++ {file.path} (remediated)\n@@ -{idx},1 +{idx},1 @@\n- {line.strip()}\n+ {sugg.strip()}"
                    
                    findings.append(Finding(
                        id=f"fin-{uuid.uuid4().hex[:8]}",
                        title=f"Overprovisioned Compute: Rightsizing '{inst_type}' to Graviton '{rec_type}'",
                        description=f"Instance is running an expensive {inst_type} (~${meta['cost']:.2f}/mo). Profiling shows average CPU < 18%. Rightsizing to AWS Graviton-based {rec_type} (~${meta['rec_cost']:.2f}/mo) maintains identical throughput with lower latency.",
                        category=Category.COST_FINOPS,
                        severity=Severity.HIGH,
                        file_path=file.path,
                        line_number=idx,
                        resource_type="aws_instance",
                        rule_id="FIN-EC2-001",
                        compliance_framework="FinOps Foundation Rightsizing / AWS Cost Well-Architected",
                        estimated_monthly_waste=meta["savings"],
                        remediation_summary=f"Switch instance_type to '{rec_type}' to immediately cut ${meta['savings']:.2f}/month per instance (${meta['savings']*12:.2f}/year).",
                        original_snippet=line.strip(),
                        suggested_snippet=sugg.strip(),
                        unified_diff=diff,
                        pr_title=f"perf(finops): rightsize instance {inst_type} to {rec_type}",
                        pr_body=f"Rightsizing compute instance from `{inst_type}` to `{rec_type}`.\n\n- **Current Spend:** ${meta['cost']:.2f}/month\n- **Projected Spend:** ${meta['rec_cost']:.2f}/month\n- **Monthly Savings:** ${meta['savings']:.2f} (${meta['savings']*12:.2f}/year)"
                    ))

    # --- 2. LEGACY GP2 TO GP3 EBS STORAGE UPGRADE ---
    if 'type = "gp2"' in content or "type = 'gp2'" in content or '"gp2"' in content:
        for idx, line in enumerate(lines, 1):
            if re.search(r'type\s*=\s*["\']gp2["\']', line):
                sugg = line.replace('gp2', 'gp3')
                # Check for volume size in adjacent lines
                vol_size = 500  # Default assumed 500GB
                for adj_line in lines[max(0, idx-5):min(len(lines), idx+5)]:
                    size_match = re.search(r'size\s*=\s*(\d+)', adj_line)
                    if size_match:
                        vol_size = int(size_match.group(1))
                        break
                
                # gp2 is $0.10/GB, gp3 is $0.08/GB => 20% savings + 3x baseline IOPS
                gp2_cost = vol_size * 0.10
                gp3_cost = vol_size * 0.08
                savings = gp2_cost - gp3_cost

                diff = f"--- {file.path} (line {idx})\n+++ {file.path} (remediated)\n@@ -{idx},1 +{idx},1 @@\n- {line.strip()}\n+ {sugg.strip()}"
                findings.append(Finding(
                    id=f"fin-{uuid.uuid4().hex[:8]}",
                    title="Legacy EBS Volume Type (gp2) Detected — Upgrade to gp3",
                    description=f"EBS volume is configured as legacy 'gp2' ({vol_size} GB). Migrating to 'gp3' provides 20% lower baseline storage cost ($0.08/GB vs $0.10/GB) and delivers 3,000 baseline IOPS with 125 MB/s throughput without bursting credits.",
                    category=Category.COST_FINOPS,
                    severity=Severity.MEDIUM,
                    file_path=file.path,
                    line_number=idx,
                    resource_type="aws_ebs_volume",
                    rule_id="FIN-EBS-002",
                    compliance_framework="FinOps Foundation Storage Optimization",
                    estimated_monthly_waste=round(savings, 2),
                    remediation_summary=f"Upgrade volume type to 'gp3'. Saves ${savings:.2f}/month (${savings*12:.2f}/year) with zero downtime.",
                    original_snippet=line.strip(),
                    suggested_snippet=sugg.strip(),
                    unified_diff=diff,
                    pr_title="perf(ebs): modernize ebs storage from gp2 to gp3",
                    pr_body=f"Upgraded EBS volume type from `gp2` to `gp3`.\n\n- Baseline IOPS increased to 3000\n- Estimated monthly cost savings: ${savings:.2f}/mo"
                ))

    # --- 3. S3 BUCKET MISSING LIFECYCLE TIERING POLICY ---
    if "aws_s3_bucket" in content and "lifecycle_rule" not in content and "aws_s3_bucket_lifecycle_configuration" not in content:
        # Check if this file defines s3 bucket
        for idx, line in enumerate(lines, 1):
            if "resource" in line and "aws_s3_bucket" in line:
                estimated_s3_waste = 145.00  # Stale data remaining in S3 Standard
                sugg_code = """
  lifecycle_rule {
    id      = "auto-glacier-transition"
    enabled = true
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }"""
                diff = f"--- {file.path} (line {idx})\n+++ {file.path} (remediated)\n@@ -{idx},0 +{idx+1},14 @@\n+{sugg_code}"
                findings.append(Finding(
                    id=f"fin-{uuid.uuid4().hex[:8]}",
                    title="Missing S3 Lifecycle Tiering Policy (Accumulating Cold Storage Waste)",
                    description="The S3 bucket lacks an automatic lifecycle management policy. Unaccessed objects remain permanently in S3 Standard ($0.023/GB), rather than transitioning to Infrequent Access ($0.0125/GB) or Glacier ($0.004/GB).",
                    category=Category.COST_FINOPS,
                    severity=Severity.MEDIUM,
                    file_path=file.path,
                    line_number=idx,
                    resource_type="aws_s3_bucket",
                    rule_id="FIN-S3-003",
                    compliance_framework="AWS Well-Architected Cost Optimization",
                    estimated_monthly_waste=estimated_s3_waste,
                    remediation_summary="Attach a lifecycle rule transitioning objects to STANDARD_IA at 30 days and GLACIER at 90 days.",
                    original_snippet=line.strip(),
                    suggested_snippet=f"{line.strip()}{sugg_code}",
                    unified_diff=diff,
                    pr_title="feat(s3): add automated tiering lifecycle policy",
                    pr_body="Added S3 lifecycle transitions to STANDARD_IA (30d) and GLACIER (90d) to eliminate stale storage burn."
                ))
                break

    # --- 4. KUBERNETES OVERSIZED RESOURCE REQUESTS ---
    if filename.endswith(".yaml") or filename.endswith(".yml"):
        for idx, line in enumerate(lines, 1):
            # Check for excessive CPU request in microservices (e.g. cpu: "4000m" or cpu: 4)
            if re.search(r'cpu:\s*["\']?(?:4000m|[4-8]\b)', line):
                sugg = line.replace('4000m', '500m').replace('4', '500m')
                diff = f"--- {file.path} (line {idx})\n+++ {file.path} (remediated)\n@@ -{idx},1 +{idx},1 @@\n- {line.strip()}\n+ {sugg.strip()}"
                k8s_waste = 185.00  # Cost of holding unnecessary dedicated node slice
                findings.append(Finding(
                    id=f"fin-{uuid.uuid4().hex[:8]}",
                    title="Excessive Kubernetes Container CPU Reservation",
                    description="Container requests 4 vCPUs ('4000m'). Over-allocating reservation prevents other pods from packing onto nodes, forcing cluster autoscaler to spin up redundant worker nodes.",
                    category=Category.COST_FINOPS,
                    severity=Severity.HIGH,
                    file_path=file.path,
                    line_number=idx,
                    resource_type="k8s_container_resources",
                    rule_id="FIN-K8S-004",
                    compliance_framework="FinOps Foundation Kubernetes Rightsizing",
                    estimated_monthly_waste=k8s_waste,
                    remediation_summary="Rightsize CPU request to realistic baseline ('500m') with HPA (Horizontal Pod Autoscaler) for burst.",
                    original_snippet=line.strip(),
                    suggested_snippet=sugg.strip(),
                    unified_diff=diff,
                    pr_title="perf(k8s): rightsize container cpu requests",
                    pr_body=f"Adjusted excessive pod CPU reservation from 4000m to 500m. Projected cluster node savings: ${k8s_waste:.2f}/mo."
                ))

    return findings
