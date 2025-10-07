import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export interface Lead {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  stage: string;
  priority: string;
  notes?: string;
  order_value?: number;  // Deal value in currency
  currency?: string;     // Currency code (INR, USD, GBP, EUR)
  deal_status?: string;  // "won", "lost" - only for Closed stage
  user_id: string;
  created_at: string;
  last_interaction?: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  activity_type: 'call' | 'email' | 'note';
  content: string;
  outcome?: string;
  duration?: number;
  user_id: string;
  created_at: string;
}

export interface BusinessCard {
  id: string;
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website?: string;
  template: string;
  user_id: string;
  created_at: string;
}

export interface Task {
  id: string;
  lead_id: string;
  title: string;
  description?: string;
  task_type: 'call' | 'email' | 'note' | 'meeting' | 'follow_up' | 'other';
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  completed_date?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_leads: number;
  leads_by_stage: { [key: string]: number };
  this_week_calls: number;
  this_week_emails: number;
  recent_activities: Activity[];
  pending_tasks: Task[];
  overdue_tasks: Task[];
}

class ApiService {
  private getHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(error.detail || 'Request failed');
    }
    return response.json();
  }

  // Auth API
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return this.handleResponse(response);
  }

  async register(email: string, password: string, name: string, company?: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, company }),
    });
    return this.handleResponse(response);
  }

  async getUser(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  // Leads API
  async getLeads(token: string): Promise<Lead[]> {
    const response = await fetch(`${API_BASE_URL}/api/leads`, {
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createLead(token: string, leadData: Partial<Lead>): Promise<Lead> {
    const response = await fetch(`${API_BASE_URL}/api/leads`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(leadData),
    });
    return this.handleResponse(response);
  }

  async updateLead(token: string, leadId: string, leadData: Partial<Lead>): Promise<Lead> {
    const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(leadData),
    });
    return this.handleResponse(response);
  }

  async updateLeadStage(token: string, leadId: string, stage: string) {
    const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/stage?stage=${encodeURIComponent(stage)}`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async deleteLead(token: string, leadId: string) {
    const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async getLead(token: string, leadId: string): Promise<Lead> {
    const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  // Activities API
  async getLeadActivities(token: string, leadId: string): Promise<Activity[]> {
    const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/activities`, {
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createActivity(token: string, activityData: Partial<Activity>): Promise<Activity> {
    const response = await fetch(`${API_BASE_URL}/api/activities`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(activityData),
    });
    return this.handleResponse(response);
  }

  // Business Card API
  async getBusinessCard(token: string): Promise<BusinessCard> {
    const response = await fetch(`${API_BASE_URL}/api/business-card`, {
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createBusinessCard(token: string, cardData: Partial<BusinessCard>): Promise<BusinessCard> {
    const response = await fetch(`${API_BASE_URL}/api/business-card`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(cardData),
    });
    return this.handleResponse(response);
  }

  // Dashboard API
  async getDashboardStats(token: string): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  // Task Management API
  async getLeadTasks(token: string, leadId: string): Promise<Task[]> {
    const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/tasks`, {
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async getAllTasks(token: string, status?: string): Promise<Task[]> {
    const params = status ? `?status=${status}` : '';
    const response = await fetch(`${API_BASE_URL}/api/tasks${params}`, {
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createTask(token: string, taskData: Partial<Task>): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(taskData),
    });
    return this.handleResponse(response);
  }

  async updateTask(token: string, taskId: string, taskData: Partial<Task>): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(taskData),
    });
    return this.handleResponse(response);
  }

  async updateTaskStatus(token: string, taskId: string, status: 'pending' | 'completed' | 'cancelled'): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify({ status }),
    });
    return this.handleResponse(response);
  }

  async deleteTask(token: string, taskId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.statusText}`);
    }
  }
}

export const apiService = new ApiService();
