import re
import uuid
from typing import List
from ..models import Finding, Severity, Category, FilePayload

SECRET_PATTERNS = [
    {
        "id": "SEC-001",
        "title": "Hardcoded AWS Access Key ID Detected",
        "regex": r"(?i)(?:aws_access_key_id|aws_key|access_key)\s*[:=]\s*[\"'](AKIA[0-9A-Z]{16})[\"']",
        "severity": Severity.CRITICAL,
        "description": "An active AWS Access Key ID was committed directly into the configuration. Anyone with read access can authenticate to your AWS account.",
        "remediation": "Move credentials to an external Secrets Manager or inject via environment variables (e.g. AWS_ACCESS_KEY_ID)."
    },
    {
        "id": "SEC-002",
        "title": "Exposed AWS Secret Access Key",
        "regex": r"(?i)(?:aws_secret_access_key|aws_secret|secret_key)\s*[:=]\s*[\"']([A-Za-z0-9/+=]{40})[\"']",
        "severity": Severity.CRITICAL,
        "description": "AWS Secret Access Key is hardcoded. Immediate credential rotation is required.",
        "remediation": "Revoke this key in IAM console and replace with IAM Roles for Service Accounts (IRSA) or instance profiles."
    },
    {
        "id": "SEC-003",
        "title": "Hardcoded GitHub Personal Access Token",
        "regex": r"(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})",
        "severity": Severity.CRITICAL,
        "description": "GitHub Personal Access Token found. Risk of unauthorized source code access or supply chain contamination.",
        "remediation": "Revoke the token on GitHub immediately and use GitHub Actions secrets or OIDC federated auth."
    },
    {
        "id": "SEC-004",
        "title": "Unencrypted Private Key Block in File",
        "regex": r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----",
        "severity": Severity.CRITICAL,
        "description": "Private cryptographic key block stored in plain text.",
        "remediation": "Never commit private keys to version control. Use HashiCorp Vault, AWS KMS, or sealed secrets."
    },
    {
        "id": "SEC-005",
        "title": "Plaintext Database Credentials in Connection String",
        "regex": r"(?i)(?:postgres|mysql|mongodb(?:\+srv)?):\/\/[a-zA-Z0-9_-]+:([^@\s\"']+)@[a-zA-Z0-9.-]+",
        "severity": Severity.HIGH,
        "description": "Database URI contains plain text password. Risk of lateral movement and data breach.",
        "remediation": "Reference credentials via dynamic secrets or parameter store (e.g., ${DB_USER}:${DB_PASSWORD})."
    },
    {
        "id": "SEC-006",
        "title": "Hardcoded JWT Token or Bearer Token",
        "regex": r"ey[A-Za-z0-9_-]{10,}\.ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}",
        "severity": Severity.HIGH,
        "description": "Hardcoded JSON Web Token detected with session/claims information.",
        "remediation": "Do not hardcode auth tokens in manifests; generate short-lived tokens dynamically at runtime."
    }
]

def scan_secrets(file: FilePayload) -> List[Finding]:
    findings: List[Finding] = []
    lines = file.content.splitlines()

    for pattern in SECRET_PATTERNS:
        regex = re.compile(pattern["regex"])
        for idx, line in enumerate(lines, 1):
            match = regex.search(line)
            if match:
                # Mask sensitive portion in snippet
                matched_val = match.group(0)
                masked_line = line.replace(match.group(1) if match.groups() else matched_val, "[REDACTED_SECRET]")
                
                # Create replacement recommendation
                if "aws" in pattern["id"].lower() or "aws" in line.lower():
                    suggested_line = re.sub(r'["\'].*?["\']', 'var.aws_credentials_secret', line)
                elif "postgres" in line.lower() or "mysql" in line.lower() or "mongo" in line.lower():
                    suggested_line = re.sub(r':([^@\s"\']+)@', ':${var.db_password}@', line)
                else:
                    suggested_line = re.sub(r'["\'].*?["\']', 'var.api_secret_key', line)

                diff = f"--- {file.path} (line {idx})\n+++ {file.path} (remediated)\n@@ -{idx},1 +{idx},1 @@\n- {line.strip()}\n+ {suggested_line.strip()}"

                finding = Finding(
                    id=f"sec-{uuid.uuid4().hex[:8]}",
                    title=pattern["title"],
                    description=pattern["description"],
                    category=Category.SECRET_LEAK,
                    severity=pattern["severity"],
                    file_path=file.path,
                    line_number=idx,
                    line_end=idx,
                    resource_type="Secret/Credential",
                    rule_id=pattern["id"],
                    cve_id="CWE-798",
                    compliance_framework="SOC2 / CIS AWS 1.4 / PCI-DSS 3.4",
                    estimated_monthly_waste=0.0,
                    remediation_summary=pattern["remediation"],
                    original_snippet=line.strip(),
                    suggested_snippet=suggested_line.strip(),
                    unified_diff=diff,
                    pr_title=f"fix(security): redact and externalize {pattern['title']}",
                    pr_body=f"Automated remediation by CloudSentinel AI.\n\n### Issue\n{pattern['description']}\n\n### Fix Applied\nReplaced hardcoded credential with dynamic secret reference at line {idx}."
                )
                findings.append(finding)

    return findings
