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

    def log_result(self, test_name, success, message="", response=None):
        """Log test results with enhanced formatting"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"[{timestamp}] {status}: {test_name}")
        if message:
            print(f"   📝 {message}")
        if response and not success:
            print(f"   🔍 Response: {response.status_code} - {response.text[:200]}")
        
        if success:
            self.results["passed"] += 1
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {message}")
        print()

    def register_test_user(self):
        """Register a test user for dashboard testing"""
        print("🔐 Setting up test user for dashboard testing...")
        
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
                if "access_token" in data:
                    self.auth_token = data["access_token"]
                    self.log_result("Dashboard User Registration", True, f"Registered user: {TEST_USER_NAME}")
                    return True
                else:
                    self.log_result("Dashboard User Registration", False, "Missing token in response", response)
                    return False
            elif response.status_code == 400 and "already registered" in response.text:
                # User exists, try to login
                return self.login_test_user()
            else:
                self.log_result("Dashboard User Registration", False, f"Registration failed", response)
                return False
                
        except Exception as e:
            self.log_result("Dashboard User Registration", False, f"Exception: {str(e)}")
            return False

    def login_test_user(self):
        """Login with test user credentials"""
        try:
            response = requests.post(f"{self.base_url}/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data["access_token"]
                self.log_result("Dashboard User Login", True, "Successfully logged in existing user")
                return True
            else:
                self.log_result("Dashboard User Login", False, "Login failed", response)
                return False
        except Exception as e:
            self.log_result("Dashboard User Login", False, f"Exception: {str(e)}")
            return False

    def get_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.auth_token}"}

    def create_test_leads_for_dashboard(self):
        """Create comprehensive test leads across all stages for dashboard testing"""
        print("👥 Creating test leads for dashboard analytics...")
        
        test_leads_data = [
            # New Leads (2 leads)
            {
                "name": "Sarah Johnson",
                "company": "TechStart Inc",
                "phone": "+1-555-0101",
                "email": "sarah@techstart.com",
                "stage": "New Leads",
                "priority": "high",
                "notes": "Interested in enterprise solution"
            },
            {
                "name": "Robert Wilson",
                "company": "Smart Analytics",
                "phone": "+1-555-0106",
                "email": "robert@smartanalytics.com",
                "stage": "New Leads",
                "priority": "low",
                "notes": "New lead from website"
            },
            # Contacted (2 leads)
            {
                "name": "Michael Chen",
                "company": "Digital Solutions",
                "phone": "+1-555-0102",
                "email": "michael@digitalsol.com",
                "stage": "Contacted",
                "priority": "medium",
                "notes": "Initial contact made, waiting for response"
            },
            {
                "name": "Jennifer Davis",
                "company": "Cloud Systems",
                "phone": "+1-555-0107",
                "email": "jennifer@cloudsystems.com",
                "stage": "Contacted",
                "priority": "high",
                "notes": "Contacted via phone, interested"
            },
            # Follow-up (1 lead)
            {
                "name": "Emily Rodriguez",
                "company": "Growth Ventures",
                "phone": "+1-555-0103",
                "email": "emily@growthventures.com",
                "stage": "Follow-up",
                "priority": "high",
                "notes": "Follow-up scheduled for next week"
            },
            # Negotiation (1 lead)
            {
                "name": "David Kim",
                "company": "Innovation Labs",
                "phone": "+1-555-0104",
                "email": "david@innovationlabs.com",
                "stage": "Negotiation",
                "priority": "high",
                "notes": "In final negotiation phase"
            },
            # Closed (1 lead)
            {
                "name": "Lisa Thompson",
                "company": "Future Systems",
                "phone": "+1-555-0105",
                "email": "lisa@futuresystems.com",
                "stage": "Closed",
                "priority": "medium",
                "notes": "Deal closed successfully"
            }
        ]
        
        created_count = 0
        for lead_data in test_leads_data:
            try:
                response = requests.post(f"{self.base_url}/leads", 
                                       json=lead_data, 
                                       headers=self.get_headers())
                if response.status_code == 200:
                    lead = response.json()
                    self.test_leads.append(lead)
                    created_count += 1
                else:
                    self.log_result(f"Create Lead {lead_data['name']}", False, f"Failed to create", response)
            except Exception as e:
                self.log_result(f"Create Lead {lead_data['name']}", False, f"Exception: {str(e)}")
        
        self.log_result("Dashboard Test Data Creation", created_count == len(test_leads_data), 
                       f"Created {created_count}/{len(test_leads_data)} test leads")
        return created_count > 0

    def create_test_activities_for_dashboard(self):
        """Create test activities for dashboard analytics"""
        print("📝 Creating test activities for dashboard analytics...")
        
        if not self.test_leads:
            self.log_result("Create Dashboard Activities", False, "No test leads available")
            return False
        
        activities_data = [
            # Call activities
            {
                "lead_id": self.test_leads[0]["id"],
                "activity_type": "call",
                "content": "Initial discovery call",
                "outcome": "answered",
                "duration": 30
            },
            {
                "lead_id": self.test_leads[2]["id"],
                "activity_type": "call",
                "content": "Follow-up call",
                "outcome": "callback_needed",
                "duration": 15
            },
            {
                "lead_id": self.test_leads[4]["id"],
                "activity_type": "call",
                "content": "Negotiation call",
                "outcome": "answered",
                "duration": 45
            },
            # Email activities
            {
                "lead_id": self.test_leads[1]["id"],
                "activity_type": "email",
                "content": "Sent product demo information"
            },
            {
                "lead_id": self.test_leads[0]["id"],
                "activity_type": "email",
                "content": "Sent pricing proposal"
            },
            {
                "lead_id": self.test_leads[3]["id"],
                "activity_type": "email",
                "content": "Follow-up email with additional resources"
            }
        ]
        
        created_count = 0
        for activity_data in activities_data:
            try:
                response = requests.post(f"{self.base_url}/activities", 
                                       json=activity_data, 
                                       headers=self.get_headers())
                if response.status_code == 200:
                    activity = response.json()
                    self.test_activities.append(activity)
                    created_count += 1
                else:
                    self.log_result(f"Create Activity", False, f"Failed to create activity", response)
            except Exception as e:
                self.log_result(f"Create Activity", False, f"Exception: {str(e)}")
        
        self.log_result("Dashboard Activities Creation", created_count == len(activities_data), 
                       f"Created {created_count}/{len(activities_data)} test activities")
        return created_count > 0

    def test_enhanced_dashboard_stats_api(self):
        """Test the enhanced dashboard stats API with comprehensive validation"""
        print("📊 Testing Enhanced Dashboard Stats API...")
        
        try:
            start_time = time.time()
            response = requests.get(f"{self.base_url}/dashboard/stats", headers=self.get_headers())
            response_time = time.time() - start_time
            
            if response.status_code != 200:
                self.log_result("Enhanced Dashboard Stats API", False, f"API call failed", response)
                return False
            
            data = response.json()
            
            # Verify required fields
            required_fields = ["total_leads", "leads_by_stage", "this_week_calls", "this_week_emails", "recent_activities"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_result("Dashboard API Structure", False, f"Missing fields: {missing_fields}")
                return False
            
            self.log_result("Dashboard API Structure", True, "All required fields present")
            
            # Test data accuracy
            total_leads = data['total_leads']
            leads_by_stage = data['leads_by_stage']
            
            # Verify stage totals match total leads
            stage_total = sum(leads_by_stage.values())
            if stage_total != total_leads:
                self.log_result("Dashboard Data Consistency", False, 
                               f"Stage totals ({stage_total}) don't match total leads ({total_leads})")
                return False
            
            self.log_result("Dashboard Data Consistency", True, 
                           f"Total leads ({total_leads}) matches stage distribution")
            
            # Verify stage data grouping
            expected_stages = ["New Leads", "Contacted", "Follow-up", "Negotiation", "Closed"]
            present_stages = list(leads_by_stage.keys())
            
            self.log_result("Pipeline Data Grouping", True, 
                           f"Stages present: {present_stages}")
            
            # Test activity metrics
            calls_count = data['this_week_calls']
            emails_count = data['this_week_emails']
            
            self.log_result("Activity Metrics", True, 
                           f"This week: {calls_count} calls, {emails_count} emails")
            
            # Test recent activities structure
            recent_activities = data['recent_activities']
            if recent_activities:
                activity = recent_activities[0]
                required_activity_fields = ["id", "lead_id", "activity_type", "content", "user_id", "created_at"]
                missing_activity_fields = [field for field in required_activity_fields if field not in activity]
                
                if missing_activity_fields:
                    self.log_result("Recent Activities Structure", False, 
                                   f"Missing activity fields: {missing_activity_fields}")
                    return False
                
                self.log_result("Recent Activities Structure", True, 
                               f"Activities properly formatted ({len(recent_activities)} activities)")
            
            # Test API performance
            if response_time > 2.0:
                self.log_result("Dashboard API Performance", False, 
                               f"Response time too slow: {response_time:.3f}s")
                return False
            else:
                self.log_result("Dashboard API Performance", True, 
                               f"Good response time: {response_time:.3f}s")
            
            # Print detailed dashboard summary
            print(f"   📊 Dashboard Summary:")
            print(f"      Total Leads: {total_leads}")
            print(f"      Stage Distribution: {leads_by_stage}")
            print(f"      Weekly Activity: {calls_count} calls, {emails_count} emails")
            print(f"      Recent Activities: {len(recent_activities)} items")
            print(f"      Response Time: {response_time:.3f}s")
            
            return True
            
        except Exception as e:
            self.log_result("Enhanced Dashboard Stats API", False, f"Exception: {str(e)}")
            return False

    def test_leads_api_for_pipeline_verification(self):
        """Test leads API specifically for pipeline data verification"""
        print("🔄 Testing Leads API for Pipeline Verification...")
        
        try:
            start_time = time.time()
            response = requests.get(f"{self.base_url}/leads", headers=self.get_headers())
            response_time = time.time() - start_time
            
            if response.status_code != 200:
                self.log_result("Leads Pipeline API", False, "API call failed", response)
                return False
            
            leads = response.json()
            
            # Verify pipeline distribution
            stage_counts = {}
            priority_counts = {}
            
            for lead in leads:
                stage = lead.get('stage', 'Unknown')
                priority = lead.get('priority', 'Unknown')
                
                stage_counts[stage] = stage_counts.get(stage, 0) + 1
                priority_counts[priority] = priority_counts.get(priority, 0) + 1
            
            self.log_result("Pipeline Distribution Analysis", True, 
                           f"Stages: {stage_counts}, Priorities: {priority_counts}")
            
            # Verify lead data structure for dashboard compatibility
            if leads:
                lead = leads[0]
                required_fields = ["id", "name", "stage", "priority", "user_id", "created_at"]
                missing_fields = [field for field in required_fields if field not in lead]
                
                if missing_fields:
                    self.log_result("Lead Data Structure", False, f"Missing fields: {missing_fields}")
                    return False
                
                self.log_result("Lead Data Structure", True, "All required fields present")
            
            self.log_result("Leads API Performance", True, f"Response time: {response_time:.3f}s")
            
            return True
            
        except Exception as e:
            self.log_result("Leads Pipeline API", False, f"Exception: {str(e)}")
            return False

    def test_activities_api_for_recent_activities(self):
        """Test activities API for recent activities functionality"""
        print("📋 Testing Activities API for Recent Activities...")
        
        if not self.test_leads:
            self.log_result("Activities API Test", False, "No test leads available")
            return False
        
        try:
            # Test getting activities for a specific lead
            lead_id = self.test_leads[0]["id"]
            start_time = time.time()
            response = requests.get(f"{self.base_url}/leads/{lead_id}/activities", headers=self.get_headers())
            response_time = time.time() - start_time
            
            if response.status_code != 200:
                self.log_result("Lead Activities API", False, "API call failed", response)
                return False
            
            activities = response.json()
            
            # Verify activity data structure
            if activities:
                activity = activities[0]
                required_fields = ["id", "lead_id", "activity_type", "content", "user_id", "created_at"]
                missing_fields = [field for field in required_fields if field not in activity]
                
                if missing_fields:
                    self.log_result("Activity Data Structure", False, f"Missing fields: {missing_fields}")
                    return False
                
                self.log_result("Activity Data Structure", True, "All required fields present")
                
                # Verify activities are sorted by date (most recent first)
                if len(activities) > 1:
                    dates = [activity['created_at'] for activity in activities]
                    sorted_dates = sorted(dates, reverse=True)
                    if dates == sorted_dates:
                        self.log_result("Activity Sorting", True, "Activities properly sorted by date")
                    else:
                        self.log_result("Activity Sorting", False, "Activities not sorted correctly")
                        return False
            
            self.log_result("Activities API Performance", True, 
                           f"Retrieved {len(activities)} activities in {response_time:.3f}s")
            
            return True
            
        except Exception as e:
            self.log_result("Activities API Test", False, f"Exception: {str(e)}")
            return False

    def test_dashboard_api_performance_under_load(self):
        """Test dashboard API performance under multiple concurrent requests"""
        print("⚡ Testing Dashboard API Performance Under Load...")
        
        response_times = []
        failed_requests = 0
        test_iterations = 5
        
        for i in range(test_iterations):
            try:
                start_time = time.time()
                response = requests.get(f"{self.base_url}/dashboard/stats", headers=self.get_headers())
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    response_times.append(response_time)
                else:
                    failed_requests += 1
                    
            except Exception as e:
                failed_requests += 1
        
        if response_times:
            avg_time = sum(response_times) / len(response_times)
            max_time = max(response_times)
            min_time = min(response_times)
            
            performance_good = avg_time < 1.0 and failed_requests == 0
            
            self.log_result("Dashboard Performance Under Load", performance_good, 
                           f"Avg: {avg_time:.3f}s, Min: {min_time:.3f}s, Max: {max_time:.3f}s, Failed: {failed_requests}/{test_iterations}")
            
            return performance_good
        else:
            self.log_result("Dashboard Performance Under Load", False, "All requests failed")
            return False

    def test_dashboard_error_handling(self):
        """Test dashboard API error handling"""
        print("🛡️ Testing Dashboard API Error Handling...")
        
        # Test with invalid token
        try:
            invalid_headers = {"Authorization": "Bearer invalid_token_12345"}
            response = requests.get(f"{self.base_url}/dashboard/stats", headers=invalid_headers)
            
            if response.status_code in [401, 403]:
                self.log_result("Dashboard Auth Error Handling", True, 
                               f"Correctly rejected invalid token (status {response.status_code})")
            else:
                self.log_result("Dashboard Auth Error Handling", False, 
                               f"Should reject invalid token", response)
                return False
            
            # Test without token
            response = requests.get(f"{self.base_url}/dashboard/stats")
            
            if response.status_code in [401, 403]:
                self.log_result("Dashboard No Auth Error Handling", True, 
                               f"Correctly rejected request without token (status {response.status_code})")
            else:
                self.log_result("Dashboard No Auth Error Handling", False, 
                               f"Should reject request without token", response)
                return False
            
            return True
            
        except Exception as e:
            self.log_result("Dashboard Error Handling", False, f"Exception: {str(e)}")
            return False

    def run_enhanced_dashboard_tests(self):
        """Run all enhanced dashboard tests"""
        print("🚀 Starting Enhanced Dashboard Backend Testing Suite")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 80)
        
        test_results = {}
        
        # Step 1: Setup
        print("\n" + "="*60)
        print("STEP 1: Test User Setup")
        print("="*60)
        test_results["user_setup"] = self.register_test_user()
        
        if not test_results["user_setup"]:
            print("❌ Cannot proceed without authentication")
            return test_results
        
        # Step 2: Create test data
        print("\n" + "="*60)
        print("STEP 2: Dashboard Test Data Creation")
        print("="*60)
        leads_created = self.create_test_leads_for_dashboard()
        activities_created = self.create_test_activities_for_dashboard()
        test_results["test_data"] = leads_created and activities_created
        
        # Step 3: Enhanced dashboard stats API
        print("\n" + "="*60)
        print("STEP 3: Enhanced Dashboard Stats API Testing")
        print("="*60)
        test_results["dashboard_stats"] = self.test_enhanced_dashboard_stats_api()
        
        # Step 4: Pipeline verification
        print("\n" + "="*60)
        print("STEP 4: Pipeline Data Verification")
        print("="*60)
        test_results["pipeline_verification"] = self.test_leads_api_for_pipeline_verification()
        
        # Step 5: Recent activities
        print("\n" + "="*60)
        print("STEP 5: Recent Activities Testing")
        print("="*60)
        test_results["recent_activities"] = self.test_activities_api_for_recent_activities()
        
        # Step 6: Performance testing
        print("\n" + "="*60)
        print("STEP 6: Dashboard Performance Testing")
        print("="*60)
        test_results["performance"] = self.test_dashboard_api_performance_under_load()
        
        # Step 7: Error handling
        print("\n" + "="*60)
        print("STEP 7: Dashboard Error Handling")
        print("="*60)
        test_results["error_handling"] = self.test_dashboard_error_handling()
        
        # Summary
        print("\n" + "="*80)
        print("🎯 ENHANCED DASHBOARD TESTING SUMMARY")
        print("="*80)
        
        passed_tests = sum(1 for result in test_results.values() if result)
        total_tests = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        print(f"\n📊 Overall Result: {passed_tests}/{total_tests} tests passed ({success_rate:.1f}%)")
        
        if passed_tests == total_tests:
            print("🎉 ALL ENHANCED DASHBOARD TESTS PASSED!")
            print("✅ Dashboard backend integration is working perfectly")
        elif passed_tests >= total_tests * 0.8:
            print("⚠️ Most tests passed, minor issues detected")
        else:
            print("❌ CRITICAL ISSUES DETECTED - Dashboard needs attention")
        
        if self.results['errors']:
            print("\n❌ DETAILED ERRORS:")
            for error in self.results['errors']:
                print(f"   • {error}")
        
        return test_results

if __name__ == "__main__":
    tester = DashboardTester()
    results = tester.run_enhanced_dashboard_tests()
    
    # Exit with appropriate code
    all_passed = all(results.values())
    sys.exit(0 if all_passed else 1)