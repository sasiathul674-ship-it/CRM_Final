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
            if response.status_code not in [401, 403]:
                self.log(f"❌ Protected endpoint should return 401 or 403, got {response.status_code}", "ERROR")
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
            
    def test_activity_logging(self) -> bool:
        """Test call/email activity creation and retrieval"""
        self.log("📞 Testing Activity Logging")
        
        try:
            if not self.created_leads:
                self.log("❌ No test leads available for activity testing", "ERROR")
                return False
                
            lead_id = self.created_leads[0]["id"]
            
            # Test creating call activity
            call_activity = {
                "lead_id": lead_id,
                "activity_type": "call",
                "content": "Discussed project requirements and timeline",
                "outcome": "answered",
                "duration": 15
            }
            
            response = self.session.post(f"{BACKEND_URL}/activities", json=call_activity)
            if response.status_code != 200:
                self.log(f"❌ Call activity creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
            call_result = response.json()
            self.created_activities.append(call_result["id"])
            self.log(f"✅ Call activity created: {call_result['content'][:50]}...")
            
            # Test creating email activity
            email_activity = {
                "lead_id": lead_id,
                "activity_type": "email",
                "content": "Sent project proposal and pricing information",
                "outcome": None,
                "duration": None
            }
            
            response = self.session.post(f"{BACKEND_URL}/activities", json=email_activity)
            if response.status_code != 200:
                self.log(f"❌ Email activity creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
            email_result = response.json()
            self.created_activities.append(email_result["id"])
            self.log(f"✅ Email activity created: {email_result['content'][:50]}...")
            
            # Test retrieving lead activities
            response = self.session.get(f"{BACKEND_URL}/leads/{lead_id}/activities")
            if response.status_code != 200:
                self.log(f"❌ Get lead activities failed: {response.status_code}", "ERROR")
                return False
                
            activities = response.json()
            if len(activities) < 2:
                self.log(f"❌ Expected at least 2 activities, got {len(activities)}", "ERROR")
                return False
                
            self.log(f"✅ Retrieved {len(activities)} activities for lead")
            
            # Verify activity structure
            for activity in activities:
                required_fields = ["id", "lead_id", "activity_type", "content", "user_id", "created_at"]
                for field in required_fields:
                    if field not in activity:
                        self.log(f"❌ Missing field {field} in activity", "ERROR")
                        return False
                        
            self.log("✅ Activity structure validation passed")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Activity logging test failed: {e}", "ERROR")
            return False

    def test_task_management_apis(self) -> bool:
        """Test comprehensive Task Management APIs - Focus area from review request"""
        self.log("📋 Testing Task Management APIs (CRITICAL FOCUS)")
        
        try:
            created_tasks = []
            
            # Test 1: POST /api/tasks - Create tasks with different configurations
            self.log("Testing POST /api/tasks - Task Creation")
            
            test_tasks = [
                {
                    "title": "Follow up with John Smith",
                    "description": "Call to discuss enterprise solution pricing",
                    "lead_id": self.created_leads[0]["id"] if self.created_leads else None,
                    "due_date": (datetime.now().replace(microsecond=0) + timedelta(days=3)).isoformat(),
                    "priority": "high",
                    "status": "pending"
                },
                {
                    "title": "Prepare proposal for Sarah Johnson",
                    "description": "Create detailed marketing automation proposal",
                    "lead_id": self.created_leads[1]["id"] if len(self.created_leads) > 1 else None,
                    "priority": "medium",
                    "status": "pending"
                },
                {
                    "title": "Send follow-up email to Mike Wilson",
                    "description": "Follow up on consulting engagement discussion",
                    "priority": "low",
                    "status": "completed"
                },
                {
                    "title": "General CRM system maintenance",
                    "description": "Weekly system maintenance and data cleanup",
                    "priority": "medium",
                    "status": "pending"
                }
            ]
            
            for i, task_data in enumerate(test_tasks):
                response = self.session.post(f"{BACKEND_URL}/tasks", json=task_data)
                if response.status_code != 200:
                    self.log(f"❌ Task creation failed for task {i+1}: {response.status_code} - {response.text}", "ERROR")
                    return False
                    
                task = response.json()
                created_tasks.append(task)
                
                # Verify task structure
                required_fields = ["id", "title", "priority", "status", "user_id", "created_at"]
                for field in required_fields:
                    if field not in task:
                        self.log(f"❌ Missing field {field} in created task", "ERROR")
                        return False
                        
                self.log(f"✅ Task created: '{task['title']}' (Priority: {task['priority']}, Status: {task['status']})")
                
            # Test 2: GET /api/tasks - Retrieve all tasks
            self.log("Testing GET /api/tasks - All Tasks Retrieval")
            
            response = self.session.get(f"{BACKEND_URL}/tasks")
            if response.status_code != 200:
                self.log(f"❌ Get all tasks failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
            all_tasks = response.json()
            if not isinstance(all_tasks, list):
                self.log("❌ Tasks response should be a list", "ERROR")
                return False
                
            if len(all_tasks) < len(created_tasks):
                self.log(f"❌ Expected at least {len(created_tasks)} tasks, got {len(all_tasks)}", "ERROR")
                return False
                
            self.log(f"✅ Retrieved {len(all_tasks)} total tasks")
            
            # Test 3: GET /api/tasks?status=pending - Filter by status
            self.log("Testing GET /api/tasks?status=pending - Filtered Tasks")
            
            response = self.session.get(f"{BACKEND_URL}/tasks?status=pending")
            if response.status_code != 200:
                self.log(f"❌ Get pending tasks failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
            pending_tasks = response.json()
            if not isinstance(pending_tasks, list):
                self.log("❌ Pending tasks response should be a list", "ERROR")
                return False
                
            # Verify all returned tasks have pending status
            for task in pending_tasks:
                if task["status"] != "pending":
                    self.log(f"❌ Non-pending task found in pending filter: {task['title']} has status {task['status']}", "ERROR")
                    return False
                    
            self.log(f"✅ Retrieved {len(pending_tasks)} pending tasks (filter working correctly)")
            
            # Test 4: GET /api/tasks?status=completed - Filter by completed status
            self.log("Testing GET /api/tasks?status=completed - Completed Tasks Filter")
            
            response = self.session.get(f"{BACKEND_URL}/tasks?status=completed")
            if response.status_code != 200:
                self.log(f"❌ Get completed tasks failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
            completed_tasks = response.json()
            if not isinstance(completed_tasks, list):
                self.log("❌ Completed tasks response should be a list", "ERROR")
                return False
                
            # Verify all returned tasks have completed status
            for task in completed_tasks:
                if task["status"] != "completed":
                    self.log(f"❌ Non-completed task found in completed filter: {task['title']} has status {task['status']}", "ERROR")
                    return False
                    
            self.log(f"✅ Retrieved {len(completed_tasks)} completed tasks (filter working correctly)")
            
            # Test 5: GET /api/leads/{id}/tasks - Lead-specific tasks
            if self.created_leads:
                self.log("Testing GET /api/leads/{id}/tasks - Lead-Specific Tasks")
                
                lead_id = self.created_leads[0]["id"]
                response = self.session.get(f"{BACKEND_URL}/leads/{lead_id}/tasks")
                if response.status_code != 200:
                    self.log(f"❌ Get lead tasks failed: {response.status_code} - {response.text}", "ERROR")
                    return False
                    
                lead_tasks = response.json()
                if not isinstance(lead_tasks, list):
                    self.log("❌ Lead tasks response should be a list", "ERROR")
                    return False
                    
                # Verify all returned tasks belong to the specified lead
                for task in lead_tasks:
                    if task.get("lead_id") != lead_id:
                        self.log(f"❌ Task doesn't belong to specified lead: {task['title']} has lead_id {task.get('lead_id')}", "ERROR")
                        return False
                        
                self.log(f"✅ Retrieved {len(lead_tasks)} tasks for lead {lead_id}")
            
            # Test 6: Task data structure validation
            self.log("Testing Task Data Structure Consistency")
            
            for task in all_tasks:
                # Check required fields
                required_fields = ["id", "title", "priority", "status", "user_id", "created_at"]
                for field in required_fields:
                    if field not in task:
                        self.log(f"❌ Missing required field {field} in task: {task.get('title', 'Unknown')}", "ERROR")
                        return False
                        
                # Check valid priority values
                if task["priority"] not in ["high", "medium", "low"]:
                    self.log(f"❌ Invalid priority value: {task['priority']} in task: {task['title']}", "ERROR")
                    return False
                    
                # Check valid status values
                if task["status"] not in ["pending", "completed", "cancelled"]:
                    self.log(f"❌ Invalid status value: {task['status']} in task: {task['title']}", "ERROR")
                    return False
                    
            self.log("✅ All tasks have consistent data structure")
            
            # Test 7: Task update functionality
            if created_tasks:
                self.log("Testing Task Update Functionality")
                
                task_to_update = created_tasks[0]
                update_data = {
                    "title": task_to_update["title"] + " (Updated)",
                    "description": "Updated description for testing",
                    "priority": "medium",
                    "status": "pending"
                }
                
                response = self.session.put(f"{BACKEND_URL}/tasks/{task_to_update['id']}", json=update_data)
                if response.status_code != 200:
                    self.log(f"❌ Task update failed: {response.status_code} - {response.text}", "ERROR")
                    return False
                    
                updated_task = response.json()
                if updated_task["title"] != update_data["title"]:
                    self.log(f"❌ Task title not updated correctly", "ERROR")
                    return False
                    
                self.log(f"✅ Task updated successfully: {updated_task['title']}")
            
            # Test 8: Task status update via PATCH
            if created_tasks:
                self.log("Testing PATCH /api/tasks/{id}/status - Status Updates")
                
                task_to_update = created_tasks[1] if len(created_tasks) > 1 else created_tasks[0]
                status_update = {"status": "completed"}
                
                response = self.session.patch(f"{BACKEND_URL}/tasks/{task_to_update['id']}/status", json=status_update)
                if response.status_code != 200:
                    self.log(f"❌ Task status update failed: {response.status_code} - {response.text}", "ERROR")
                    return False
                    
                result = response.json()
                if not result.get("success"):
                    self.log("❌ Task status update returned unsuccessful result", "ERROR")
                    return False
                    
                self.log(f"✅ Task status updated to completed")
            
            self.log("🎉 ALL TASK MANAGEMENT API TESTS PASSED!")
            return True
            
        except Exception as e:
            self.log(f"❌ Task management API test failed: {e}", "ERROR")
            return False
            
    def cleanup_test_data(self):
        """Clean up test data created during testing"""
        self.log("🧹 Cleaning up test data")
        
        try:
            # Delete test leads
            for lead in self.created_leads:
                response = self.session.delete(f"{BACKEND_URL}/leads/{lead['id']}")
                if response.status_code == 200:
                    self.log(f"✅ Deleted lead: {lead['name']}")
                    
        except Exception as e:
            self.log(f"❌ Cleanup failed: {e}", "ERROR")
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all backend tests and return results"""
        self.log("🚀 Starting Strike CRM Backend API Testing Suite - Phase 2")
        self.log(f"Testing against: {BACKEND_URL}")
        self.log("=" * 80)
        
        test_results = {}
        
        # Test authentication first
        test_results["authentication_flow"] = self.test_authentication_flow()
        
        if not test_results["authentication_flow"]:
            self.log("❌ Authentication failed, skipping other tests", "ERROR")
            return test_results
            
        # Run all other tests
        test_results["lead_crud_with_order_value"] = self.test_lead_crud_with_order_value()
        test_results["lead_stage_updates"] = self.test_lead_stage_updates()
        test_results["dashboard_stats_api"] = self.test_dashboard_stats_api()
        test_results["activity_logging"] = self.test_activity_logging()
        test_results["task_management_apis"] = self.test_task_management_apis()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        self.log("\n" + "="*80)
        self.log("🎯 PHASE 2 BACKEND TESTING SUMMARY")
        self.log("="*80)
        
        passed = 0
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status}: {test_name.replace('_', ' ').title()}")
            if result:
                passed += 1
                
        self.log(f"\nOverall Result: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL PHASE 2 BACKEND TESTS PASSED!")
            self.log("✅ API compatibility confirmed for new features:")
            self.log("   - Lead CRUD with Order Value Field")
            self.log("   - Lead Stage Updates for Kanban drag-and-drop")
            self.log("   - Dashboard Stats API for enhanced tiles")
            self.log("   - Authentication Flow with JWT")
            self.log("   - Activity Logging (calls/emails)")
        else:
            self.log("⚠️  Some tests failed - check logs above for details")
            
        return test_results

if __name__ == "__main__":
    tester = StrikeCRMTester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    all_passed = all(results.values())
    sys.exit(0 if all_passed else 1)