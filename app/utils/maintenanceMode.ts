// Maintenance Mode Utility for Kampo Ibayo
// Database solution for cross-device maintenance mode

import { supabase } from '../supabaseClient';

export interface MaintenanceSettings {
  isActive: boolean;
  message: string;
  enabledAt?: string;
}

interface MaintenanceDbResponse {
  is_active: boolean;
  message: string;
  enabled_at?: string;
}

// Default maintenance settings
const DEFAULT_SETTINGS: MaintenanceSettings = {
  isActive: false,
  message: "We are temporarily closed for maintenance. Please check back soon!",
};

// Save maintenance settings (admin only) - now uses database
export async function saveMaintenanceSettings(settings: MaintenanceSettings): Promise<void> {
  try {
    console.log('🔧 Saving maintenance settings to database:', settings);
    
    // Bypass TypeScript type checking for custom RPC functions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('update_maintenance_status', {
      new_is_active: settings.isActive,
      new_message: settings.message
    });

    if (error) {
      console.error('Error saving maintenance settings:', error);
      return;
    }

    console.log('🔧 Saved to database:', data);
    
    // Dispatch custom event for real-time updates in same session
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('maintenanceSettingsChanged', {
        detail: settings
      }));
      console.log('🔧 Dispatched maintenanceSettingsChanged event');
    }
  } catch (error) {
    console.error('Failed to save maintenance settings:', error);
  }
}

// Get current maintenance settings from database
export async function getMaintenanceSettings(): Promise<MaintenanceSettings> {
  try {
    console.log('🔧 Loading maintenance settings from database');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_maintenance_status');

    if (error) {
      console.error('Error loading maintenance settings:', error);
      return DEFAULT_SETTINGS;
    }

    if (data) {
      const dbResponse = data as MaintenanceDbResponse;
      const settings = {
        isActive: dbResponse.is_active || false,
        message: dbResponse.message || DEFAULT_SETTINGS.message,
        enabledAt: dbResponse.enabled_at || undefined
      };
      console.log('🔧 Loaded from database:', settings);
      return settings;
    }
  } catch (error) {
    console.error('Failed to load maintenance settings:', error);
  }

  console.log('🔧 Using default settings');
  return DEFAULT_SETTINGS;
}

// Simple check if maintenance mode is active
export async function isMaintenanceMode(): Promise<boolean> {
  const settings = await getMaintenanceSettings();
  console.log('🔧 isMaintenanceMode check:', settings.isActive);
  return settings.isActive;
}

// Get maintenance message
export async function getMaintenanceMessage(): Promise<string> {
  const settings = await getMaintenanceSettings();
  return settings.message || DEFAULT_SETTINGS.message;
}