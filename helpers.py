{
  "integration_process": {
    "step_1": {
      "description": "Verify AI model compliance via Ethixia Agents IA Compliance API",
      "endpoint": "POST /compliance/verify",
      "request": {
        "company_id": "XYZ_456",
        "ai_model_name": "AI_Model_X",
        "audit_data": {
          "bias_analysis": true,
          "data_privacy_check": true,
          "explainability_test": true
        }
      },
      "response": {
        "status": "compliant",
        "compliance_score": 95,
        "audit_id": "audit_12345"
      }
    },
    "step_2": {
      "description": "Issue compliance certification on AITT Blockchain",
      "endpoint": "POST /aitt/certification/issue",
      "request": {
        "audit_id": "audit_12345",
        "company_id": "XYZ_456",
        "ai_model_name": "AI_Model_X",
        "compliance_score": 95
      },
      "response": {
        "status": "issued",
        "certification_id": "aitt_cert_78901",
        "blockchain_proof": "https://soroban.aitt.com/cert/aitt_cert_78901"
      }
    }
  }
}
