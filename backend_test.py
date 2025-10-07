#!/usr/bin/env python3
"""
Backend Testing Suite for Strike CRM - Order Value Field Testing
Tests lead creation with new order_value field and notification functionality
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Backend URL from environment
BACKEND_URL = "https://bizcard-crm.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_email = f"testuser_{uuid.uuid4().hex[:8]}@strikecrm.com"
        self.test_user_password = "SecurePass123!"
        self.created_leads = []
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def register_test_user(self):
        """Register a test user for authentication"""
        self.log("Registering test user...")
        
        user_data = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "name": "Strike Test User",
            "company": "Strike CRM Testing Inc"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/register", json=user_data)
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data["access_token"]
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log("✅ User registration successful")
                return True
            else:
                self.log(f"❌ User registration failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ User registration error: {str(e)}", "ERROR")
            return False
    
    def test_lead_creation_with_order_value(self):
        """Test creating leads with different order values"""
        self.log("Testing lead creation with order_value field...")
        
        test_leads = [
            {
                "name": "Premium Enterprise Client",
                "company": "TechCorp Solutions",
                "phone": "+1-555-0101",
                "email": "contact@techcorp.com",
                "priority": "high",
                "order_value": 50000.00,  # Decimal value
                "notes": "High-value enterprise deal"
            },
            {
                "name": "Mid-Market Opportunity",
                "company": "GrowthCo Ltd",
                "phone": "+1-555-0102", 
                "email": "sales@growthco.com",
                "priority": "medium",
                "order_value": 15000,  # Integer value
                "notes": "Mid-market expansion opportunity"
            },
            {
                "name": "Small Business Lead",
                "company": "StartupXYZ",
                "phone": "+1-555-0103",
                "email": "founder@startupxyz.com", 
                "priority": "low",
                "order_value": 2500.50,  # Small decimal value
                "notes": "Small business starter package"
            }
        ]
        
        success_count = 0
        
        for i, lead_data in enumerate(test_leads, 1):
            try:
                self.log(f"Creating lead {i}/3: {lead_data['name']} (Order Value: ${lead_data['order_value']})")
                
                response = self.session.post(f"{BACKEND_URL}/leads", json=lead_data)
                
                if response.status_code == 200:
                    created_lead = response.json()
                    self.created_leads.append(created_lead)
                    
                    # Verify order_value is correctly stored
                    if created_lead.get("order_value") == lead_data["order_value"]:
                        self.log(f"✅ Lead created successfully with correct order_value: ${created_lead['order_value']}")
                        success_count += 1
                    else:
                        self.log(f"❌ Order value mismatch. Expected: ${lead_data['order_value']}, Got: ${created_lead.get('order_value')}", "ERROR")
                else:
                    self.log(f"❌ Lead creation failed: {response.status_code} - {response.text}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ Lead creation error: {str(e)}", "ERROR")
        
        self.log(f"Lead creation test completed: {success_count}/3 successful")
        return success_count == 3
    
    def test_lead_retrieval_with_order_value(self):
        """Test retrieving leads to verify order_value is returned correctly"""
        self.log("Testing lead retrieval with order_value...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/leads")
            
            if response.status_code == 200:
                leads = response.json()
                self.log(f"Retrieved {len(leads)} leads")
                
                # Verify each created lead has correct order_value
                success_count = 0
                for lead in leads:
                    if lead.get("order_value") is not None:
                        self.log(f"✅ Lead '{lead['name']}' has order_value: ${lead['order_value']}")
                        success_count += 1
                    else:
                        self.log(f"⚠️ Lead '{lead['name']}' missing order_value field")
                
                if success_count >= len(self.created_leads):
                    self.log("✅ All leads retrieved with order_value field")
                    return True
                else:
                    self.log(f"❌ Only {success_count}/{len(self.created_leads)} leads have order_value", "ERROR")
                    return False
            else:
                self.log(f"❌ Lead retrieval failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Lead retrieval error: {str(e)}", "ERROR")
            return False
    
    def test_dashboard_stats_with_new_leads(self):
        """Test dashboard stats to ensure they work with new leads"""
        self.log("Testing dashboard stats with new leads...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/dashboard/stats")
            
            if response.status_code == 200:
                stats = response.json()
                self.log("✅ Dashboard stats retrieved successfully")
                
                # Verify stats structure
                required_fields = ["total_leads", "leads_by_stage", "this_week_calls", "this_week_emails", "recent_activities"]
                missing_fields = [field for field in required_fields if field not in stats]
                
                if not missing_fields:
                    self.log(f"✅ Dashboard stats complete - Total leads: {stats['total_leads']}")
                    
                    # Verify leads by stage
                    if stats["leads_by_stage"]:
                        self.log("✅ Leads by stage data available:")
                        for stage, count in stats["leads_by_stage"].items():
                            self.log(f"   - {stage}: {count} leads")
                    
                    # Check if our created leads are reflected in total count
                    if stats["total_leads"] >= len(self.created_leads):
                        self.log("✅ Dashboard reflects new lead count")
                        return True
                    else:
                        self.log(f"❌ Dashboard total ({stats['total_leads']}) doesn't reflect created leads ({len(self.created_leads)})", "ERROR")
                        return False
                else:
                    self.log(f"❌ Dashboard stats missing fields: {missing_fields}", "ERROR")
                    return False
            else:
                self.log(f"❌ Dashboard stats failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Dashboard stats error: {str(e)}", "ERROR")
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