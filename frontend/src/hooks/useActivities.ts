import { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';

interface Activity {
  id: string;
  lead_id: string;
  activity_type: 'call' | 'email' | 'note';
  content: string;
  outcome?: string;
  duration?: number;
  user_id: string;
  created_at: string;
}

interface CreateActivityData {
  lead_id: string;
  activity_type: 'call' | 'email' | 'note';
  content: string;
  outcome?: string;
  duration?: number;
}

export function useActivities(leadId?: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  
  const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

  const fetchActivities = async (targetLeadId?: string) => {
    const id = targetLeadId || leadId;
    if (!token || !id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/${id}/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      } else {
        throw new Error('Failed to fetch activities');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const createActivity = async (activityData: CreateActivityData): Promise<Activity | null> => {
    if (!token) return null;
    
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });

      if (response.ok) {
        const newActivity = await response.json();
        setActivities(prev => [newActivity, ...prev]);
        return newActivity;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create activity');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating activity:', err);
      return null;
    }
  };

  const getActivitiesByType = (type: 'call' | 'email' | 'note') => {
    return activities.filter(activity => activity.activity_type === type);
  };

  const getRecentActivities = (limit: number = 5) => {
    return activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  };

  useEffect(() => {
    if (leadId) {
      fetchActivities(leadId);
    }
  }, [token, leadId]);

  return {
    activities,
    loading,
    error,
    fetchActivities,
    createActivity,
    getActivitiesByType,
    getRecentActivities,
  };
}
