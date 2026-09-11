/**
 * Realistic Mock & Fallback Data for SMART-Rail ML Frontend
 * Sourced directly from harmonized Rani Kamlapati (RKMP) <-> Bhopal Junction (BPL) dataset.
 */

export const MOCK_SECTION = {
  section_id: 'SEC-RKMP-BPL',
  name: 'Rani Kamlapati (RKMP) ↔ Bhopal Junction (BPL)',
  length_km: 6.2,
  tracks: 3,
  traffic_density: 'VERY_HIGH',
  electrification: '25kV AC 50Hz',
  signaling_system: 'Absolute Automatic Block',
  zone: 'West Central Railway (WCR)',
  division: 'Bhopal Division (BPL)'
};

export const MOCK_ASSETS = [
  {
    "asset_id": "AST-ENG-0001",
    "asset_type": "TrackSegment",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.0",
    "criticality": 4,
    "condition_score": 85.5,
    "traffic_load": 41.95,
    "age_years": 20,
    "installation_date": "2006-03-01",
    "last_maintenance_date": "2026-01-12"
  },
  {
    "asset_id": "AST-S_A-0002",
    "asset_type": "SignalPost",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.0",
    "criticality": 5,
    "condition_score": 79.3,
    "traffic_load": 43.72,
    "age_years": 13,
    "installation_date": "2013-03-01",
    "last_maintenance_date": "2026-01-24"
  },
  {
    "asset_id": "AST-TRA-0003",
    "asset_type": "ContactWireSegment",
    "department": "TRACTION",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.0",
    "criticality": 3,
    "condition_score": 85.8,
    "traffic_load": 40.88,
    "age_years": 12,
    "installation_date": "2014-03-01",
    "last_maintenance_date": "2025-12-10"
  },
  {
    "asset_id": "AST-ENG-0004",
    "asset_type": "SleeperBay",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.0",
    "criticality": 4,
    "condition_score": 69.4,
    "traffic_load": 39.09,
    "age_years": 23,
    "installation_date": "2003-03-02",
    "last_maintenance_date": "2026-02-04"
  },
  {
    "asset_id": "AST-S_A-0005",
    "asset_type": "InsulatedJoint",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.1",
    "criticality": 4,
    "condition_score": 76.2,
    "traffic_load": 35.09,
    "age_years": 21,
    "installation_date": "2005-03-01",
    "last_maintenance_date": "2026-02-03"
  },
  {
    "asset_id": "AST-TRA-0006",
    "asset_type": "ContactWireSegment",
    "department": "TRACTION",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.1",
    "criticality": 5,
    "condition_score": 73.7,
    "traffic_load": 31.89,
    "age_years": 10,
    "installation_date": "2016-03-01",
    "last_maintenance_date": "2025-11-29"
  },
  {
    "asset_id": "AST-ENG-0007",
    "asset_type": "TurnoutSwitch",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.1",
    "criticality": 3,
    "condition_score": 82.3,
    "traffic_load": 42.9,
    "age_years": 2,
    "installation_date": "2024-03-01",
    "last_maintenance_date": "2025-12-16"
  },
  {
    "asset_id": "AST-S_A-0008",
    "asset_type": "InsulatedJoint",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.1",
    "criticality": 3,
    "condition_score": 69.9,
    "traffic_load": 37.39,
    "age_years": 20,
    "installation_date": "2006-03-01",
    "last_maintenance_date": "2026-01-14"
  },
  {
    "asset_id": "AST-TRA-0009",
    "asset_type": "OHE_Mast",
    "department": "TRACTION",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.1",
    "criticality": 4,
    "condition_score": 69.8,
    "traffic_load": 41.4,
    "age_years": 4,
    "installation_date": "2022-03-01",
    "last_maintenance_date": "2025-09-12"
  },
  {
    "asset_id": "AST-ENG-0010",
    "asset_type": "TurnoutSwitch",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.1",
    "criticality": 5,
    "condition_score": 66.3,
    "traffic_load": 34.25,
    "age_years": 20,
    "installation_date": "2006-03-01",
    "last_maintenance_date": "2025-09-30"
  },
  {
    "asset_id": "AST-S_A-0011",
    "asset_type": "PointMachine",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.1",
    "criticality": 3,
    "condition_score": 80.2,
    "traffic_load": 41.65,
    "age_years": 21,
    "installation_date": "2005-03-01",
    "last_maintenance_date": "2025-11-01"
  },
  {
    "asset_id": "AST-TRA-0012",
    "asset_type": "OHE_Mast",
    "department": "TRACTION",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.1",
    "criticality": 3,
    "condition_score": 78.7,
    "traffic_load": 43.74,
    "age_years": 20,
    "installation_date": "2006-03-01",
    "last_maintenance_date": "2025-10-28"
  },
  {
    "asset_id": "AST-ENG-0013",
    "asset_type": "TurnoutSwitch",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.2",
    "criticality": 5,
    "condition_score": 73.3,
    "traffic_load": 39.37,
    "age_years": 18,
    "installation_date": "2008-03-01",
    "last_maintenance_date": "2026-02-08"
  },
  {
    "asset_id": "AST-S_A-0014",
    "asset_type": "SignalPost",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.2",
    "criticality": 2,
    "condition_score": 69.3,
    "traffic_load": 37.42,
    "age_years": 22,
    "installation_date": "2004-03-01",
    "last_maintenance_date": "2025-11-13"
  },
  {
    "asset_id": "AST-TRA-0015",
    "asset_type": "OHE_Mast",
    "department": "TRACTION",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.2",
    "criticality": 4,
    "condition_score": 83.9,
    "traffic_load": 39.18,
    "age_years": 20,
    "installation_date": "2006-03-01",
    "last_maintenance_date": "2025-10-06"
  },
  {
    "asset_id": "AST-ENG-0016",
    "asset_type": "TrackSegment",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.2",
    "criticality": 2,
    "condition_score": 73.4,
    "traffic_load": 32.29,
    "age_years": 7,
    "installation_date": "2019-03-02",
    "last_maintenance_date": "2025-12-09"
  },
  {
    "asset_id": "AST-S_A-0017",
    "asset_type": "InsulatedJoint",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.2",
    "criticality": 3,
    "condition_score": 68.8,
    "traffic_load": 33.63,
    "age_years": 22,
    "installation_date": "2004-03-01",
    "last_maintenance_date": "2025-09-16"
  },
  {
    "asset_id": "AST-TRA-0018",
    "asset_type": "OHE_Mast",
    "department": "TRACTION",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.2",
    "criticality": 4,
    "condition_score": 73.7,
    "traffic_load": 43.68,
    "age_years": 25,
    "installation_date": "2001-03-01",
    "last_maintenance_date": "2025-10-28"
  },
  {
    "asset_id": "AST-ENG-0019",
    "asset_type": "TurnoutSwitch",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.2",
    "criticality": 5,
    "condition_score": 71.4,
    "traffic_load": 28.45,
    "age_years": 11,
    "installation_date": "2015-03-02",
    "last_maintenance_date": "2026-01-28"
  },
  {
    "asset_id": "AST-S_A-0020",
    "asset_type": "SignalPost",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.2",
    "criticality": 4,
    "condition_score": 82.9,
    "traffic_load": 31.23,
    "age_years": 23,
    "installation_date": "2003-03-02",
    "last_maintenance_date": "2025-11-24"
  },
  {
    "asset_id": "AST-TRA-0021",
    "asset_type": "ContactWireSegment",
    "department": "TRACTION",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.3",
    "criticality": 4,
    "condition_score": 84.7,
    "traffic_load": 35.62,
    "age_years": 4,
    "installation_date": "2022-03-01",
    "last_maintenance_date": "2026-01-06"
  },
  {
    "asset_id": "AST-ENG-0022",
    "asset_type": "TrackSegment",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.3",
    "criticality": 4,
    "condition_score": 61.1,
    "traffic_load": 29.75,
    "age_years": 9,
    "installation_date": "2017-03-01",
    "last_maintenance_date": "2026-01-26"
  },
  {
    "asset_id": "AST-S_A-0023",
    "asset_type": "PointMachine",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.3",
    "criticality": 5,
    "condition_score": 68.9,
    "traffic_load": 33.32,
    "age_years": 25,
    "installation_date": "2001-03-01",
    "last_maintenance_date": "2025-10-11"
  },
  {
    "asset_id": "AST-TRA-0024",
    "asset_type": "ContactWireSegment",
    "department": "TRACTION",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.3",
    "criticality": 5,
    "condition_score": 85.4,
    "traffic_load": 36.99,
    "age_years": 19,
    "installation_date": "2007-03-02",
    "last_maintenance_date": "2026-01-01"
  },
  {
    "asset_id": "AST-ENG-0025",
    "asset_type": "TrackSegment",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.3",
    "criticality": 5,
    "condition_score": 86.4,
    "traffic_load": 32.05,
    "age_years": 3,
    "installation_date": "2023-03-02",
    "last_maintenance_date": "2025-10-18"
  },
  {
    "asset_id": "AST-S_A-0026",
    "asset_type": "PointMachine",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.3",
    "criticality": 4,
    "condition_score": 72.1,
    "traffic_load": 45.13,
    "age_years": 1,
    "installation_date": "2025-03-01",
    "last_maintenance_date": "2025-10-12"
  },
  {
    "asset_id": "AST-TRA-0027",
    "asset_type": "OHE_Mast",
    "department": "TRACTION",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.3",
    "criticality": 4,
    "condition_score": 78.2,
    "traffic_load": 39.68,
    "age_years": 18,
    "installation_date": "2008-03-01",
    "last_maintenance_date": "2026-01-30"
  },
  {
    "asset_id": "AST-ENG-0028",
    "asset_type": "TurnoutSwitch",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.3",
    "criticality": 2,
    "condition_score": 79.8,
    "traffic_load": 28.83,
    "age_years": 5,
    "installation_date": "2021-03-01",
    "last_maintenance_date": "2025-11-25"
  },
  {
    "asset_id": "AST-S_A-0029",
    "asset_type": "SignalPost",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.4",
    "criticality": 2,
    "condition_score": 92.6,
    "traffic_load": 39.75,
    "age_years": 9,
    "installation_date": "2017-03-01",
    "last_maintenance_date": "2025-10-07"
  },
  {
    "asset_id": "AST-TRA-0030",
    "asset_type": "OHE_Mast",
    "department": "TRACTION",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.4",
    "criticality": 5,
    "condition_score": 74.1,
    "traffic_load": 34.94,
    "age_years": 16,
    "installation_date": "2010-03-01",
    "last_maintenance_date": "2025-11-09"
  },
  {
    "asset_id": "AST-ENG-0031",
    "asset_type": "TrackSegment",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.4",
    "criticality": 5,
    "condition_score": 67.8,
    "traffic_load": 43.65,
    "age_years": 1,
    "installation_date": "2025-03-01",
    "last_maintenance_date": "2026-02-04"
  },
  {
    "asset_id": "AST-S_A-0032",
    "asset_type": "SignalPost",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.4",
    "criticality": 4,
    "condition_score": 99.5,
    "traffic_load": 46.76,
    "age_years": 5,
    "installation_date": "2021-03-01",
    "last_maintenance_date": "2025-11-12"
  },
  {
    "asset_id": "AST-TRA-0033",
    "asset_type": "ContactWireSegment",
    "department": "TRACTION",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.4",
    "criticality": 3,
    "condition_score": 69.9,
    "traffic_load": 38.41,
    "age_years": 12,
    "installation_date": "2014-03-01",
    "last_maintenance_date": "2025-09-27"
  },
  {
    "asset_id": "AST-ENG-0034",
    "asset_type": "TurnoutSwitch",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.4",
    "criticality": 2,
    "condition_score": 88.7,
    "traffic_load": 45.92,
    "age_years": 14,
    "installation_date": "2012-03-01",
    "last_maintenance_date": "2026-01-22"
  },
  {
    "asset_id": "AST-S_A-0035",
    "asset_type": "PointMachine",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.4",
    "criticality": 2,
    "condition_score": 73.1,
    "traffic_load": 33.62,
    "age_years": 14,
    "installation_date": "2012-03-01",
    "last_maintenance_date": "2026-01-05"
  },
  {
    "asset_id": "AST-TRA-0036",
    "asset_type": "ContactWireSegment",
    "department": "TRACTION",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.4",
    "criticality": 4,
    "condition_score": 79.3,
    "traffic_load": 30.15,
    "age_years": 16,
    "installation_date": "2010-03-01",
    "last_maintenance_date": "2025-09-16"
  },
  {
    "asset_id": "AST-ENG-0037",
    "asset_type": "SleeperBay",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.5",
    "criticality": 2,
    "condition_score": 70.7,
    "traffic_load": 35.42,
    "age_years": 6,
    "installation_date": "2020-03-01",
    "last_maintenance_date": "2025-12-25"
  },
  {
    "asset_id": "AST-S_A-0038",
    "asset_type": "InsulatedJoint",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.5",
    "criticality": 5,
    "condition_score": 69.0,
    "traffic_load": 47.06,
    "age_years": 16,
    "installation_date": "2010-03-01",
    "last_maintenance_date": "2025-12-28"
  },
  {
    "asset_id": "AST-TRA-0039",
    "asset_type": "ContactWireSegment",
    "department": "TRACTION",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.5",
    "criticality": 3,
    "condition_score": 71.5,
    "traffic_load": 31.29,
    "age_years": 13,
    "installation_date": "2013-03-01",
    "last_maintenance_date": "2025-11-19"
  },
  {
    "asset_id": "AST-ENG-0040",
    "asset_type": "TrackSegment",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.5",
    "criticality": 4,
    "condition_score": 65.2,
    "traffic_load": 45.83,
    "age_years": 3,
    "installation_date": "2023-03-02",
    "last_maintenance_date": "2025-10-14"
  },
  {
    "asset_id": "AST-S_A-0041",
    "asset_type": "InsulatedJoint",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.5",
    "criticality": 5,
    "condition_score": 80.9,
    "traffic_load": 34.32,
    "age_years": 23,
    "installation_date": "2003-03-02",
    "last_maintenance_date": "2026-02-11"
  },
  {
    "asset_id": "AST-TRA-0042",
    "asset_type": "ContactWireSegment",
    "department": "TRACTION",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.5",
    "criticality": 4,
    "condition_score": 89.1,
    "traffic_load": 29.89,
    "age_years": 19,
    "installation_date": "2007-03-02",
    "last_maintenance_date": "2025-10-14"
  },
  {
    "asset_id": "AST-ENG-0043",
    "asset_type": "TurnoutSwitch",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.5",
    "criticality": 5,
    "condition_score": 64.3,
    "traffic_load": 30.46,
    "age_years": 7,
    "installation_date": "2019-03-02",
    "last_maintenance_date": "2026-02-03"
  },
  {
    "asset_id": "AST-S_A-0044",
    "asset_type": "InsulatedJoint",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.5",
    "criticality": 3,
    "condition_score": 74.2,
    "traffic_load": 39.99,
    "age_years": 18,
    "installation_date": "2008-03-01",
    "last_maintenance_date": "2025-09-23"
  },
  {
    "asset_id": "AST-TRA-0045",
    "asset_type": "OHE_Mast",
    "department": "TRACTION",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.6",
    "criticality": 3,
    "condition_score": 84.4,
    "traffic_load": 47.44,
    "age_years": 5,
    "installation_date": "2021-03-01",
    "last_maintenance_date": "2025-11-24"
  },
  {
    "asset_id": "AST-ENG-0046",
    "asset_type": "TurnoutSwitch",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.6",
    "criticality": 2,
    "condition_score": 81.4,
    "traffic_load": 32.59,
    "age_years": 7,
    "installation_date": "2019-03-02",
    "last_maintenance_date": "2026-01-24"
  },
  {
    "asset_id": "AST-S_A-0047",
    "asset_type": "SignalPost",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.6",
    "criticality": 2,
    "condition_score": 77.5,
    "traffic_load": 41.89,
    "age_years": 17,
    "installation_date": "2009-03-01",
    "last_maintenance_date": "2025-10-11"
  },
  {
    "asset_id": "AST-TRA-0048",
    "asset_type": "ContactWireSegment",
    "department": "TRACTION",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.6",
    "criticality": 3,
    "condition_score": 74.7,
    "traffic_load": 42.31,
    "age_years": 3,
    "installation_date": "2023-03-02",
    "last_maintenance_date": "2025-10-16"
  },
  {
    "asset_id": "AST-ENG-0049",
    "asset_type": "SleeperBay",
    "department": "ENGINEERING",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.6",
    "criticality": 2,
    "condition_score": 82.9,
    "traffic_load": 35.95,
    "age_years": 4,
    "installation_date": "2022-03-01",
    "last_maintenance_date": "2025-09-07"
  },
  {
    "asset_id": "AST-S_A-0050",
    "asset_type": "PointMachine",
    "department": "S_AND_T",
    "section_id": "SEC-RKMP-BPL",
    "location": "KM-0.6",
    "criticality": 4,
    "condition_score": 83.4,
    "traffic_load": 47.11,
    "age_years": 14,
    "installation_date": "2012-03-01",
    "last_maintenance_date": "2025-12-29"
  }
];

