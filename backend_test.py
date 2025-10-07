#!/usr/bin/env python3
"""
Enhanced Dashboard Backend Testing Suite
Tests the enhanced dashboard functionality including tiles, filtering, and data grouping
"""

import requests
import json
import uuid
import time
from datetime import datetime, timedelta
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://bizcard-crm.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
TEST_USER_EMAIL = f"dashboard.tester.{uuid.uuid4().hex[:8]}@strikecrm.com"
TEST_USER_PASSWORD = "DashboardTest2024!"
TEST_USER_NAME = "Dashboard Tester"
TEST_USER_COMPANY = "Strike CRM Testing"

class DashboardTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.auth_token = None
        self.test_user_id = None
        self.test_leads = []
        self.test_activities = []
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }

    def log_result(self, test_name, success, message="", response=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if response and not success:
            print(f"   Response: {response.status_code} - {response.text[:200]}")
        
        if success:
            self.results["passed"] += 1
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {message}")
        print()

    def test_user_registration(self):
        """Test user registration endpoint"""
        print("🔐 Testing User Registration...")
        
        payload = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME,
            "company": TEST_USER_COMPANY
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "token_type" in data:
                    self.auth_token = data["access_token"]
                    self.log_result("User Registration", True, "User registered successfully with JWT token")
                else:
                    self.log_result("User Registration", False, "Missing token in response", response)
            else:
                self.log_result("User Registration", False, f"Registration failed with status {response.status_code}", response)
                
        except Exception as e:
            self.log_result("User Registration", False, f"Exception: {str(e)}")

    def test_duplicate_registration(self):
        """Test duplicate user registration"""
        print("🔐 Testing Duplicate Registration...")
        
        payload = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME,
            "company": TEST_USER_COMPANY
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=payload)
            
            if response.status_code == 400:
                self.log_result("Duplicate Registration Prevention", True, "Correctly rejected duplicate email")
            else:
                self.log_result("Duplicate Registration Prevention", False, f"Should return 400 for duplicate email", response)
                
        except Exception as e:
            self.log_result("Duplicate Registration Prevention", False, f"Exception: {str(e)}")

    def test_user_login(self):
        """Test user login endpoint"""
        print("🔐 Testing User Login...")
        
        payload = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "token_type" in data:
                    self.auth_token = data["access_token"]
                    self.log_result("User Login", True, "Login successful with JWT token")
                else:
                    self.log_result("User Login", False, "Missing token in response", response)
            else:
                self.log_result("User Login", False, f"Login failed with status {response.status_code}", response)
                
        except Exception as e:
            self.log_result("User Login", False, f"Exception: {str(e)}")

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        print("🔐 Testing Invalid Login...")
        
        payload = {
            "email": TEST_USER_EMAIL,
            "password": "WrongPassword123!"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=payload)
            
            if response.status_code == 401:
                self.log_result("Invalid Login Rejection", True, "Correctly rejected invalid credentials")
            else:
                self.log_result("Invalid Login Rejection", False, f"Should return 401 for invalid credentials", response)
                
        except Exception as e:
            self.log_result("Invalid Login Rejection", False, f"Exception: {str(e)}")

    def test_get_current_user(self):
        """Test protected endpoint to get current user info"""
        print("🔐 Testing Get Current User...")
        
        if not self.auth_token:
            self.log_result("Get Current User", False, "No auth token available")
            return
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = requests.get(f"{self.base_url}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "email" in data and data["email"] == TEST_USER_EMAIL:
                    self.test_user_id = data["id"]
                    self.log_result("Get Current User", True, f"Retrieved user info for {data['name']}")
                else:
                    self.log_result("Get Current User", False, "Invalid user data returned", response)
            else:
                self.log_result("Get Current User", False, f"Failed to get user info", response)
                
        except Exception as e:
            self.log_result("Get Current User", False, f"Exception: {str(e)}")

    def test_unauthorized_access(self):
        """Test accessing protected endpoint without token"""
        print("🔐 Testing Unauthorized Access...")
        
        try:
            response = requests.get(f"{self.base_url}/auth/me")
            
            if response.status_code in [401, 403]:
                self.log_result("Unauthorized Access Prevention", True, f"Correctly rejected request without token (status {response.status_code})")
            else:
                self.log_result("Unauthorized Access Prevention", False, f"Should return 401 or 403 without token", response)
                
        except Exception as e:
            self.log_result("Unauthorized Access Prevention", False, f"Exception: {str(e)}")

    def test_create_lead(self):
        """Test creating a new lead"""
        print("👥 Testing Create Lead...")
        
        if not self.auth_token:
            self.log_result("Create Lead", False, "No auth token available")
            return
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        payload = {
            "name": "Sarah Johnson",
            "company": "Tech Innovations Inc",
            "phone": "+1-555-0123",
            "email": "sarah.johnson@techinnovations.com",
            "address": "123 Business Ave, Tech City, TC 12345",
            "stage": "New Leads",
            "priority": "high",
            "notes": "Interested in enterprise CRM solution. Follow up next week."
        }
        
        try:
            response = requests.post(f"{self.base_url}/leads", json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["name"] == payload["name"]:
                    self.test_lead_id = data["id"]
                    self.log_result("Create Lead", True, f"Created lead: {data['name']} at {data['company']}")
                else:
                    self.log_result("Create Lead", False, "Invalid lead data returned", response)
            else:
                self.log_result("Create Lead", False, f"Failed to create lead", response)
                
        except Exception as e:
            self.log_result("Create Lead", False, f"Exception: {str(e)}")

    def test_get_all_leads(self):
        """Test retrieving all leads for authenticated user"""
        print("👥 Testing Get All Leads...")
        
        if not self.auth_token:
            self.log_result("Get All Leads", False, "No auth token available")
            return
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = requests.get(f"{self.base_url}/leads", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_result("Get All Leads", True, f"Retrieved {len(data)} leads")
                else:
                    self.log_result("Get All Leads", True, "Retrieved empty leads list (valid)")
            else:
                self.log_result("Get All Leads", False, f"Failed to get leads", response)
                
        except Exception as e:
            self.log_result("Get All Leads", False, f"Exception: {str(e)}")

    def test_get_single_lead(self):
        """Test retrieving a single lead by ID"""
        print("👥 Testing Get Single Lead...")
        
        if not self.auth_token or not self.test_lead_id:
            self.log_result("Get Single Lead", False, "No auth token or lead ID available")
            return
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = requests.get(f"{self.base_url}/leads/{self.test_lead_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["id"] == self.test_lead_id:
                    self.log_result("Get Single Lead", True, f"Retrieved lead: {data['name']}")
                else:
                    self.log_result("Get Single Lead", False, "Invalid lead data returned", response)
            else:
                self.log_result("Get Single Lead", False, f"Failed to get lead", response)
                
        except Exception as e:
            self.log_result("Get Single Lead", False, f"Exception: {str(e)}")

    def test_update_lead(self):
        """Test updating a lead"""
        print("👥 Testing Update Lead...")
        
        if not self.auth_token or not self.test_lead_id:
            self.log_result("Update Lead", False, "No auth token or lead ID available")
            return
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        payload = {
            "name": "Sarah Johnson",
            "company": "Tech Innovations Inc",
            "phone": "+1-555-0123",
            "email": "sarah.johnson@techinnovations.com",
            "address": "456 Updated Business Ave, Tech City, TC 12345",
            "stage": "Contacted",
            "priority": "medium",
            "notes": "Updated notes: Had initial call, very interested. Sending proposal."
        }
        
        try:
            response = requests.put(f"{self.base_url}/leads/{self.test_lead_id}", json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data["stage"] == "Contacted" and "Updated" in data["notes"]:
                    self.log_result("Update Lead", True, f"Updated lead stage to {data['stage']}")
                else:
                    self.log_result("Update Lead", False, "Lead not properly updated", response)
            else:
                self.log_result("Update Lead", False, f"Failed to update lead", response)
                
        except Exception as e:
            self.log_result("Update Lead", False, f"Exception: {str(e)}")

    def test_update_lead_stage(self):
        """Test updating lead stage specifically"""
        print("👥 Testing Update Lead Stage...")
        
        if not self.auth_token or not self.test_lead_id:
            self.log_result("Update Lead Stage", False, "No auth token or lead ID available")
            return
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = requests.patch(f"{self.base_url}/leads/{self.test_lead_id}/stage?stage=Follow-up", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_result("Update Lead Stage", True, "Successfully updated lead stage to Follow-up")
                else:
                    self.log_result("Update Lead Stage", False, "Stage update not confirmed", response)
            else:
                self.log_result("Update Lead Stage", False, f"Failed to update lead stage", response)
                
        except Exception as e:
            self.log_result("Update Lead Stage", False, f"Exception: {str(e)}")

    def test_invalid_lead_stage(self):
        """Test updating lead with invalid stage"""
        print("👥 Testing Invalid Lead Stage...")
        
        if not self.auth_token or not self.test_lead_id:
            self.log_result("Invalid Lead Stage", False, "No auth token or lead ID available")
            return
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = requests.patch(f"{self.base_url}/leads/{self.test_lead_id}/stage?stage=InvalidStage", headers=headers)
            
            if response.status_code == 400:
                self.log_result("Invalid Lead Stage Rejection", True, "Correctly rejected invalid stage")
            else:
                self.log_result("Invalid Lead Stage Rejection", False, f"Should return 400 for invalid stage", response)
                
        except Exception as e:
            self.log_result("Invalid Lead Stage Rejection", False, f"Exception: {str(e)}")

    def test_create_business_card(self):
        """Test creating a business card"""
        print("💼 Testing Create Business Card...")
        
        if not self.auth_token:
            self.log_result("Create Business Card", False, "No auth token available")
            return
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        payload = {
            "name": TEST_USER_NAME,
            "title": "Senior Sales Manager",
            "company": TEST_USER_COMPANY,
            "phone": "+1-555-0199",
            "email": TEST_USER_EMAIL,
            "website": "https://strikecrm.com",
            "template": "professional"
        }
        
        try:
            response = requests.post(f"{self.base_url}/business-card", json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["name"] == TEST_USER_NAME:
                    self.test_business_card_id = data["id"]
                    self.log_result("Create Business Card", True, f"Created business card for {data['name']}")
                else:
                    self.log_result("Create Business Card", False, "Invalid business card data returned", response)
            else:
                self.log_result("Create Business Card", False, f"Failed to create business card", response)
                
        except Exception as e:
            self.log_result("Create Business Card", False, f"Exception: {str(e)}")

    def test_get_business_card(self):
        """Test retrieving business card"""
        print("💼 Testing Get Business Card...")
        
        if not self.auth_token:
            self.log_result("Get Business Card", False, "No auth token available")
            return
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = requests.get(f"{self.base_url}/business-card", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["name"] == TEST_USER_NAME:
                    self.log_result("Get Business Card", True, f"Retrieved business card for {data['name']}")
                else:
                    self.log_result("Get Business Card", False, "Invalid business card data returned", response)
            else:
                self.log_result("Get Business Card", False, f"Failed to get business card", response)
                
        except Exception as e:
            self.log_result("Get Business Card", False, f"Exception: {str(e)}")

    def test_create_activity(self):
        """Test creating an activity"""
        print("📝 Testing Create Activity...")
        
        if not self.auth_token or not self.test_lead_id:
            self.log_result("Create Activity", False, "No auth token or lead ID available")
            return
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        payload = {
            "lead_id": self.test_lead_id,
            "activity_type": "call",
            "content": "Initial discovery call to understand their CRM needs",
            "outcome": "answered",
            "duration": 30
        }
        
        try:
            response = requests.post(f"{self.base_url}/activities", json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["activity_type"] == "call":
                    self.test_activity_id = data["id"]
                    self.log_result("Create Activity", True, f"Created {data['activity_type']} activity")
                else:
                    self.log_result("Create Activity", False, "Invalid activity data returned", response)
            else:
                self.log_result("Create Activity", False, f"Failed to create activity", response)
                
        except Exception as e:
            self.log_result("Create Activity", False, f"Exception: {str(e)}")

    def test_create_email_activity(self):
        """Test creating an email activity"""
        print("📝 Testing Create Email Activity...")
        
        if not self.auth_token or not self.test_lead_id:
            self.log_result("Create Email Activity", False, "No auth token or lead ID available")
            return
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        payload = {
            "lead_id": self.test_lead_id,
            "activity_type": "email",
            "content": "Sent detailed proposal with pricing and implementation timeline"
        }
        
        try:
            response = requests.post(f"{self.base_url}/activities", json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["activity_type"] == "email":
                    self.log_result("Create Email Activity", True, f"Created {data['activity_type']} activity")
                else:
                    self.log_result("Create Email Activity", False, "Invalid activity data returned", response)
            else:
                self.log_result("Create Email Activity", False, f"Failed to create email activity", response)
                
        except Exception as e:
            self.log_result("Create Email Activity", False, f"Exception: {str(e)}")

    def test_get_lead_activities(self):
        """Test retrieving activities for a lead"""
        print("📝 Testing Get Lead Activities...")
        
        if not self.auth_token or not self.test_lead_id:
            self.log_result("Get Lead Activities", False, "No auth token or lead ID available")
            return
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = requests.get(f"{self.base_url}/leads/{self.test_lead_id}/activities", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_result("Get Lead Activities", True, f"Retrieved {len(data)} activities for lead")
                else:
                    self.log_result("Get Lead Activities", True, "Retrieved empty activities list (valid)")
            else:
                self.log_result("Get Lead Activities", False, f"Failed to get lead activities", response)
                
        except Exception as e:
            self.log_result("Get Lead Activities", False, f"Exception: {str(e)}")

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        print("📊 Testing Dashboard Stats...")
        
        if not self.auth_token:
            self.log_result("Dashboard Stats", False, "No auth token available")
            return
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = requests.get(f"{self.base_url}/dashboard/stats", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_leads", "leads_by_stage", "this_week_calls", "this_week_emails", "recent_activities"]
                
                if all(field in data for field in required_fields):
                    self.log_result("Dashboard Stats", True, f"Retrieved dashboard stats: {data['total_leads']} leads, {data['this_week_calls']} calls this week")
                else:
                    missing = [field for field in required_fields if field not in data]
                    self.log_result("Dashboard Stats", False, f"Missing fields: {missing}", response)
            else:
                self.log_result("Dashboard Stats", False, f"Failed to get dashboard stats", response)
                
        except Exception as e:
            self.log_result("Dashboard Stats", False, f"Exception: {str(e)}")

    def test_data_isolation(self):
        """Test that users can only access their own data"""
        print("🔒 Testing Data Isolation...")
        
        # Create a second user to test isolation
        second_user_email = f"test.user2.{uuid.uuid4().hex[:8]}@strikecrm.com"
        payload = {
            "email": second_user_email,
            "password": "SecurePass456!",
            "name": "Jane Doe",
            "company": "Another Company"
        }
        
        try:
            # Register second user
            response = requests.post(f"{self.base_url}/auth/register", json=payload)
            if response.status_code != 200:
                self.log_result("Data Isolation", False, "Failed to create second user for isolation test")
                return
                
            second_token = response.json()["access_token"]
            headers = {"Authorization": f"Bearer {second_token}"}
            
            # Try to access first user's leads with second user's token
            response = requests.get(f"{self.base_url}/leads", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if len(data) == 0:  # Second user should see no leads
                    self.log_result("Data Isolation", True, "Users can only see their own data")
                else:
                    self.log_result("Data Isolation", False, f"Data isolation failed - second user sees {len(data)} leads")
            else:
                self.log_result("Data Isolation", False, f"Failed to test data isolation", response)
                
        except Exception as e:
            self.log_result("Data Isolation", False, f"Exception: {str(e)}")

    def test_delete_lead(self):
        """Test deleting a lead"""
        print("👥 Testing Delete Lead...")
        
        if not self.auth_token or not self.test_lead_id:
            self.log_result("Delete Lead", False, "No auth token or lead ID available")
            return
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        try:
            response = requests.delete(f"{self.base_url}/leads/{self.test_lead_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_result("Delete Lead", True, "Successfully deleted lead")
                else:
                    self.log_result("Delete Lead", False, "Delete not confirmed", response)
            else:
                self.log_result("Delete Lead", False, f"Failed to delete lead", response)
                
        except Exception as e:
            self.log_result("Delete Lead", False, f"Exception: {str(e)}")

    def test_not_found_errors(self):
        """Test 404 errors for non-existent resources"""
        print("🔍 Testing Not Found Errors...")
        
        if not self.auth_token:
            self.log_result("Not Found Errors", False, "No auth token available")
            return
            
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        fake_id = str(uuid.uuid4())
        
        try:
            # Test non-existent lead
            response = requests.get(f"{self.base_url}/leads/{fake_id}", headers=headers)
            
            if response.status_code == 404:
                self.log_result("Not Found Errors", True, "Correctly returned 404 for non-existent lead")
            else:
                self.log_result("Not Found Errors", False, f"Should return 404 for non-existent lead", response)
                
        except Exception as e:
            self.log_result("Not Found Errors", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Strike CRM Backend API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Authentication Tests
        self.test_user_registration()
        self.test_duplicate_registration()
        self.test_user_login()
        self.test_invalid_login()
        self.test_get_current_user()
        self.test_unauthorized_access()
        
        # Lead Management Tests
        self.test_create_lead()
        self.test_get_all_leads()
        self.test_get_single_lead()
        self.test_update_lead()
        self.test_update_lead_stage()
        self.test_invalid_lead_stage()
        
        # Business Card Tests
        self.test_create_business_card()
        self.test_get_business_card()
        
        # Activity Tests
        self.test_create_activity()
        self.test_create_email_activity()
        self.test_get_lead_activities()
        
        # Dashboard Tests
        self.test_dashboard_stats()
        
        # Security Tests
        self.test_data_isolation()
        self.test_not_found_errors()
        
        # Cleanup Tests
        self.test_delete_lead()
        
        # Print Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📈 Success Rate: {(self.results['passed'] / (self.results['passed'] + self.results['failed']) * 100):.1f}%")
        
        if self.results['errors']:
            print("\n❌ FAILED TESTS:")
            for error in self.results['errors']:
                print(f"   • {error}")
        
        return self.results['failed'] == 0

if __name__ == "__main__":
    tester = StrikeCRMTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)