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
        throw new Error('Failed to fetch leads');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const createLead = async (leadData: CreateLeadData): Promise<Lead | null> => {
    if (!token) return null;
    
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      if (response.ok) {
        const newLead = await response.json();
        setLeads(prev => [...prev, newLead]);
        return newLead;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create lead');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating lead:', err);
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
        throw new Error('Failed to update lead stage');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating lead stage:', err);
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
    updateLeadStage,
    deleteLead,
  };
}