export const MOCK_TASKS = [
  {
    "task_id": "TSK-00001",
    "asset_id": "AST-ENG-0387",
    "section_id": "SEC-RKMP-BPL",
    "department": "ENGINEERING",
    "maintenance_type": "TrackTamping",
    "work_type": "TrackTamping",
    "severity": 2,
    "urgency": 2,
    "duration_hours": 4.0,
    "deadline": "2026-10-19T02:00:00",
    "required_workers": 15,
    "required_machine": "DuomaticTampingMachine",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00002",
    "asset_id": "AST-S_A-0488",
    "section_id": "SEC-RKMP-BPL",
    "department": "S_AND_T",
    "maintenance_type": "SignalCableRenewal",
    "work_type": "SignalCableRenewal",
    "severity": 5,
    "urgency": 5,
    "duration_hours": 4.5,
    "deadline": "2026-11-16T04:00:00",
    "required_workers": 14,
    "required_machine": "CableTestingVan",
    "is_safety_critical": true
  },
  {
    "task_id": "TSK-00003",
    "asset_id": "AST-TRA-0226",
    "section_id": "SEC-RKMP-BPL",
    "department": "TRACTION",
    "maintenance_type": "InsulatorReplacement",
    "work_type": "InsulatorReplacement",
    "severity": 3,
    "urgency": 4,
    "duration_hours": 3.5,
    "deadline": "2026-10-13T01:00:00",
    "required_workers": 15,
    "required_machine": "TowerWagon",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00004",
    "asset_id": "AST-ENG-0222",
    "section_id": "SEC-RKMP-BPL",
    "department": "ENGINEERING",
    "maintenance_type": "BallastCleaning",
    "work_type": "BallastCleaning",
    "severity": 5,
    "urgency": 5,
    "duration_hours": 3.5,
    "deadline": "2026-09-30T00:00:00",
    "required_workers": 10,
    "required_machine": "BallastCleaningMachine",
    "is_safety_critical": true
  },
  {
    "task_id": "TSK-00005",
    "asset_id": "AST-S_A-0414",
    "section_id": "SEC-RKMP-BPL",
    "department": "S_AND_T",
    "maintenance_type": "AxleCounterCalibration",
    "work_type": "AxleCounterCalibration",
    "severity": 2,
    "urgency": 4,
    "duration_hours": 2.5,
    "deadline": "2026-11-05T00:00:00",
    "required_workers": 13,
    "required_machine": "SignalTestingKit",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00006",
    "asset_id": "AST-TRA-0447",
    "section_id": "SEC-RKMP-BPL",
    "department": "TRACTION",
    "maintenance_type": "OHEInspection",
    "work_type": "OHEInspection",
    "severity": 3,
    "urgency": 2,
    "duration_hours": 4.5,
    "deadline": "2026-11-18T04:00:00",
    "required_workers": 5,
    "required_machine": "TowerWagon",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00007",
    "asset_id": "AST-ENG-0078",
    "section_id": "SEC-RKMP-BPL",
    "department": "ENGINEERING",
    "maintenance_type": "BallastCleaning",
    "work_type": "BallastCleaning",
    "severity": 3,
    "urgency": 2,
    "duration_hours": 4.5,
    "deadline": "2026-11-09T05:00:00",
    "required_workers": 13,
    "required_machine": "BallastCleaningMachine",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00008",
    "asset_id": "AST-S_A-0186",
    "section_id": "SEC-RKMP-BPL",
    "department": "S_AND_T",
    "maintenance_type": "AxleCounterCalibration",
    "work_type": "AxleCounterCalibration",
    "severity": 5,
    "urgency": 5,
    "duration_hours": 1.5,
    "deadline": "2026-10-21T04:00:00",
    "required_workers": 5,
    "required_machine": "SignalTestingKit",
    "is_safety_critical": true
  },
  {
    "task_id": "TSK-00009",
    "asset_id": "AST-TRA-0238",
    "section_id": "SEC-RKMP-BPL",
    "department": "TRACTION",
    "maintenance_type": "DropperReplacement",
    "work_type": "DropperReplacement",
    "severity": 2,
    "urgency": 4,
    "duration_hours": 2.5,
    "deadline": "2026-09-30T03:00:00",
    "required_workers": 12,
    "required_machine": "TowerWagon",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00010",
    "asset_id": "AST-ENG-0351",
    "section_id": "SEC-RKMP-BPL",
    "department": "ENGINEERING",
    "maintenance_type": "SleeperRenewal",
    "work_type": "SleeperRenewal",
    "severity": 4,
    "urgency": 3,
    "duration_hours": 1.5,
    "deadline": "2026-10-07T04:00:00",
    "required_workers": 14,
    "required_machine": "TrackRelayingTrain",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00011",
    "asset_id": "AST-S_A-0145",
    "section_id": "SEC-RKMP-BPL",
    "department": "S_AND_T",
    "maintenance_type": "AxleCounterCalibration",
    "work_type": "AxleCounterCalibration",
    "severity": 5,
    "urgency": 5,
    "duration_hours": 2.5,
    "deadline": "2026-11-09T03:00:00",
    "required_workers": 4,
    "required_machine": "SignalTestingKit",
    "is_safety_critical": true
  },
  {
    "task_id": "TSK-00012",
    "asset_id": "AST-TRA-0004",
    "section_id": "SEC-RKMP-BPL",
    "department": "TRACTION",
    "maintenance_type": "InsulatorReplacement",
    "work_type": "InsulatorReplacement",
    "severity": 2,
    "urgency": 4,
    "duration_hours": 5.0,
    "deadline": "2026-11-19T04:00:00",
    "required_workers": 12,
    "required_machine": "TowerWagon",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00013",
    "asset_id": "AST-ENG-0230",
    "section_id": "SEC-RKMP-BPL",
    "department": "ENGINEERING",
    "maintenance_type": "BallastCleaning",
    "work_type": "BallastCleaning",
    "severity": 5,
    "urgency": 5,
    "duration_hours": 3.5,
    "deadline": "2026-10-30T00:00:00",
    "required_workers": 4,
    "required_machine": "BallastCleaningMachine",
    "is_safety_critical": true
  },
  {
    "task_id": "TSK-00014",
    "asset_id": "AST-S_A-0335",
    "section_id": "SEC-RKMP-BPL",
    "department": "S_AND_T",
    "maintenance_type": "PointMachineOverhaul",
    "work_type": "PointMachineOverhaul",
    "severity": 3,
    "urgency": 3,
    "duration_hours": 4.0,
    "deadline": "2026-10-21T05:00:00",
    "required_workers": 10,
    "required_machine": "TowerWagon",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00015",
    "asset_id": "AST-TRA-0277",
    "section_id": "SEC-RKMP-BPL",
    "department": "TRACTION",
    "maintenance_type": "DropperReplacement",
    "work_type": "DropperReplacement",
    "severity": 5,
    "urgency": 5,
    "duration_hours": 1.5,
    "deadline": "2026-10-29T04:00:00",
    "required_workers": 7,
    "required_machine": "TowerWagon",
    "is_safety_critical": true
  },
  {
    "task_id": "TSK-00016",
    "asset_id": "AST-ENG-0219",
    "section_id": "SEC-RKMP-BPL",
    "department": "ENGINEERING",
    "maintenance_type": "RailGrinding",
    "work_type": "RailGrinding",
    "severity": 2,
    "urgency": 2,
    "duration_hours": 6.0,
    "deadline": "2026-09-29T01:00:00",
    "required_workers": 8,
    "required_machine": "RailGrindingMachine",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00017",
    "asset_id": "AST-S_A-0030",
    "section_id": "SEC-RKMP-BPL",
    "department": "S_AND_T",
    "maintenance_type": "AxleCounterCalibration",
    "work_type": "AxleCounterCalibration",
    "severity": 2,
    "urgency": 3,
    "duration_hours": 5.0,
    "deadline": "2026-10-05T05:00:00",
    "required_workers": 7,
    "required_machine": "SignalTestingKit",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00018",
    "asset_id": "AST-TRA-0392",
    "section_id": "SEC-RKMP-BPL",
    "department": "TRACTION",
    "maintenance_type": "DropperReplacement",
    "work_type": "DropperReplacement",
    "severity": 2,
    "urgency": 2,
    "duration_hours": 6.0,
    "deadline": "2026-11-08T02:00:00",
    "required_workers": 8,
    "required_machine": "TowerWagon",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00019",
    "asset_id": "AST-ENG-0012",
    "section_id": "SEC-RKMP-BPL",
    "department": "ENGINEERING",
    "maintenance_type": "RailGrinding",
    "work_type": "RailGrinding",
    "severity": 4,
    "urgency": 2,
    "duration_hours": 1.5,
    "deadline": "2026-09-18T04:00:00",
    "required_workers": 13,
    "required_machine": "RailGrindingMachine",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00020",
    "asset_id": "AST-S_A-0251",
    "section_id": "SEC-RKMP-BPL",
    "department": "S_AND_T",
    "maintenance_type": "AxleCounterCalibration",
    "work_type": "AxleCounterCalibration",
    "severity": 2,
    "urgency": 3,
    "duration_hours": 6.0,
    "deadline": "2026-09-23T02:00:00",
    "required_workers": 12,
    "required_machine": "SignalTestingKit",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00021",
    "asset_id": "AST-TRA-0151",
    "section_id": "SEC-RKMP-BPL",
    "department": "TRACTION",
    "maintenance_type": "ContactWireReplacement",
    "work_type": "ContactWireReplacement",
    "severity": 5,
    "urgency": 5,
    "duration_hours": 4.5,
    "deadline": "2026-11-05T03:00:00",
    "required_workers": 8,
    "required_machine": "TowerWagon",
    "is_safety_critical": true
  },
  {
    "task_id": "TSK-00022",
    "asset_id": "AST-ENG-0060",
    "section_id": "SEC-RKMP-BPL",
    "department": "ENGINEERING",
    "maintenance_type": "RailGrinding",
    "work_type": "RailGrinding",
    "severity": 3,
    "urgency": 2,
    "duration_hours": 3.0,
    "deadline": "2026-12-04T02:00:00",
    "required_workers": 15,
    "required_machine": "RailGrindingMachine",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00023",
    "asset_id": "AST-S_A-0485",
    "section_id": "SEC-RKMP-BPL",
    "department": "S_AND_T",
    "maintenance_type": "AxleCounterCalibration",
    "work_type": "AxleCounterCalibration",
    "severity": 4,
    "urgency": 2,
    "duration_hours": 2.5,
    "deadline": "2026-11-18T01:00:00",
    "required_workers": 13,
    "required_machine": "SignalTestingKit",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00024",
    "asset_id": "AST-TRA-0049",
    "section_id": "SEC-RKMP-BPL",
    "department": "TRACTION",
    "maintenance_type": "ContactWireReplacement",
    "work_type": "ContactWireReplacement",
    "severity": 4,
    "urgency": 2,
    "duration_hours": 3.5,
    "deadline": "2026-11-29T00:00:00",
    "required_workers": 9,
    "required_machine": "TowerWagon",
    "is_safety_critical": false
  },
  {
    "task_id": "TSK-00025",
    "asset_id": "AST-ENG-0290",
    "section_id": "SEC-RKMP-BPL",
    "department": "ENGINEERING",
    "maintenance_type": "JointWelding",
    "work_type": "JointWelding",
    "severity": 3,
    "urgency": 4,
    "duration_hours": 3.5,
    "deadline": "2026-09-25T02:00:00",
    "required_workers": 14,
    "required_machine": "MobileFlashButtWeldingPlant",
    "is_safety_critical": false
  }
];

