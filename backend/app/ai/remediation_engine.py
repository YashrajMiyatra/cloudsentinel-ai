import os
import difflib
import httpx
from typing import Dict, Any, Optional
from ..models import Finding, RemediateResponse
from .rag_knowledge import query_knowledge_base

def generate_unified_diff(original: str, modified: str, filepath: str) -> str:
    orig_lines = original.splitlines(keepends=True)
    mod_lines = modified.splitlines(keepends=True)
    diff = difflib.unified_diff(
        orig_lines,
        mod_lines,
        fromfile=f"a/{filepath}",
        tofile=f"b/{filepath}",
        lineterm=""
    )
    return "".join(diff)

async def remediate_finding(
    finding: Finding,
    original_file_content: str,
    api_key: Optional[str] = None
) -> RemediateResponse:
    # 1. Check if Gemini / LLM API key is provided either in request or environment
    llm_key = api_key or os.getenv("GEMINI_API_KEY")
    
    # Check if we should call live LLM
    if llm_key:
        try:
            return await _llm_remediate_finding(finding, original_file_content, llm_key)
        except Exception as e:
            print(f"[RemediationEngine] LLM invocation failed, falling back to heuristic engine: {e}")

    # 2. Heuristic / AST Deterministic Remediation Engine
    file_lines = original_file_content.splitlines()
    patched_lines = list(file_lines)

    # Apply fix according to finding rule
    if finding.rule_id == "CIS-AWS-4.1":
        # Replace 0.0.0.0/0
        patched_lines = [line.replace('"0.0.0.0/0"', 'var.office_vpn_cidr') for line in patched_lines]
    elif finding.rule_id == "CIS-AWS-2.1.1":
        # S3 ACL public-read
        patched_lines = [line.replace('"public-read"', '"private"').replace('"public-read-write"', '"private"') for line in patched_lines]
    elif finding.rule_id.startswith("FIN-EC2"):
        # Instance rightsizing
        for inst in ["m5.4xlarge", "m5.2xlarge", "c5.4xlarge", "c5.2xlarge", "r5.4xlarge", "t3.2xlarge"]:
            if inst in original_file_content:
                rec = "t4g.xlarge" if "m5" in inst or "t3" in inst else ("c6g.xlarge" if "c5" in inst else "r6g.xlarge")
                patched_lines = [line.replace(f'"{inst}"', f'"{rec}"') for line in patched_lines]
    elif finding.rule_id == "FIN-EBS-002":
        patched_lines = [line.replace('"gp2"', '"gp3"') for line in patched_lines]
    elif finding.rule_id.startswith("SEC-"):
        # Redact secrets
        if "AKIA" in original_file_content:
            patched_lines = [line.replace('"AKIAIOSFODNN7EXAMPLE"', 'var.aws_access_key_id') for line in patched_lines]
        if "wJalrXUtnFEMI" in original_file_content:
            patched_lines = [line.replace('"wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"', 'var.aws_secret_access_key') for line in patched_lines]
        if "ghp_" in original_file_content:
            patched_lines = [line.replace('"ghp_1234567890abcdefghijklmnopqrstuv"', 'var.github_pat_secret') for line in patched_lines]
        if "postgres://" in original_file_content:
            patched_lines = [line.replace('SuperSecretPostgresPass99!', '${var.db_password}') for line in patched_lines]
    elif finding.rule_id == "CIS-K8S-5.2.1":
        patched_lines = [line.replace('privileged: true', 'privileged: false') for line in patched_lines]
    elif finding.rule_id == "CIS-K8S-5.2.6":
        patched_lines = [line.replace('runAsUser: 0', 'runAsUser: 10001') for line in patched_lines]
    elif finding.rule_id == "FIN-K8S-004":
        patched_lines = [line.replace('cpu: "4000m"', 'cpu: "500m"').replace('cpu: "8000m"', 'cpu: "1000m"') for line in patched_lines]
    elif finding.rule_id == "DOCKER-CIS-4.1":
        patched_lines.append("\n# Security hardening: Run as unprivileged user\nRUN addgroup -S appgroup && adduser -S appuser -G appgroup\nUSER appuser")
    elif finding.rule_id == "DOCKER-CIS-4.2":
        patched_lines = [line.replace("python:latest", "python:3.11-slim-bookworm") for line in patched_lines]
    else:
        # Fallback replacement based on snippet
        patched_content = original_file_content.replace(finding.original_snippet, finding.suggested_snippet)
        patched_lines = patched_content.splitlines()

    patched_content = "\n".join(patched_lines)
    diff = generate_unified_diff(original_file_content, patched_content, finding.file_path)

    kb_context = query_knowledge_base(finding.title, top_k=1)
    kb_explanation = kb_context[0]["content"] if kb_context else finding.description

    return RemediateResponse(
        finding_id=finding.id,
        file_path=finding.file_path,
        patched_content=patched_content,
        unified_diff=diff or finding.unified_diff or "No changes detected",
        explanation=f"### Security & FinOps Assessment\n{finding.description}\n\n### CIS Benchmark & Architecture Guidance\n{kb_explanation}\n\n### Applied Fix\n{finding.remediation_summary}",
        pr_title=finding.pr_title or f"fix({finding.category.value.lower()}): remediate {finding.rule_id}",
        pr_body=finding.pr_body or f"Auto-generated patch by CloudSentinel AI for {finding.title}."
    )

async def _llm_remediate_finding(finding: Finding, original_content: str, api_key: str) -> RemediateResponse:
    prompt = f"""You are an elite DevSecOps & FinOps architect at a Fortune 500 tech firm.
Please remediate this critical infrastructure issue:
Title: {finding.title}
Rule ID: {finding.rule_id}
File Path: {finding.file_path}
Finding Details: {finding.description}
Current file content:
```
{original_content}
```

Respond with:
1. The complete remediated file content.
2. A short bulleted explanation of why this fix is best practice.
3. A concise GitHub PR title and PR description.
"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        res = await client.post(
            url,
            json={"contents": [{"parts": [{"text": prompt}]}]}
        )
        if res.status_code == 200:
            data = res.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            # Extract content
            lines = text.splitlines()
            code_block = []
            in_code = False
            for line in lines:
                if line.startswith("```"):
                    in_code = not in_code
                    continue
                if in_code:
                    code_block.append(line)
            
            patched_code = "\n".join(code_block) if code_block else original_content
            diff = generate_unified_diff(original_content, patched_code, finding.file_path)
            
            return RemediateResponse(
                finding_id=finding.id,
                file_path=finding.file_path,
                patched_content=patched_code,
                unified_diff=diff,
                explanation=text,
                pr_title=f"fix(infra): autonomous patch for {finding.rule_id}",
                pr_body=f"Autonomous patch generated via CloudSentinel AI LLM reasoning for `{finding.title}`."
            )
        else:
            raise Exception(f"Gemini API returned status {res.status_code}: {res.text}")
