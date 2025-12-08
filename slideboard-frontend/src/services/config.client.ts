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
    

    /**
     * Get all system configs
     */
    async getSystemConfigs(): Promise<SystemConfig[]> {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('system_configs')
            .select('*')
            .order('category', { ascending: true })
        if (error) throw new Error(error.message)
        return (data || []) as SystemConfig[]
    }

    /**
     * Update a system config
     */
    async updateSystemConfig(id: string, value: string): Promise<SystemConfig> {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('system_configs')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()
        if (error) throw new Error(error.message)
        return data as SystemConfig
    }

    /**
     * Create a new system config
     */
    async createSystemConfig(
        key: string,
        value: string,
        category: string,
        description?: string
    ): Promise<SystemConfig> {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('system_configs')
            .insert({
                key,
                value,
                description,
                category,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()
        if (error) throw new Error(error.message)
        return data as SystemConfig
    }

    /**
     * Get a single config by key
     */
    async getConfigByKey(key: string): Promise<string | undefined> {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('system_configs')
            .select('value')
            .eq('key', key)
            .maybeSingle()
        if (error) throw new Error(error.message)
        return (data as any)?.value
    }
}

export const configService = new ConfigService();
import { createClient } from '@/lib/supabase/client'