export const MOCK_TRAINS = [
  {
    "train_id": "TRN-12047",
    "train_number": 12047,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12006",
    "train_number": 12006,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12059",
    "train_number": 12059,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12031",
    "train_number": 12031,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12023",
    "train_number": 12023,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12025",
    "train_number": 12025,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12014",
    "train_number": 12014,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12052",
    "train_number": 12052,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12046",
    "train_number": 12046,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12027",
    "train_number": 12027,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12012",
    "train_number": 12012,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12033",
    "train_number": 12033,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12045",
    "train_number": 12045,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12055",
    "train_number": 12055,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12020",
    "train_number": 12020,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12049",
    "train_number": 12049,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12015",
    "train_number": 12015,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12003",
    "train_number": 12003,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12041",
    "train_number": 12041,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  },
  {
    "train_id": "TRN-12005",
    "train_number": 12005,
    "train_type": "EXPRESS_PASSENGER",
    "priority": 2,
    "source": "RKMP",
    "destination": "BPL"
  }
];

export const MOCK_MOVEMENTS = [
  {
    "movement_id": "MOV-000001",
    "train_id": "TRN-12047",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T15:15:00",
    "departure_time": "2026-09-09T15:38:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000002",
    "train_id": "TRN-12006",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T16:00:00",
    "departure_time": "2026-09-09T16:16:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000003",
    "train_id": "TRN-12059",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T17:45:00",
    "departure_time": "2026-09-09T18:14:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000004",
    "train_id": "TRN-12031",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T03:45:00",
    "departure_time": "2026-09-09T04:09:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000005",
    "train_id": "TRN-12023",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T04:45:00",
    "departure_time": "2026-09-09T05:15:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000006",
    "train_id": "TRN-12025",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T19:30:00",
    "departure_time": "2026-09-09T19:53:00",
    "direction": "UP"
  },
  {
    "movement_id": "MOV-000007",
    "train_id": "TRN-12014",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T02:30:00",
    "departure_time": "2026-09-09T03:02:00",
    "direction": "UP"
  },
  {
    "movement_id": "MOV-000008",
    "train_id": "TRN-12052",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T19:15:00",
    "departure_time": "2026-09-09T19:42:00",
    "direction": "UP"
  },
  {
    "movement_id": "MOV-000009",
    "train_id": "TRN-12046",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T16:15:00",
    "departure_time": "2026-09-09T16:31:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000010",
    "train_id": "TRN-12027",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T21:30:00",
    "departure_time": "2026-09-09T22:00:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000011",
    "train_id": "TRN-12012",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T08:15:00",
    "departure_time": "2026-09-09T08:39:00",
    "direction": "UP"
  },
  {
    "movement_id": "MOV-000012",
    "train_id": "TRN-12033",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T03:30:00",
    "departure_time": "2026-09-09T03:58:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000013",
    "train_id": "TRN-12045",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T08:45:00",
    "departure_time": "2026-09-09T09:08:00",
    "direction": "UP"
  },
  {
    "movement_id": "MOV-000014",
    "train_id": "TRN-12055",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T08:00:00",
    "departure_time": "2026-09-09T08:24:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000015",
    "train_id": "TRN-12012",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T11:00:00",
    "departure_time": "2026-09-09T11:28:00",
    "direction": "UP"
  },
  {
    "movement_id": "MOV-000016",
    "train_id": "TRN-12020",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T05:30:00",
    "departure_time": "2026-09-09T05:58:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000017",
    "train_id": "TRN-12027",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T03:45:00",
    "departure_time": "2026-09-09T04:12:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000018",
    "train_id": "TRN-12006",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T07:45:00",
    "departure_time": "2026-09-09T08:16:00",
    "direction": "UP"
  },
  {
    "movement_id": "MOV-000019",
    "train_id": "TRN-12049",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T20:15:00",
    "departure_time": "2026-09-09T20:47:00",
    "direction": "UP"
  },
  {
    "movement_id": "MOV-000020",
    "train_id": "TRN-12015",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T16:30:00",
    "departure_time": "2026-09-09T16:47:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000021",
    "train_id": "TRN-12012",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T19:00:00",
    "departure_time": "2026-09-09T19:30:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000022",
    "train_id": "TRN-12047",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T15:15:00",
    "departure_time": "2026-09-09T15:44:00",
    "direction": "UP"
  },
  {
    "movement_id": "MOV-000023",
    "train_id": "TRN-12047",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T13:15:00",
    "departure_time": "2026-09-09T13:40:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000024",
    "train_id": "TRN-12003",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T03:00:00",
    "departure_time": "2026-09-09T03:17:00",
    "direction": "UP"
  },
  {
    "movement_id": "MOV-000025",
    "train_id": "TRN-12041",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T15:15:00",
    "departure_time": "2026-09-09T15:47:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000026",
    "train_id": "TRN-12005",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T18:30:00",
    "departure_time": "2026-09-09T18:57:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000027",
    "train_id": "TRN-12034",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T02:30:00",
    "departure_time": "2026-09-09T03:00:00",
    "direction": "UP"
  },
  {
    "movement_id": "MOV-000028",
    "train_id": "TRN-12037",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T00:15:00",
    "departure_time": "2026-09-09T00:38:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000029",
    "train_id": "TRN-12013",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T06:15:00",
    "departure_time": "2026-09-09T06:49:00",
    "direction": "DOWN"
  },
  {
    "movement_id": "MOV-000030",
    "train_id": "TRN-12003",
    "section_id": "SEC-RKMP-BPL",
    "arrival_time": "2026-09-09T05:45:00",
    "departure_time": "2026-09-09T06:01:00",
    "direction": "DOWN"
  }
];

