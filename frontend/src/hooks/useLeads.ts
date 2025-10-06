import { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';

interface Lead {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  stage: string;
  priority: string;
  notes?: string;
  user_id: string;
  created_at: string;
  last_interaction?: string;
}

interface CreateLeadData {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  stage?: string;
  priority?: string;
  notes?: string;
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  
  const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

  const fetchLeads = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      } else {
        const errorData = await response.text();
        console.error('Failed to fetch leads:', response.status, errorData);
        throw new Error(`Failed to fetch leads: ${response.status}`);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const createLead = async (leadData: CreateLeadData): Promise<Lead | null> => {
    if (!token) {
      console.error('No token available for creating lead');
      setError('Authentication required');
      return null;
    }
    
    setError(null);
    
    try {
      console.log('Creating lead with data:', leadData);
      console.log('API URL:', `${API_BASE_URL}/api/leads`);
      
      const response = await fetch(`${API_BASE_URL}/api/leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const newLead = await response.json();
        console.log('Created lead:', newLead);
        setLeads(prev => [...prev, newLead]);
        return newLead;
      } else {
        const errorText = await response.text();
        console.error('Create lead failed:', response.status, errorText);
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || 'Failed to create lead';
        } catch {
          errorMessage = `Failed to create lead: ${response.status}`;
        }
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error('Error creating lead:', err);
      const errorMessage = err.message || 'Something went wrong creating the lead';
      setError(errorMessage);
      return null;
    }
  };

  const updateLeadStage = async (leadId: string, stage: string): Promise<boolean> => {
    if (!token) return false;
    
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/stage?stage=${encodeURIComponent(stage)}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        setLeads(prev => 
          prev.map(lead => 
            lead.id === leadId 
              ? { ...lead, stage, last_interaction: new Date().toISOString() }
              : lead
          )
        );
        return true;
      } else {
        const errorText = await response.text();
        console.error('Update stage failed:', response.status, errorText);
        throw new Error('Failed to update lead stage');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating lead stage:', err);
      return false;
    }
  };

  const updateLead = async (leadId: string, leadData: Partial<Lead>): Promise<boolean> => {
    if (!token) return false;
    
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      if (response.ok) {
        const updatedLead = await response.json();
        setLeads(prev => 
          prev.map(lead => 
            lead.id === leadId ? updatedLead : lead
          )
        );
        return true;
      } else {
        const errorText = await response.text();
        console.error('Update lead failed:', response.status, errorText);
        throw new Error('Failed to update lead');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating lead:', err);
      return false;
    }
  };

  const deleteLead = async (leadId: string): Promise<boolean> => {
    if (!token) return false;
    
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setLeads(prev => prev.filter(lead => lead.id !== leadId));
        return true;
      } else {
        throw new Error('Failed to delete lead');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting lead:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [token]);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLead,
    updateLeadStage,
    deleteLead,
  };
}
