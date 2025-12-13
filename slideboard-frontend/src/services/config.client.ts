import { createClient } from '@/lib/supabase/client'

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

class ConfigService {
  private supabase = createClient();

  async getSystemConfigs(): Promise<SystemConfig[]> {
    const { data, error } = await this.supabase
      .from('system_configs')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true });

    if (error) {
      console.error('Error fetching system configs:', error);
      throw error;
    }

    return (data || []) as SystemConfig[];
  }

  async updateSystemConfig(id: string, updates: Partial<SystemConfig>): Promise<void> {
    const { error } = await this.supabase
      .from('system_configs')
      // @ts-ignore
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating system config:', error);
      throw error;
    }
  }

  async createSystemConfig(key: string, value: string, category: string, description?: string): Promise<void> {
    const { error } = await this.supabase
      .from('system_configs')
      // @ts-ignore
      .insert({
        key,
        value,
        category,
        description
      });

    if (error) {
      console.error('Error creating system config:', error);
      throw error;
    }
  }
}

export const configService = new ConfigService();