export const MOCK_BLOCKS = [
  {
    "block_id": "BLK-00001",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-09",
    "start_time": "2026-09-09T01:00:00",
    "end_time": "2026-09-09T05:30:00",
    "available": true
  },
  {
    "block_id": "BLK-00002",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-09",
    "start_time": "2026-09-09T11:30:00",
    "end_time": "2026-09-09T14:00:00",
    "available": true
  },
  {
    "block_id": "BLK-00003",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-10",
    "start_time": "2026-09-10T01:00:00",
    "end_time": "2026-09-10T05:30:00",
    "available": true
  },
  {
    "block_id": "BLK-00004",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-10",
    "start_time": "2026-09-10T11:30:00",
    "end_time": "2026-09-10T14:00:00",
    "available": true
  },
  {
    "block_id": "BLK-00005",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-11",
    "start_time": "2026-09-11T01:00:00",
    "end_time": "2026-09-11T05:30:00",
    "available": false
  },
  {
    "block_id": "BLK-00006",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-11",
    "start_time": "2026-09-11T11:30:00",
    "end_time": "2026-09-11T14:00:00",
    "available": true
  },
  {
    "block_id": "BLK-00007",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-12",
    "start_time": "2026-09-12T01:00:00",
    "end_time": "2026-09-12T05:30:00",
    "available": true
  },
  {
    "block_id": "BLK-00008",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-12",
    "start_time": "2026-09-12T11:30:00",
    "end_time": "2026-09-12T14:00:00",
    "available": true
  },
  {
    "block_id": "BLK-00009",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-13",
    "start_time": "2026-09-13T01:00:00",
    "end_time": "2026-09-13T05:30:00",
    "available": false
  },
  {
    "block_id": "BLK-00010",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-13",
    "start_time": "2026-09-13T11:30:00",
    "end_time": "2026-09-13T14:00:00",
    "available": true
  },
  {
    "block_id": "BLK-00011",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-14",
    "start_time": "2026-09-14T01:00:00",
    "end_time": "2026-09-14T05:30:00",
    "available": true
  },
  {
    "block_id": "BLK-00012",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-14",
    "start_time": "2026-09-14T11:30:00",
    "end_time": "2026-09-14T14:00:00",
    "available": true
  },
  {
    "block_id": "BLK-00013",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-15",
    "start_time": "2026-09-15T01:00:00",
    "end_time": "2026-09-15T05:30:00",
    "available": true
  },
  {
    "block_id": "BLK-00014",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-15",
    "start_time": "2026-09-15T11:30:00",
    "end_time": "2026-09-15T14:00:00",
    "available": true
  },
  {
    "block_id": "BLK-00015",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-16",
    "start_time": "2026-09-16T01:00:00",
    "end_time": "2026-09-16T05:30:00",
    "available": true
  },
  {
    "block_id": "BLK-00016",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-16",
    "start_time": "2026-09-16T11:30:00",
    "end_time": "2026-09-16T14:00:00",
    "available": false
  },
  {
    "block_id": "BLK-00017",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-17",
    "start_time": "2026-09-17T01:00:00",
    "end_time": "2026-09-17T05:30:00",
    "available": true
  },
  {
    "block_id": "BLK-00018",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-17",
    "start_time": "2026-09-17T11:30:00",
    "end_time": "2026-09-17T14:00:00",
    "available": false
  },
  {
    "block_id": "BLK-00019",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-18",
    "start_time": "2026-09-18T01:00:00",
    "end_time": "2026-09-18T05:30:00",
    "available": true
  },
  {
    "block_id": "BLK-00020",
    "section_id": "SEC-RKMP-BPL",
    "date": "2026-09-18",
    "start_time": "2026-09-18T11:30:00",
    "end_time": "2026-09-18T14:00:00",
    "available": true
  }
];

