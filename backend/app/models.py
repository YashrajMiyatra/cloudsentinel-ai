from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

class Category(str, Enum):
    SECURITY = "SECURITY"
    COST_FINOPS = "COST_FINOPS"
    SECRET_LEAK = "SECRET_LEAK"
    COMPLIANCE = "COMPLIANCE"

class Finding(BaseModel):
    id: str
    title: str
    description: str
    category: Category
    severity: Severity
    file_path: str
    line_number: Optional[int] = None
    line_end: Optional[int] = None
    resource_type: str = "Infrastructure"
    rule_id: str
    cve_id: Optional[str] = None
    compliance_framework: Optional[str] = "CIS Benchmark / FinOps"
    estimated_monthly_waste: float = 0.0  # In USD
    remediation_summary: str
    original_snippet: str
    suggested_snippet: str
    unified_diff: Optional[str] = None
    pr_title: Optional[str] = None
    pr_body: Optional[str] = None

class FilePayload(BaseModel):
    name: str
    path: str
    content: str

class ScanRequest(BaseModel):
    files: List[FilePayload] = []
    scenario_id: Optional[str] = None

class ScanSummary(BaseModel):
    total_findings: int
    security_score: int  # 0 to 100
    letter_grade: str    # A+, A, B, C, D, F
    total_monthly_waste: float
    projected_annual_savings: float
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    scanned_files_count: int
    execution_time_ms: float

class ScanResponse(BaseModel):
    summary: ScanSummary
    findings: List[Finding]
    files: List[FilePayload]

class RemediateRequest(BaseModel):
    finding_id: str
    file_path: str
    original_content: str
    api_key: Optional[str] = None

class RemediateResponse(BaseModel):
    finding_id: str
    file_path: str
    patched_content: str
    unified_diff: str
    explanation: str
    pr_title: str
    pr_body: str

class ChatMessage(BaseModel):
    role: str # user, assistant, system
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    active_findings: List[Dict[str, Any]] = []
    active_files: List[Dict[str, Any]] = []
    api_key: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    suggested_actions: List[str] = []
    citations: List[str] = []

class DemoScenario(BaseModel):
    id: str
    title: str
    description: str
    badge: str
    tags: List[str]
    files: List[FilePayload]
