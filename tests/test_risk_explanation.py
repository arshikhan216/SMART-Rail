"""Unit tests for Chunk 5: Risk Explanation Engine."""

import pytest
from src.risk_engine.explain import RiskExplainer, RiskExplanation
from src.risk_engine.predict import AssetRiskPredictor
from src.schemas import RiskLevel


def test_risk_explanation_high_risk():
    explainer = RiskExplainer()

    critical_asset = {
        "asset_id": "AST-ENG-1024",
        "condition_score": 28.5,
        "max_defect_severity": 5,
        "total_overdue_days": 37,
        "traffic_load": 85.0,
        "age_years": 22.0,
        "days_since_maintenance": 240,
    }

    explanation = explainer.explain_asset(
        asset_record=critical_asset,
        risk_probability=0.92,
        risk_level=RiskLevel.CRITICAL,
    )

    assert isinstance(explanation, RiskExplanation)
    assert explanation.asset_id == "AST-ENG-1024"
    assert explanation.risk_probability == 0.92
    assert explanation.risk_level == "CRITICAL"
    assert len(explanation.top_contributing_factors) >= 3

    factors_text = " ".join(explanation.top_contributing_factors)
    assert "condition score" in factors_text.lower()
    assert "defect" in factors_text.lower()
    assert "overdue" in factors_text.lower()


def test_risk_explanation_healthy_asset():
    explainer = RiskExplainer()

    healthy_asset = {
        "asset_id": "AST-SIG-0012",
        "condition_score": 92.0,
        "max_defect_severity": 0,
        "total_overdue_days": 0,
        "traffic_load": 22.0,
        "age_years": 2.0,
        "days_since_maintenance": 30,
    }

    explanation = explainer.explain_asset(
        asset_record=healthy_asset,
        risk_probability=0.04,
        risk_level=RiskLevel.LOW,
    )

    assert explanation.risk_probability == 0.04
    assert explanation.risk_level == "LOW"
    assert len(explanation.top_contributing_factors) > 0


def test_predictor_explain_asset_integration():
    predictor = AssetRiskPredictor(model_dir="models/asset_risk")

    critical_asset = {
        "asset_id": "AST-OHE-9999",
        "asset_type": "OHE_Mast",
        "department": "TRACTION",
        "section_id": "SEC-01",
        "location": "KM-50/1",
        "criticality": 5,
        "installation_date": "2008-01-01",
        "age_years": 18.0,
        "condition_score": 35.0,
        "traffic_load": 75.0,
        "max_defect_severity": 5,
        "total_overdue_days": 20,
        "last_maintenance_date": "2024-01-01",
    }

    exp = predictor.explain_asset(critical_asset)
    assert exp.asset_id == "AST-OHE-9999"
    assert exp.risk_probability > 0.70
    assert len(exp.top_contributing_factors) > 0
    assert "Asset AST-OHE-9999" in exp.summary
