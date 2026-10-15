import unittest
from backend.app.models import FilePayload, ScanRequest, Severity, Category
from backend.app.rules.secret_rules import scan_secrets
from backend.app.rules.iac_security_rules import scan_iac_security
from backend.app.rules.finops_rules import scan_finops
from backend.app.main import run_scan

class TestCloudSentinelEngine(unittest.TestCase):

    def test_secret_scanner_detects_aws_keys(self):
        sample = FilePayload(
            name="credentials.tf",
            path="terraform/credentials.tf",
            content='access_key = "AKIA1111222233334444"\nsecret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"'
        )
        findings = scan_secrets(sample)
        rule_ids = [f.rule_id for f in findings]
        self.assertIn("SEC-001", rule_ids)
        self.assertIn("SEC-002", rule_ids)
        self.assertEqual(findings[0].severity, Severity.CRITICAL)

    def test_iac_scanner_detects_open_security_group(self):
        sample = FilePayload(
            name="sg.tf",
            path="terraform/sg.tf",
            content='''resource "aws_security_group" "open_ssh" {
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}'''
        )
        findings = scan_iac_security(sample)
        self.assertTrue(any(f.rule_id == "CIS-AWS-4.1" for f in findings))

    def test_finops_scanner_computes_graviton_savings(self):
        sample = FilePayload(
            name="ec2.tf",
            path="terraform/ec2.tf",
            content='''resource "aws_instance" "big_server" {
  instance_type = "m5.4xlarge"
}'''
        )
        findings = scan_finops(sample)
        self.assertTrue(any(f.rule_id == "FIN-EC2-001" for f in findings))
        ec2_finding = next(f for f in findings if f.rule_id == "FIN-EC2-001")
        self.assertGreater(ec2_finding.estimated_monthly_waste, 400.0)

    def test_end_to_end_scan_scoring(self):
        res = run_scan(ScanRequest(scenario_id="aws-cloud-sprawl"))
        self.assertGreater(res.summary.total_findings, 0)
        self.assertIn(res.summary.letter_grade, ["A+", "A", "B", "C", "D", "F"])
        self.assertGreater(res.summary.total_monthly_waste, 0.0)
        self.assertGreater(res.summary.projected_annual_savings, 0.0)

if __name__ == "__main__":
    unittest.main()
