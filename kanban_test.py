#!/usr/bin/env python3
"""
Kanban Board Backend Integration Tests
Focused testing for the drag-and-drop Kanban board functionality
"""

import requests
import json
import uuid
from datetime import datetime
import sys

# Get backend URL from frontend .env file
BACKEND_URL = "https://strike-crm.preview.emergentagent.com/api"

class KanbanBackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.token = None
        self.user_id = None
        self.test_leads = []
        self.valid_stages = ["New Leads", "Contacted", "Follow-up", "Negotiation", "Closed"]
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def register_test_user(self):
        """Register a test user for authentication"""
        test_email = f"kanban_test_{uuid.uuid4().hex[:8]}@strikecrm.com"
        test_data = {
            "email": test_email,
            "password": "KanbanTest123!",
            "name": "Kanban Test User",
            "company": "Kanban Test Corp"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=test_data)
            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                self.log(f"✅ Test user registered successfully: {test_email}")
                return True
            else:
                self.log(f"❌ Failed to register test user: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Exception during user registration: {str(e)}", "ERROR")
            return False
    
    def get_auth_headers(self):
        """Get authorization headers for API requests"""
        return {"Authorization": f"Bearer {self.token}"}
    
    def test_lead_creation_various_fields(self):
        """Test lead creation with various field combinations for Kanban columns"""
        self.log("🧪 Testing lead creation with various field combinations...")
        
        test_cases = [
            {
                "name": "Complete Lead - High Priority",
                "data": {
                    "name": "Alice Cooper",
                    "company": "Rock Solutions Ltd",
                    "phone": "+1-555-ROCK",
                    "email": "alice@rocksolutions.com",
                    "address": "123 Music Ave, Rock City, RC 12345",
                    "stage": "New Leads",
                    "priority": "high",
                    "notes": "Interested in premium CRM package"
                }
            },
            {
                "name": "Minimal Lead - Medium Priority",
                "data": {
                    "name": "Bob Wilson",
                    "priority": "medium",
                    "stage": "New Leads"
                }
            },
            {
                "name": "Phone-Only Lead - Low Priority",
                "data": {
                    "name": "Carol Davis",
                    "phone": "+1-555-0456",
                    "stage": "New Leads",
                    "priority": "low"
                }
            },
            {
                "name": "Email-Only Lead - High Priority",
                "data": {
                    "name": "David Brown",
                    "email": "david@example.com",
                    "stage": "New Leads",
                    "priority": "high"
                }
            },
            {
                "name": "Corporate Lead - High Priority",
                "data": {
                    "name": "Emma Thompson",
                    "company": "Enterprise Solutions Inc",
                    "phone": "+1-555-0789",
                    "email": "emma@enterprise.com",
                    "stage": "New Leads",
                    "priority": "high",
                    "notes": "Enterprise client - high value opportunity"
                }
            }
        ]
        
        success_count = 0
        for test_case in test_cases:
            try:
                response = requests.post(
                    f"{self.base_url}/leads",
                    json=test_case["data"],
                    headers=self.get_auth_headers()
                )
                
                if response.status_code == 200:
                    lead_data = response.json()
                    self.test_leads.append(lead_data)
                    self.log(f"✅ Created {test_case['name']}: {lead_data['name']} (ID: {lead_data['id'][:8]}...)")
                    success_count += 1
                    
                    # Verify default stage is set correctly
                    if lead_data["stage"] != "New Leads":
                        self.log(f"⚠️  Stage mismatch for {test_case['name']}: expected 'New Leads', got {lead_data['stage']}", "WARNING")
                else:
                    self.log(f"❌ Failed to create {test_case['name']}: {response.status_code} - {response.text}", "ERROR")
            except Exception as e:
                self.log(f"❌ Exception creating {test_case['name']}: {str(e)}", "ERROR")
        
        self.log(f"📊 Lead creation results: {success_count}/{len(test_cases)} successful")
        return success_count == len(test_cases)
    
    def test_kanban_stage_transitions(self):
        """Test moving leads through all Kanban stages in sequence"""
        self.log("🧪 Testing Kanban stage transitions...")
        
        if not self.test_leads:
            self.log("❌ No test leads available for stage transition testing", "ERROR")
            return False
        
        # Test complete workflow: New Leads → Contacted → Follow-up → Negotiation → Closed
        lead = self.test_leads[0]  # Use first lead for complete workflow
        lead_id = lead["id"]
        current_stage = lead["stage"]
        
        stage_progression = ["Contacted", "Follow-up", "Negotiation", "Closed"]
        success_count = 0
        
        self.log(f"🎯 Testing complete workflow for lead: {lead['name']}")
        
        for target_stage in stage_progression:
            try:
                response = requests.patch(
                    f"{self.base_url}/leads/{lead_id}/stage",
                    params={"stage": target_stage},
                    headers=self.get_auth_headers()
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success"):
                        self.log(f"✅ Moved '{lead['name']}' from '{current_stage}' → '{target_stage}'")
                        success_count += 1
                        current_stage = target_stage
                    else:
                        self.log(f"❌ Stage update failed for '{lead['name']}': {result}", "ERROR")
                        break
                else:
                    self.log(f"❌ Failed to update stage: {response.status_code} - {response.text}", "ERROR")
                    break
            except Exception as e:
                self.log(f"❌ Exception updating stage: {str(e)}", "ERROR")
                break
        
        self.log(f"📊 Stage transition results: {success_count}/{len(stage_progression)} successful")
        return success_count == len(stage_progression)
    
    def test_kanban_column_distribution(self):
        """Test distributing leads across different Kanban columns"""
        self.log("🧪 Testing Kanban column distribution...")
        
        if len(self.test_leads) < 5:
            self.log("❌ Need at least 5 test leads for column distribution testing", "ERROR")
            return False
        
        # Distribute leads across different stages
        stage_assignments = [
            ("New Leads", 0),
            ("Contacted", 1), 
            ("Follow-up", 2),
            ("Negotiation", 3),
            ("Closed", 4)
        ]
        
        success_count = 0
        for stage, lead_index in stage_assignments:
            if lead_index >= len(self.test_leads):
                continue
                
            lead = self.test_leads[lead_index]
            lead_id = lead["id"]
            
            try:
                response = requests.patch(
                    f"{self.base_url}/leads/{lead_id}/stage",
                    params={"stage": stage},
                    headers=self.get_auth_headers()
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success"):
                        self.log(f"✅ Assigned '{lead['name']}' to '{stage}' column")
                        success_count += 1
                    else:
                        self.log(f"❌ Failed to assign '{lead['name']}' to '{stage}'", "ERROR")
                else:
                    self.log(f"❌ Failed to update stage: {response.status_code}", "ERROR")
            except Exception as e:
                self.log(f"❌ Exception assigning lead to stage: {str(e)}", "ERROR")
        
        self.log(f"📊 Column distribution results: {success_count}/{len(stage_assignments)} successful")
        return success_count == len(stage_assignments)
    
    def test_kanban_data_retrieval(self):
        """Test retrieving leads for Kanban board display"""
        self.log("🧪 Testing Kanban data retrieval and grouping...")
        
        try:
            response = requests.get(
                f"{self.base_url}/leads",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                leads = response.json()
                self.log(f"✅ Retrieved {len(leads)} leads successfully")
                
                # Group leads by stage to simulate Kanban columns
                kanban_columns = {}
                for stage in self.valid_stages:
                    kanban_columns[stage] = []
                
                for lead in leads:
                    stage = lead["stage"]
                    if stage in kanban_columns:
                        kanban_columns[stage].append(lead)
                    else:
                        self.log(f"⚠️  Lead has invalid stage: {stage}", "WARNING")
                
                # Display Kanban board structure
                self.log("📋 Kanban Board Structure:")
                total_leads = 0
                for stage in self.valid_stages:
                    count = len(kanban_columns[stage])
                    total_leads += count
                    self.log(f"   📌 {stage}: {count} leads")
                    
                    # Show lead details in each column
                    for lead in kanban_columns[stage][:2]:  # Show first 2 leads per column
                        priority_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(lead.get("priority", "medium"), "⚪")
                        self.log(f"      {priority_emoji} {lead['name']} ({lead.get('company', 'No company')})")
                
                self.log(f"📊 Total leads distributed across Kanban: {total_leads}")
                
                # Verify data integrity for Kanban display
                for lead in leads:
                    required_fields = ["id", "name", "stage", "priority"]
                    missing_fields = [field for field in required_fields if not lead.get(field)]
                    if missing_fields:
                        self.log(f"❌ Lead missing required fields for Kanban: {missing_fields}", "ERROR")
                        return False
                
                return True
            else:
                self.log(f"❌ Failed to retrieve leads: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Exception during lead retrieval: {str(e)}", "ERROR")
            return False
    
    def test_kanban_error_handling(self):
        """Test error handling for Kanban operations"""
        self.log("🧪 Testing Kanban error handling...")
        
        error_tests = [
            {
                "name": "Invalid stage transition",
                "test": lambda: requests.patch(
                    f"{self.base_url}/leads/{self.test_leads[0]['id']}/stage",
                    params={"stage": "Invalid Kanban Stage"},
                    headers=self.get_auth_headers()
                ),
                "expected_status": 400,
                "description": "Should reject invalid Kanban stage"
            },
            {
                "name": "Non-existent lead stage update",
                "test": lambda: requests.patch(
                    f"{self.base_url}/leads/non-existent-kanban-id/stage",
                    params={"stage": "Contacted"},
                    headers=self.get_auth_headers()
                ),
                "expected_status": 404,
                "description": "Should return 404 for non-existent lead"
            },
            {
                "name": "Missing stage parameter",
                "test": lambda: requests.patch(
                    f"{self.base_url}/leads/{self.test_leads[0]['id']}/stage",
                    headers=self.get_auth_headers()
                ),
                "expected_status": 422,
                "description": "Should require stage parameter"
            },
            {
                "name": "Empty stage value",
                "test": lambda: requests.patch(
                    f"{self.base_url}/leads/{self.test_leads[0]['id']}/stage",
                    params={"stage": ""},
                    headers=self.get_auth_headers()
                ),
                "expected_status": 400,
                "description": "Should reject empty stage value"
            }
        ]
        
        success_count = 0
        for error_test in error_tests:
            try:
                response = error_test["test"]()
                if response.status_code == error_test["expected_status"]:
                    self.log(f"✅ {error_test['name']}: Correctly returned {response.status_code}")
                    success_count += 1
                else:
                    self.log(f"❌ {error_test['name']}: Expected {error_test['expected_status']}, got {response.status_code}", "ERROR")
                    self.log(f"   Description: {error_test['description']}")
            except Exception as e:
                self.log(f"❌ Exception in {error_test['name']}: {str(e)}", "ERROR")
        
        self.log(f"📊 Error handling results: {success_count}/{len(error_tests)} successful")
        return success_count == len(error_tests)
    
    def test_kanban_priority_handling(self):
        """Test priority handling in Kanban board"""
        self.log("🧪 Testing Kanban priority handling...")
        
        # Create leads with different priorities
        priority_leads = []
        priorities = ["high", "medium", "low"]
        
        for priority in priorities:
            lead_data = {
                "name": f"Priority Test Lead - {priority.title()}",
                "company": f"{priority.title()} Priority Corp",
                "stage": "New Leads",
                "priority": priority,
                "notes": f"Testing {priority} priority in Kanban"
            }
            
            try:
                response = requests.post(
                    f"{self.base_url}/leads",
                    json=lead_data,
                    headers=self.get_auth_headers()
                )
                
                if response.status_code == 200:
                    lead = response.json()
                    priority_leads.append(lead)
                    self.log(f"✅ Created {priority} priority lead: {lead['name']}")
                else:
                    self.log(f"❌ Failed to create {priority} priority lead", "ERROR")
                    return False
            except Exception as e:
                self.log(f"❌ Exception creating {priority} priority lead: {str(e)}", "ERROR")
                return False
        
        # Verify priorities are preserved when moving through stages
        success_count = 0
        for lead in priority_leads:
            original_priority = lead["priority"]
            
            # Move to Contacted stage
            try:
                response = requests.patch(
                    f"{self.base_url}/leads/{lead['id']}/stage",
                    params={"stage": "Contacted"},
                    headers=self.get_auth_headers()
                )
                
                if response.status_code == 200:
                    # Verify priority is preserved
                    response = requests.get(
                        f"{self.base_url}/leads/{lead['id']}",
                        headers=self.get_auth_headers()
                    )
                    
                    if response.status_code == 200:
                        updated_lead = response.json()
                        if updated_lead["priority"] == original_priority:
                            self.log(f"✅ Priority preserved for {lead['name']}: {original_priority}")
                            success_count += 1
                        else:
                            self.log(f"❌ Priority changed for {lead['name']}: {original_priority} → {updated_lead['priority']}", "ERROR")
                    else:
                        self.log(f"❌ Failed to retrieve updated lead", "ERROR")
                else:
                    self.log(f"❌ Failed to move lead to Contacted stage", "ERROR")
            except Exception as e:
                self.log(f"❌ Exception testing priority preservation: {str(e)}", "ERROR")
        
        self.log(f"📊 Priority handling results: {success_count}/{len(priority_leads)} successful")
        return success_count == len(priority_leads)
    
    def run_kanban_tests(self):
        """Run all Kanban-specific backend integration tests"""
        self.log("🚀 Starting Kanban Backend Integration Tests")
        self.log(f"🔗 Testing against: {self.base_url}")
        self.log("="*60)
        
        # Step 1: Setup authentication
        if not self.register_test_user():
            self.log("❌ Failed to setup test user - aborting tests", "ERROR")
            return False
        
        # Step 2: Run Kanban-specific test suites
        test_results = {
            "Lead Creation (Various Fields)": self.test_lead_creation_various_fields(),
            "Kanban Stage Transitions": self.test_kanban_stage_transitions(),
            "Kanban Column Distribution": self.test_kanban_column_distribution(),
            "Kanban Data Retrieval": self.test_kanban_data_retrieval(),
            "Kanban Error Handling": self.test_kanban_error_handling(),
            "Kanban Priority Handling": self.test_kanban_priority_handling()
        }
        
        # Step 3: Summary
        self.log("\n" + "="*60)
        self.log("📋 KANBAN BACKEND INTEGRATION TEST SUMMARY")
        self.log("="*60)
        
        passed = 0
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} {test_name}")
            if result:
                passed += 1
        
        self.log("="*60)
        self.log(f"📊 OVERALL RESULT: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
        
        if passed == total:
            self.log("🎉 ALL KANBAN BACKEND TESTS PASSED - Drag-and-drop integration ready!")
            return True
        else:
            self.log("⚠️  Some Kanban tests failed - review issues above")
            return False

if __name__ == "__main__":
    tester = KanbanBackendTester()
    success = tester.run_kanban_tests()
    sys.exit(0 if success else 1)