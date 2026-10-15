import re
import uuid
from typing import List
from ..models import Finding, Severity, Category, FilePayload

def scan_iac_security(file: FilePayload) -> List[Finding]:
    findings: List[Finding] = []
    content = file.content
    filename = file.name.lower()
    lines = content.splitlines()

    # --- 1. TERRAFORM CHECKS ---
    if filename.endswith(".tf") or "resource" in content:
        # Check: 0.0.0.0/0 Ingress on sensitive ports (SSH 22, RDP 3389, Database 5432/3306)
        if "0.0.0.0/0" in content:
            for idx, line in enumerate(lines, 1):
                if "0.0.0.0/0" in line:
                    # Check enclosing block in preceding lines
                    preceding = "\n".join(lines[max(0, idx-8):idx])
                    if "egress" in preceding and "ingress" not in preceding:
                        continue # Skip standard outbound egress
                    window = "\n".join(lines[max(0, idx-6):min(len(lines), idx+6)])
                    is_ssh = "22" in window
                    is_rdp = "3389" in window
                    port_str = "SSH (22)" if is_ssh else ("RDP (3389)" if is_rdp else "all traffic")

                    orig_chunk = line.strip()
                    sugg_chunk = line.replace('"0.0.0.0/0"', 'var.office_vpn_cidr')

                    diff = f"--- {file.path} (line {idx})\n+++ {file.path} (remediated)\n@@ -{idx},1 +{idx},1 @@\n- {orig_chunk}\n+ {sugg_chunk.strip()}"

                    findings.append(Finding(
                        id=f"iac-{uuid.uuid4().hex[:8]}",
                        title=f"Unrestricted Inbound Access (0.0.0.0/0) to {port_str}",
                        description=f"Security Group allows unrestricted ingress from the entire public internet ('0.0.0.0/0') on {port_str}. Exposes internal assets directly to automated botnets and brute-force attacks.",
                        category=Category.SECURITY,
                        severity=Severity.CRITICAL if (is_ssh or is_rdp) else Severity.HIGH,
                        file_path=file.path,
                        line_number=idx,
                        resource_type="aws_security_group",
                        rule_id="CIS-AWS-4.1",
                        cve_id="CWE-284",
                        compliance_framework="CIS AWS Foundations 1.4 / SOC2 CC6.6",
                        estimated_monthly_waste=0.0,
                        remediation_summary="Restrict ingress CIDR to your specific corporate VPN or bastion IP subnet.",
                        original_snippet=orig_chunk,
                        suggested_snippet=sugg_chunk.strip(),
                        unified_diff=diff,
                        pr_title="fix(terraform): restrict open security group ingress CIDR",
                        pr_body="Replaced `0.0.0.0/0` public CIDR with restricted corporate VPN subnet `var.office_vpn_cidr`."
                    ))

        # Check: Public S3 Bucket ACL
        for idx, line in enumerate(lines, 1):
            if re.search(r'acl\s*=\s*["\']public-(?:read|read-write)["\']', line, re.I):
                sugg = line.replace('public-read', 'private').replace('public-read-write', 'private')
                diff = f"--- {file.path} (line {idx})\n+++ {file.path} (remediated)\n@@ -{idx},1 +{idx},1 @@\n- {line.strip()}\n+ {sugg.strip()}"
                findings.append(Finding(
                    id=f"iac-{uuid.uuid4().hex[:8]}",
                    title="Publicly Accessible S3 Bucket ACL",
                    description="The S3 bucket is configured with a public read or write ACL. This violates cloud storage isolation and can leak confidential corporate data.",
                    category=Category.SECURITY,
                    severity=Severity.CRITICAL,
                    file_path=file.path,
                    line_number=idx,
                    resource_type="aws_s3_bucket",
                    rule_id="CIS-AWS-2.1.1",
                    compliance_framework="CIS AWS Foundations 1.4 / HIPAA / PCI-DSS",
                    estimated_monthly_waste=0.0,
                    remediation_summary="Change bucket ACL to 'private' and attach an explicit aws_s3_bucket_public_access_block.",
                    original_snippet=line.strip(),
                    suggested_snippet=sugg.strip(),
                    unified_diff=diff,
                    pr_title="fix(s3): enforce private ACL on storage bucket",
                    pr_body="Changed S3 bucket ACL from public to `private`."
                ))

        # Check: Over-permissive IAM Policy (Wildcard Action + Wildcard Resource)
        if '"Action": "*"' in content or 'Action = ["*"]' in content or '"*"' in content:
            for idx, line in enumerate(lines, 1):
                if re.search(r'Action\s*=\s*\[\s*["\']\*["\']\s*\]|"Action":\s*"\*"', line):
                    sugg = '      Action = ["s3:GetObject", "s3:PutObject"] # Least-privilege scoped'
                    diff = f"--- {file.path} (line {idx})\n+++ {file.path} (remediated)\n@@ -{idx},1 +{idx},1 @@\n- {line.strip()}\n+ {sugg.strip()}"
                    findings.append(Finding(
                        id=f"iac-{uuid.uuid4().hex[:8]}",
                        title="Wildcard Administrative Privileges in IAM Policy",
                        description="IAM Policy grants blanket administrator privileges (`Action: *` on `Resource: *`). Violates the Principle of Least Privilege (PoLP).",
                        category=Category.SECURITY,
                        severity=Severity.HIGH,
                        file_path=file.path,
                        line_number=idx,
                        resource_type="aws_iam_policy",
                        rule_id="CIS-AWS-1.16",
                        compliance_framework="CIS AWS 1.4 / AWS Well-Architected Security",
                        estimated_monthly_waste=0.0,
                        remediation_summary="Scope permissions down to the explicit actions required by the workload.",
                        original_snippet=line.strip(),
                        suggested_snippet=sugg.strip(),
                        unified_diff=diff,
                        pr_title="fix(iam): scope wildcard permissions to least privilege actions",
                        pr_body="Replaced blanket `*` actions with strictly scoped S3 read/write actions."
                    ))

        # Check: Unencrypted Database (RDS)
        for idx, line in enumerate(lines, 1):
            if re.search(r'storage_encrypted\s*=\s*false', line, re.I):
                sugg = line.replace('false', 'true')
                diff = f"--- {file.path} (line {idx})\n+++ {file.path} (remediated)\n@@ -{idx},1 +{idx},1 @@\n- {line.strip()}\n+ {sugg.strip()}"
                findings.append(Finding(
                    id=f"iac-{uuid.uuid4().hex[:8]}",
                    title="Database Storage Encryption Disabled",
                    description="RDS instance has `storage_encrypted = false`. Data at rest is unencrypted and vulnerable if physical underlying media is compromised.",
                    category=Category.COMPLIANCE,
                    severity=Severity.HIGH,
                    file_path=file.path,
                    line_number=idx,
                    resource_type="aws_db_instance",
                    rule_id="CIS-AWS-2.3.1",
                    compliance_framework="SOC2 CC6.1 / HIPAA 164.312",
                    estimated_monthly_waste=0.0,
                    remediation_summary="Enable KMS storage encryption: `storage_encrypted = true`.",
                    original_snippet=line.strip(),
                    suggested_snippet=sugg.strip(),
                    unified_diff=diff,
                    pr_title="fix(rds): enable KMS storage encryption at rest",
                    pr_body="Enabled `storage_encrypted = true`."
                ))

    # --- 2. KUBERNETES CHECKS ---
    if filename.endswith(".yaml") or filename.endswith(".yml"):
        # Privileged container
        for idx, line in enumerate(lines, 1):
            if re.search(r'privileged:\s*true', line, re.I):
                sugg = line.replace('true', 'false')
                diff = f"--- {file.path} (line {idx})\n+++ {file.path} (remediated)\n@@ -{idx},1 +{idx},1 @@\n- {line.strip()}\n+ {sugg.strip()}"
                findings.append(Finding(
                    id=f"iac-{uuid.uuid4().hex[:8]}",
                    title="Kubernetes Container Running with Privileged Flag",
                    description="Container has `privileged: true`. This allows container escape, granting root access to the underlying Kubernetes node kernel.",
                    category=Category.SECURITY,
                    severity=Severity.CRITICAL,
                    file_path=file.path,
                    line_number=idx,
                    resource_type="k8s_pod_security_context",
                    rule_id="CIS-K8S-5.2.1",
                    compliance_framework="CIS Kubernetes 1.6 / NSA Hardening Guide",
                    estimated_monthly_waste=0.0,
                    remediation_summary="Disable privileged mode and explicitly specify Linux capabilities required via `capAdd`/`capDrop`.",
                    original_snippet=line.strip(),
                    suggested_snippet=sugg.strip(),
                    unified_diff=diff,
                    pr_title="fix(k8s): remove privileged execution flag from container",
                    pr_body="Set `securityContext.privileged: false` to enforce container isolation."
                ))

            # Running as root in K8s
            if re.search(r'runAsUser:\s*0\b', line):
                sugg = line.replace('0', '10001')
                diff = f"--- {file.path} (line {idx})\n+++ {file.path} (remediated)\n@@ -{idx},1 +{idx},1 @@\n- {line.strip()}\n+ {sugg.strip()}"
                findings.append(Finding(
                    id=f"iac-{uuid.uuid4().hex[:8]}",
                    title="Container Configured to Run as Root (UID 0)",
                    description="`runAsUser: 0` forces container processes to run as root. Any compromised process can modify root-owned system binaries.",
                    category=Category.SECURITY,
                    severity=Severity.HIGH,
                    file_path=file.path,
                    line_number=idx,
                    resource_type="k8s_security_context",
                    rule_id="CIS-K8S-5.2.6",
                    compliance_framework="CIS Kubernetes 1.6",
                    estimated_monthly_waste=0.0,
                    remediation_summary="Configure container to run with an unprivileged UID (e.g. `runAsUser: 10001`).",
                    original_snippet=line.strip(),
                    suggested_snippet=sugg.strip(),
                    unified_diff=diff,
                    pr_title="fix(k8s): enforce non-root user execution",
                    pr_body="Switched `runAsUser` from UID 0 (root) to unprivileged UID 10001."
                ))

    # --- 3. DOCKERFILE CHECKS ---
    if "dockerfile" in filename or "FROM " in content:
        has_user = any(line.strip().startswith("USER ") for line in lines)
        if not has_user and len(lines) > 2:
            last_line_idx = len(lines)
            sugg_user = "USER nonroot:nonroot"
            diff = f"--- {file.path}\n+++ {file.path} (remediated)\n@@ -{last_line_idx},0 +{last_line_idx+1},2 @@\n+ RUN adduser -D nonroot\n+ USER nonroot"
            findings.append(Finding(
                id=f"iac-{uuid.uuid4().hex[:8]}",
                title="Missing USER Instruction in Dockerfile (Default Root Execution)",
                description="Dockerfile does not specify a non-root USER instruction. The container process defaults to running as root, increasing blast radius upon remote code execution.",
                category=Category.SECURITY,
                severity=Severity.HIGH,
                file_path=file.path,
                line_number=last_line_idx,
                resource_type="Dockerfile",
                rule_id="DOCKER-CIS-4.1",
                compliance_framework="CIS Docker Benchmark 1.2 / OCI Best Practices",
                estimated_monthly_waste=0.0,
                remediation_summary="Create an unprivileged user and switch to it before the ENTRYPOINT or CMD instruction.",
                original_snippet="# End of Dockerfile (No USER instruction present)",
                suggested_snippet="RUN adduser -D nonroot\nUSER nonroot",
                unified_diff=diff,
                pr_title="fix(docker): run container as nonroot user",
                pr_body="Added unprivileged user and `USER nonroot` directive to Dockerfile."
            ))

        # Check for :latest tag in FROM
        for idx, line in enumerate(lines, 1):
            if line.strip().startswith("FROM ") and (":latest" in line or (":" not in line and "@" not in line and "as " not in line.lower())):
                image_parts = line.strip().split()
                if len(image_parts) >= 2:
                    base_img = image_parts[1].split(":")[0]
                    sugg = line.replace(":latest", ":3.18-alpine").replace(base_img, f"{base_img}:3.18-alpine") if ":latest" not in line else line.replace(":latest", ":3.18-alpine")
                    diff = f"--- {file.path} (line {idx})\n+++ {file.path} (remediated)\n@@ -{idx},1 +{idx},1 @@\n- {line.strip()}\n+ {sugg.strip()}"
                    findings.append(Finding(
                        id=f"iac-{uuid.uuid4().hex[:8]}",
                        title="Unpinned / Mutable Base Image Tag in Dockerfile",
                        description=f"Using ':latest' or untagged base image `{image_parts[1]}` introduces non-deterministic builds and supply-chain drift.",
                        category=Category.COMPLIANCE,
                        severity=Severity.MEDIUM,
                        file_path=file.path,
                        line_number=idx,
                        resource_type="Dockerfile",
                        rule_id="DOCKER-CIS-4.2",
                        compliance_framework="CIS Docker Benchmark 1.2",
                        estimated_monthly_waste=0.0,
                        remediation_summary="Pin your base image to an immutable version tag or SHA256 digest.",
                        original_snippet=line.strip(),
                        suggested_snippet=sugg.strip(),
                        unified_diff=diff,
                        pr_title="fix(docker): pin immutable base image tag",
                        pr_body="Replaced mutable `:latest` tag with pinned immutable version tag."
                    ))

    return findings
