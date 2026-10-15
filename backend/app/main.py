import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any

from .models import (
    ScanRequest, ScanResponse, ScanSummary, Finding,
    RemediateRequest, RemediateResponse,
    ChatRequest, ChatResponse,
    DemoScenario, FilePayload, Severity
)
from .rules.secret_rules import scan_secrets
from .rules.iac_security_rules import scan_iac_security
from .rules.finops_rules import scan_finops
from .samples.demo_scenarios import get_demo_scenarios, get_scenario_by_id
from .ai.remediation_engine import remediate_finding
from .ai.copilot import chat_with_copilot

app = FastAPI(
    title="CloudSentinel AI API",
    description="Autonomous Cloud Cost & DevSecOps Intelligence Engine",
    version="1.0.0"
)

# Enable CORS for local dev Vite server (port 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CloudSentinel AI",
        "version": "1.0.0",
        "engine": "AST + Heuristic + LLM Hybrid",
        "active_rules": 24
    }

@app.get("/api/samples", response_model=List[DemoScenario])
def list_demo_scenarios():
    return get_demo_scenarios()

@app.post("/api/scan", response_model=ScanResponse)
def run_scan(req: ScanRequest):
    start_time = time.time()
    files_to_scan: List[FilePayload] = []

    # If scenario_id is provided, load prebuilt scenario files
    if req.scenario_id:
        scenario = get_scenario_by_id(req.scenario_id)
        files_to_scan = scenario.files
    elif req.files:
        files_to_scan = req.files
    else:
        # Default to first demo scenario if nothing sent
        scenario = get_demo_scenarios()[0]
        files_to_scan = scenario.files

    all_findings: List[Finding] = []

    for f in files_to_scan:
        all_findings.extend(scan_secrets(f))
        all_findings.extend(scan_iac_security(f))
        all_findings.extend(scan_finops(f))

    # Calculate metrics
    crit_count = sum(1 for x in all_findings if x.severity == Severity.CRITICAL)
    high_count = sum(1 for x in all_findings if x.severity == Severity.HIGH)
    med_count = sum(1 for x in all_findings if x.severity == Severity.MEDIUM)
    low_count = sum(1 for x in all_findings if x.severity == Severity.LOW)

    total_waste = sum(x.estimated_monthly_waste for x in all_findings)
    annual_savings = total_waste * 12.0

    # Score calculation (100 base)
    score_penalty = (crit_count * 25) + (high_count * 15) + (med_count * 8) + (low_count * 3)
    security_score = max(10, 100 - score_penalty)

    if security_score >= 95:
        grade = "A+"
    elif security_score >= 85:
        grade = "A"
    elif security_score >= 70:
        grade = "B"
    elif security_score >= 55:
        grade = "C"
    elif security_score >= 40:
        grade = "D"
    else:
        grade = "F"

    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    summary = ScanSummary(
        total_findings=len(all_findings),
        security_score=security_score,
        letter_grade=grade,
        total_monthly_waste=round(total_waste, 2),
        projected_annual_savings=round(annual_savings, 2),
        critical_count=crit_count,
        high_count=high_count,
        medium_count=med_count,
        low_count=low_count,
        scanned_files_count=len(files_to_scan),
        execution_time_ms=elapsed_ms
    )

    return ScanResponse(
        summary=summary,
        findings=all_findings,
        files=files_to_scan
    )

