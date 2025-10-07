#!/usr/bin/env python3
"""
Strike CRM Backend API Testing Suite - Phase 2 Implementation
Comprehensive testing for all critical backend APIs including:
- Lead CRUD with Order Value Field
- Lead Stage Updates for Kanban
- Dashboard Stats API for Enhanced Tiles  
- Authentication Flow
- Activity Logging
"""

import requests
import json
import sys
from datetime import datetime
import uuid
from typing import Dict, Any, List

# Backend URL from environment
BACKEND_URL = "https://strike-crm.preview.emergentagent.com/api"

class StrikeCRMTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_email = f"testuser_{uuid.uuid4().hex[:8]}@strikecrm.com"
        self.test_user_password = "SecurePass123!"
        self.created_leads = []
        self.created_activities = []
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_authentication_flow(self) -> bool:
        """Test complete authentication flow including JWT validation"""
        self.log("🔐 Testing Authentication Flow")
        
        try:
            # Test user registration
            user_data = {
                "email": self.test_user_email,
                "password": self.test_user_password,
                "name": "Strike Test User",
                "company": "Strike CRM Testing Inc"
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/register", json=user_data)
            
            if response.status_code == 400 and "already registered" in response.text:
                self.log("User already exists, testing login instead")
                
                # Test login
                login_data = {
                    "email": self.test_user_email,
                    "password": self.test_user_password
                }
                
                response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
                
            if response.status_code != 200:
                self.log(f"❌ Auth failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
            auth_data = response.json()
            self.auth_token = auth_data["access_token"]
            self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
            self.log("✅ Authentication successful, token obtained")
            
            # Test /auth/me endpoint
            response = self.session.get(f"{BACKEND_URL}/auth/me")
            if response.status_code != 200:
                self.log(f"❌ Auth/me failed: {response.status_code}", "ERROR")
                return False
                
            user_data = response.json()
            self.log(f"✅ User profile retrieved: {user_data['name']}")
            
            # Test protected endpoint without token
            temp_headers = self.session.headers.copy()
            del self.session.headers["Authorization"]
            
            response = self.session.get(f"{BACKEND_URL}/leads")
            if response.status_code != 401:
                self.log(f"❌ Protected endpoint should return 401, got {response.status_code}", "ERROR")
                return False
                
            self.session.headers = temp_headers
            self.log("✅ Protected endpoints properly secured")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Authentication test failed: {e}", "ERROR")
            return False
    
    def test_lead_crud_with_order_value(self) -> bool:
        """Test Lead CRUD operations with order_value field"""
        self.log("💰 Testing Lead CRUD with Order Value Field")
        
        try:
            # Test creating leads with various order values
            test_leads_data = [
                {
                    "name": "John Smith",
                    "company": "Tech Solutions Inc",
                    "phone": "+1-555-0101",
                    "email": "john@techsolutions.com",
                    "stage": "New Leads",
                    "priority": "high",
                    "order_value": 15000.0,
                    "notes": "High-value enterprise client"
                },
                {
                    "name": "Sarah Johnson",
                    "company": "Marketing Pro",
                    "phone": "+1-555-0102", 
                    "email": "sarah@marketingpro.com",
                    "stage": "Contacted",
                    "priority": "medium",
                    "order_value": 2500.50,
                    "notes": "Small business marketing package"
                },
                {
                    "name": "Mike Wilson",
                    "company": "Wilson Consulting",
                    "phone": "+1-555-0103",
                    "email": "mike@wilsonconsulting.com", 
                    "stage": "Follow-up",
                    "priority": "low",
                    "order_value": None,
                    "notes": "Potential consulting engagement"
                }
            ]
            
            # Create leads
            for lead_data in test_leads_data:
                response = self.session.post(f"{BACKEND_URL}/leads", json=lead_data)
                if response.status_code != 200:
                    self.log(f"❌ Lead creation failed: {response.status_code} - {response.text}", "ERROR")
                    return False
                    
                lead = response.json()
                self.created_leads.append(lead)
                
                # Verify order_value field
                expected_value = lead_data["order_value"]
                actual_value = lead.get("order_value")
                
                if expected_value != actual_value:
                    self.log(f"❌ Order value mismatch: expected {expected_value}, got {actual_value}", "ERROR")
                    return False
                    
                self.log(f"✅ Lead created: {lead['name']} with order_value: ${actual_value}")
                
            # Test retrieving all leads
            response = self.session.get(f"{BACKEND_URL}/leads")
            if response.status_code != 200:
                self.log(f"❌ Get leads failed: {response.status_code}", "ERROR")
                return False
                
            all_leads = response.json()
            self.log(f"✅ Retrieved {len(all_leads)} leads")
            
            # Verify order_value fields are present
            for lead in all_leads:
                if "order_value" not in lead:
                    self.log(f"❌ Missing order_value field in lead: {lead['name']}", "ERROR")
                    return False
                    
            # Test updating a lead's order_value
            if self.created_leads:
                lead_to_update = self.created_leads[0]
                update_data = {
                    "name": lead_to_update["name"],
                    "company": lead_to_update["company"],
                    "phone": lead_to_update["phone"],
                    "email": lead_to_update["email"],
                    "stage": lead_to_update["stage"],
                    "priority": lead_to_update["priority"],
                    "order_value": 55000.0,  # Updated value
                    "notes": lead_to_update["notes"]
                }
                
                response = self.session.put(f"{BACKEND_URL}/leads/{lead_to_update['id']}", json=update_data)
                if response.status_code != 200:
                    self.log(f"❌ Lead update failed: {response.status_code}", "ERROR")
                    return False
                    
                updated_lead = response.json()
                if updated_lead["order_value"] != 55000.0:
                    self.log(f"❌ Order value update failed: expected 55000.0, got {updated_lead['order_value']}", "ERROR")
                    return False
                    
                self.log(f"✅ Lead order_value updated: ${lead_to_update['order_value']} → ${updated_lead['order_value']}")
                
            return True
            
        except Exception as e:
            self.log(f"❌ Lead CRUD test failed: {e}", "ERROR")
            return False
            
    def test_lead_stage_updates(self) -> bool:
        """Test PATCH /api/leads/{id}/stage for Kanban functionality"""
        self.log("🎯 Testing Lead Stage Updates for Kanban")
        
        try:
            if not self.created_leads:
                self.log("❌ No test leads available for stage testing", "ERROR")
                return False
                
            # Test all valid stage transitions
            valid_stages = ["New Leads", "Contacted", "Follow-up", "Negotiation", "Closed"]
            lead_id = self.created_leads[0]["id"]
            
            for stage in valid_stages:
                response = self.session.patch(f"{BACKEND_URL}/leads/{lead_id}/stage", params={"stage": stage})
                
                if response.status_code != 200:
                    self.log(f"❌ Stage update failed for {stage}: {response.status_code} - {response.text}", "ERROR")
                    return False
                    
                result = response.json()
                if not result.get("success"):
                    self.log(f"❌ Stage update returned unsuccessful result for {stage}", "ERROR")
                    return False
                    
                self.log(f"✅ Stage updated to: {stage}")
                
            # Test invalid stage
            response = self.session.patch(f"{BACKEND_URL}/leads/{lead_id}/stage", params={"stage": "InvalidStage"})
            if response.status_code != 400:
                self.log(f"❌ Invalid stage should return 400, got {response.status_code}", "ERROR")
                return False
                
            self.log("✅ Invalid stage properly rejected")
            
            # Test non-existent lead
            fake_lead_id = "non-existent-lead-id"
            response = self.session.patch(f"{BACKEND_URL}/leads/{fake_lead_id}/stage", params={"stage": "Contacted"})
            if response.status_code != 404:
                self.log(f"❌ Non-existent lead should return 404, got {response.status_code}", "ERROR")
                return False
                
            self.log("✅ Non-existent lead properly handled")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Lead stage update test failed: {e}", "ERROR")
            return False
            
    def test_dashboard_stats_api(self) -> bool:
        """Test GET /api/dashboard/stats for enhanced tiles"""
        self.log("📊 Testing Dashboard Stats API")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/dashboard/stats")
            if response.status_code != 200:
                self.log(f"❌ Dashboard stats failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
            stats = response.json()
            
            # Verify required fields for enhanced tiles
            required_fields = ["total_leads", "leads_by_stage", "this_week_calls", "this_week_emails", "recent_activities"]
            
            for field in required_fields:
                if field not in stats:
                    self.log(f"❌ Missing required field in dashboard stats: {field}", "ERROR")
                    return False
                    
            self.log("✅ Dashboard stats structure valid")
            
            # Verify leads_by_stage has proper structure
            leads_by_stage = stats["leads_by_stage"]
            if not isinstance(leads_by_stage, dict):
                self.log("❌ leads_by_stage should be a dictionary", "ERROR")
                return False
                
            self.log(f"✅ Leads by stage: {leads_by_stage}")
            
            # Verify recent_activities is a list
            recent_activities = stats["recent_activities"]
            if not isinstance(recent_activities, list):
                self.log("❌ recent_activities should be a list", "ERROR")
                return False
                
            self.log(f"✅ Recent activities count: {len(recent_activities)}")
            
            # Verify numeric fields
            numeric_fields = ["total_leads", "this_week_calls", "this_week_emails"]
            for field in numeric_fields:
                if not isinstance(stats[field], int):
                    self.log(f"❌ {field} should be an integer, got {type(stats[field])}", "ERROR")
                    return False
                    
            self.log(f"✅ Dashboard metrics - Total leads: {stats['total_leads']}, Calls: {stats['this_week_calls']}, Emails: {stats['this_week_emails']}")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Dashboard stats test failed: {e}", "ERROR")
            return False
    
    def test_order_value_edge_cases(self):
        """Test edge cases for order_value field"""
        self.log("Testing order_value edge cases...")
        
        edge_cases = [
            {
                "name": "Zero Value Lead",
                "company": "Free Trial Co",
                "email": "trial@freetrial.com",
                "order_value": 0.0,
                "priority": "low"
            },
            {
                "name": "No Order Value Lead", 
                "company": "Unknown Value Corp",
                "email": "unknown@corp.com",
                "priority": "medium"
                # No order_value field - should default to None
            },
            {
                "name": "Large Order Value Lead",
                "company": "Enterprise Mega Corp",
                "email": "enterprise@megacorp.com", 
                "order_value": 999999.99,
                "priority": "high"
            }
        ]
        
        success_count = 0
        
        for i, lead_data in enumerate(edge_cases, 1):
            try:
                self.log(f"Testing edge case {i}/3: {lead_data['name']}")
                
                response = self.session.post(f"{BACKEND_URL}/leads", json=lead_data)
                
                if response.status_code == 200:
                    created_lead = response.json()
                    expected_value = lead_data.get("order_value")
                    actual_value = created_lead.get("order_value")
                    
                    if expected_value == actual_value:
                        self.log(f"✅ Edge case handled correctly: order_value = {actual_value}")
                        success_count += 1
                    else:
                        self.log(f"❌ Edge case failed. Expected: {expected_value}, Got: {actual_value}", "ERROR")
                else:
                    self.log(f"❌ Edge case creation failed: {response.status_code} - {response.text}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ Edge case error: {str(e)}", "ERROR")
        
        self.log(f"Edge case testing completed: {success_count}/3 successful")
        return success_count == 3
    
    def test_lead_update_with_order_value(self):
        """Test updating leads with order_value changes"""
        if not self.created_leads:
            self.log("❌ No leads available for update testing", "ERROR")
            return False
            
        self.log("Testing lead updates with order_value changes...")
        
        try:
            # Update the first created lead
            lead_to_update = self.created_leads[0]
            original_value = lead_to_update["order_value"]
            new_value = original_value + 5000.00 if original_value else 10000.00
            
            update_data = {
                "name": lead_to_update["name"],
                "company": lead_to_update["company"],
                "phone": lead_to_update.get("phone"),
                "email": lead_to_update.get("email"),
                "priority": lead_to_update["priority"],
                "order_value": new_value,
                "notes": f"Updated order value from ${original_value} to ${new_value}"
            }
            
            response = self.session.put(f"{BACKEND_URL}/leads/{lead_to_update['id']}", json=update_data)
            
            if response.status_code == 200:
                updated_lead = response.json()
                if updated_lead["order_value"] == new_value:
                    self.log(f"✅ Lead update successful: order_value changed from ${original_value} to ${new_value}")
                    return True
                else:
                    self.log(f"❌ Order value not updated correctly. Expected: ${new_value}, Got: ${updated_lead['order_value']}", "ERROR")
                    return False
            else:
                self.log(f"❌ Lead update failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Lead update error: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all backend tests for order_value functionality"""
        self.log("🚀 Starting Strike CRM Backend Tests - Order Value Field Testing")
        self.log("=" * 70)
        
        # Authentication
        if not self.register_test_user():
            self.log("❌ Authentication failed - cannot proceed with tests", "ERROR")
            return False
        
        # Test results tracking
        test_results = {}
        
        # Run all tests
        test_results["lead_creation"] = self.test_lead_creation_with_order_value()
        test_results["lead_retrieval"] = self.test_lead_retrieval_with_order_value()
        test_results["dashboard_stats"] = self.test_dashboard_stats_with_new_leads()
        test_results["edge_cases"] = self.test_order_value_edge_cases()
        test_results["lead_updates"] = self.test_lead_update_with_order_value()
        
        # Summary
        self.log("=" * 70)
        self.log("🎯 TEST SUMMARY")
        self.log("=" * 70)
        
        passed_tests = sum(test_results.values())
        total_tests = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            self.log(f"{test_name.replace('_', ' ').title()}: {status}")
        
        self.log(f"\nOverall Result: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            self.log("🎉 ALL TESTS PASSED - Order value functionality working correctly!")
            return True
        else:
            self.log(f"⚠️ {total_tests - passed_tests} test(s) failed - requires attention")
            return False

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)