export const MOCK_MODEL_METADATA = {
  risk_model: {
    model_name: 'RandomForestClassifier (Ensemble)',
    model_version: '2.0.0',
    model_status: 'READY',
    status_color: 'nominal',
    algorithm: 'RandomForestClassifier',
    last_trained: '2026-09-08T21:04:30',
    training_samples: 5000,
    metrics: {
      roc_auc: 1.0,
      pr_auc: 1.0,
      f1_score: 1.0,
      brier_score: 0.0035
    },
    features: ['condition_score', 'traffic_load', 'age_years', 'criticality', 'days_since_last_maintenance', 'defect_severity']
  },
  train_delay_model: {
    model_name: 'RandomForestRegressor (Delay Engine)',
    model_version: '2.0.0',
    model_status: 'READY',
    status_color: 'nominal',
    algorithm: 'RandomForestRegressor',
    last_trained: '2026-09-08T21:04:30',
    metrics: {
      mae: 2.41,
      rmse: 3.03,
      r2_score: 0.8608
    },
    computation_method: 'ML_REGRESSION'
  },
  optimizer: {
    solver_name: 'Google OR-Tools CP-SAT',
    solver_version: '9.8.3296',
    status: 'OPTIMAL',
    status_color: 'nominal',
    coordination_savings_hours: 45.5,
    asset_availability_pct: 98.44
  },
  data_status: {
    corpus_name: 'RKMP-BPL High-Density Quad Track Corpus',
    records_checked: 13577,
    status: 'VALIDATED',
    status_color: 'nominal',
    schema_clean: true,
    data_tier: 'Demonstration / Verified Prototype Data'
  }
};