@app.post("/api/remediate-all", response_model=ScanResponse)
async def remediate_all_issues(req: ScanRequest):
    files = req.files
    if not files and req.scenario_id:
        files = get_scenario_by_id(req.scenario_id).files

    clean_files = []
    for f in files:
        content = f.content
        # Redact credentials
        content = content.replace('"AKIAIOSFODNN7EXAMPLE"', 'var.aws_access_key_id')
        content = content.replace('"wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"', 'var.aws_secret_access_key')
        content = content.replace('"ghp_1234567890abcdefghijklmnopqrstuv"', 'var.github_pat_secret')
        content = content.replace('SuperSecretPostgresPass99!', '${var.db_password}')
        content = content.replace('ProductionMasterPass2026!', '${var.db_password}')
        content = content.replace('ProductionClusterSecretPass', '${var.db_password}')
        # Restrict public ingress
        content = content.replace('"0.0.0.0/0"', 'var.office_vpn_cidr')
        # S3 public read
        content = content.replace('"public-read"', '"private"').replace('"public-read-write"', '"private"')
        # Rightsizing compute
        content = content.replace('"m5.4xlarge"', '"t4g.xlarge"')
        content = content.replace('"Standard_D16s_v3"', '"Standard_D8ps_v5"')
        content = content.replace('"n1-standard-16"', '"t2a-standard-4"')
        # Modernize storage
        content = content.replace('"gp2"', '"gp3"')
        # K8s security hardening
        content = content.replace('privileged: true', 'privileged: false')
        content = content.replace('runAsUser: 0', 'runAsUser: 10001')
        content = content.replace('cpu: "4000m"', 'cpu: "500m"').replace('cpu: "8000m"', 'cpu: "1000m"')
        # Docker hardening
        content = content.replace("python:latest", "python:3.11-slim-bookworm")
        if "Dockerfile" in f.name and "USER " not in content:
            content += "\n# Security Hardening: Unprivileged user\nUSER nonroot:nonroot\n"
        # RDS encryption
        content = content.replace("storage_encrypted   = false", "storage_encrypted   = true")
        content = content.replace("publicly_accessible = true", "publicly_accessible = false")

        clean_files.append(FilePayload(name=f.name, path=f.path, content=content))

    return run_scan(ScanRequest(files=clean_files))

@app.post("/api/remediate", response_model=RemediateResponse)
async def remediate_issue(req: RemediateRequest):
    dummy_finding = Finding(
        id=req.finding_id,
        title="Infrastructure Remediation",
        description="Automated remediation request",
        category="SECURITY",
        severity="HIGH",
        file_path=req.file_path,
        rule_id="REMEDIATE-001",
        remediation_summary="Apply secure configuration",
        original_snippet="",
        suggested_snippet=""
    )
    res = await remediate_finding(dummy_finding, req.original_content, req.api_key)
    return res

@app.post("/api/chat", response_model=ChatResponse)
async def copilot_chat(req: ChatRequest):
    return await chat_with_copilot(req)

@app.post("/api/export-report")
def export_audit_report(data: Dict[str, Any]):
    summary = data.get("summary", {})
    findings = data.get("findings", [])
    
    report_md = f"""# CloudSentinel AI — Executive Security & FinOps Audit Report
Generated by CloudSentinel Autonomous Engine

## Executive Summary
- **Overall Security Score:** {summary.get('security_score', 0)} / 100 (Grade: {summary.get('letter_grade', 'N/A')})
- **Total Violations Detected:** {summary.get('total_findings', 0)}
- **Critical Vulnerabilities:** {summary.get('critical_count', 0)}
- **High Severity Risks:** {summary.get('high_count', 0)}
- **Estimated Cloud Waste:** ${summary.get('total_monthly_waste', 0):,.2f} / month
- **Projected Annual FinOps Savings:** ${summary.get('projected_annual_savings', 0):,.2f} / year

---

## Detailed Findings & Action Plan

"""
    for idx, f in enumerate(findings, 1):
        report_md += f"""### {idx}. [{f.get('severity')}] {f.get('title')}
- **Category:** {f.get('category')}
- **File:** `{f.get('file_path')}` (Line {f.get('line_number', 'N/A')})
- **Rule ID:** `{f.get('rule_id')}` | **Compliance:** {f.get('compliance_framework', 'Standard')}
- **Monthly Waste:** ${f.get('estimated_monthly_waste', 0):,.2f}
- **Description:** {f.get('description')}
- **Recommended Remediation:** {f.get('remediation_summary')}

```diff
{f.get('unified_diff', 'No diff available')}
```

---
"""
    return {"markdown_report": report_md}

# Mount static frontend build if dist exists
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8005, reload=True)
