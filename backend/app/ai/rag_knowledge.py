from typing import List, Dict, Any

KNOWLEDGE_DOCS = [
    {
        "id": "KB-CIS-AWS-4.1",
        "title": "CIS AWS Benchmark 4.1: Restrict Security Group 0.0.0.0/0 Ingress",
        "category": "SECURITY",
        "content": (
            "Security groups provide stateful virtual firewalls for EC2 instances. Ingress rules specifying "
            "CIDR 0.0.0.0/0 on port 22 (SSH) or port 3389 (RDP) allow the entire internet to send TCP packets directly "
            "to host network interfaces. This exposes instances to automated password spraying, zero-day SSH exploits, "
            "and denial-of-service. Best practice: Restrict ingress to corporate office IP ranges, VPN bastions, "
            "or use AWS Systems Manager (SSM) Session Manager to eliminate inbound open ports entirely."
        )
    },
    {
        "id": "KB-CIS-AWS-2.1",
        "title": "CIS AWS Benchmark 2.1: S3 Bucket Public Access Block & Private ACL",
        "category": "SECURITY",
        "content": (
            "Amazon S3 buckets default to private, but legacy configurations or misapplied ACLs ('public-read' / 'public-read-write') "
            "open bucket contents to unauthenticated public queries. Remediation: Enforce aws_s3_bucket_public_access_block with "
            "block_public_acls=true, ignore_public_acls=true, block_public_policy=true, and restrict_public_buckets=true. "
            "Ensure AWS KMS customer managed keys (CMK) or AES256 server-side encryption is active."
        )
    },
    {
        "id": "KB-FINOPS-RIGHTSIZING",
        "title": "FinOps Foundation: EC2 Rightsizing & Graviton Migration Guide",
        "category": "COST_FINOPS",
        "content": (
            "Overprovisioning is the #1 driver of cloud waste. Development and staging environments frequently run large "
            "compute instances (e.g., m5.4xlarge, c5.4xlarge) where CPU utilization hovers below 15%. Migrating from x86 "
            "to AWS Graviton (t4g, c6g, r6g) delivers up to 40% better price-performance and cuts baseline hourly rates by "
            "20-50%. For batch or dev workloads, combine rightsizing with automated nightly shutdown schedules."
        )
    },
    {
        "id": "KB-FINOPS-STORAGE",
        "title": "FinOps Foundation: EBS Modernization gp2 vs gp3 and S3 Lifecycle",
        "category": "COST_FINOPS",
        "content": (
            "AWS introduced General Purpose SSD gp3 volumes to replace gp2. gp3 volumes are 20% cheaper per gigabyte "
            "($0.08/GB-month vs $0.10/GB-month in us-east-1) and include 3,000 baseline IOPS and 125 MB/s throughput regardless "
            "of volume size. Migrating gp2 to gp3 is an online operation with zero downtime. For S3, 60% of data is never accessed "
            "after 30 days; adding an automated lifecycle rule to transition objects to STANDARD_IA and GLACIER cuts storage spend by 68%."
        )
    },
    {
        "id": "KB-CIS-K8S-5.2",
        "title": "CIS Kubernetes Benchmark 5.2: Pod Security Standards & Isolation",
        "category": "SECURITY",
        "content": (
            "Privileged containers ('privileged: true') disable Linux namespaces and seccomp filtering, allowing container "
            "processes to interact directly with host hardware and devices, enabling trivial container escape to the host root shell. "
            "Additionally, running containers as UID 0 (root) allows attackers to overwrite system binaries. Enforce non-root execution "
            "with 'runAsNonRoot: true' and 'runAsUser: 10001', drop all capabilities with 'capDrop: [ALL]', and set read-only root filesystems."
        )
    },
    {
        "id": "KB-CWE-798-SECRETS",
        "title": "CWE-798: Use of Hard-coded Credentials in Infrastructure Code",
        "category": "SECRET_LEAK",
        "content": (
            "Hardcoding credentials (AWS Access Keys, GitHub Personal Access Tokens, JWT tokens, database passwords) in source "
            "repositories leads to catastrophic account takeovers. Automated scanners scrape GitHub commits within seconds. "
            "Remediation requires: 1) Immediate revocation of the exposed secret, 2) Rotating keys, 3) Injecting credentials dynamically "
            "using AWS Secrets Manager, HashiCorp Vault, or cloud IAM role federation (OIDC)."
        )
    }
]

def query_knowledge_base(query: str, category: str = None, top_k: int = 2) -> List[Dict[str, Any]]:
    query_words = set(query.lower().split())
    ranked = []
    for doc in KNOWLEDGE_DOCS:
        if category and doc["category"] != category:
            continue
        text = (doc["title"] + " " + doc["content"]).lower()
        score = sum(1 for w in query_words if w in text)
        ranked.append((score, doc))
    
    ranked.sort(key=lambda x: x[0], reverse=True)
    return [doc for score, doc in ranked[:top_k]]