// Mapped helper exports for ML Frontend
export const mockAssets = (MOCK_ASSETS || []).map((a, i) => ({
  id: a.asset_id || `AST-${i+1}`,
  name: `${a.asset_type} (${a.location})`,
  type: a.asset_type || 'Track Asset',
  location: `RKMP-BPL ${a.location || 'KM 824.5'}`,
  commissioned: a.installation_date || '2016-03-01',
  cumulative_load: `${a.traffic_load || 42.5} MGT`,
  health_score: Math.round(a.condition_score || 55),
  risk_score: (100 - (a.condition_score || 55)) / 100,
  risk_level: (a.condition_score || 55) < 60 ? 'CRITICAL' : (a.condition_score || 55) < 75 ? 'HIGH' : 'MEDIUM',
  failure_probability: ((100 - (a.condition_score || 55)) / 100) * 0.92,
  explanation: `Asset condition ${Math.round(a.condition_score || 55)}/100 and axle load of ${a.traffic_load || 42.5} MGT drive elevated track degradation risk.`,
  shap_features: [
    { feature: 'Ultrasonic Flaw Depth', impact: 0.38, direction: 'increases_risk', value: '4.8 mm defect' },
    { feature: 'Track Service Age', impact: 0.24, direction: 'increases_risk', value: `${a.age_years || 14} years` },
    { feature: 'Cumulative Axle Load', impact: 0.19, direction: 'increases_risk', value: `${a.traffic_load || 42.5} MGT` },
    { feature: 'Vibration Anomaly Index', impact: 0.12, direction: 'increases_risk', value: '2.4g peak' },
    { feature: 'Recent Surface Tamping', impact: -0.15, direction: 'decreases_risk', value: 'Done 45d ago' },
    { feature: 'Ballast Cushion Depth', impact: -0.08, direction: 'decreases_risk', value: '310 mm' }
  ],
  recommendations: [
    "Schedule ultrasonic rail testing machine (USFD) validation within 7 days",
    "Prepare track renewal clamp & welding squad for 3.5-hour corridor block",
    "Bundle with OHE inspection window on adjacent RKMP-BPL Up-Line"
  ]
}));

export const mockTasks = (MOCK_TASKS || [
  { task_id: 'TSK-2024-001', asset_id: 'AST-ENG-0001', task_name: 'Ultrasonic Rail Weld Repair', priority: 94, duration_hours: 3.5, window_start: '14:00', window_end: '17:30' },
  { task_id: 'TSK-2024-002', asset_id: 'AST-S_A-0002', task_name: 'Point Machine Detection Recalibration', priority: 88, duration_hours: 2.0, window_start: '01:30', window_end: '03:30' },
  { task_id: 'TSK-2024-003', asset_id: 'AST-TRA-0003', task_name: 'Cantilever Insulator De-glazing', priority: 76, duration_hours: 1.5, window_start: '14:00', window_end: '15:30' },
  { task_id: 'TSK-2024-004', asset_id: 'AST-ENG-0004', task_name: 'Turnout Frog Grinding & Dressing', priority: 71, duration_hours: 2.5, window_start: '11:00', window_end: '13:30' }
]).map((t, idx) => ({
  id: t.task_id || `TSK-2024-00${idx+1}`,
  title: t.task_name || 'Corridor Track Maintenance',
  asset_id: t.asset_id || `AST-ENG-000${idx+1}`,
  track_section: 'RKMP-BPL Up Main (Km 824.2 - 825.8)',
  risk_level: idx === 0 ? 'CRITICAL' : idx === 1 ? 'HIGH' : 'MEDIUM',
  risk_score: idx === 0 ? 0.84 : idx === 1 ? 0.72 : 0.48,
  priority_score: t.priority || (90 - idx * 6),
  duration_p50: Math.round((t.duration_hours || 3.5) * 60),
  window_start: t.window_start || '14:00',
  window_end: t.window_end || '17:30'
}));
