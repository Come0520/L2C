import { createClient } from '@/lib/supabase/client';
import { 
  InstallationSchedule, 
  InstallationCalendarItem, 
  InstallationAvailability, 
  InstallationRoutePlan,
  InstallationReminder,
  TimeSlot
} from '@/types/installation-schedule';

import { notificationService } from './notifications';

// 安装调度创建请求
export interface CreateInstallationScheduleRequest {
  installationId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  installerId?: string;
  installationTeamId?: string;
  notes?: string;
}

// 安装调度更新请求
export interface UpdateInstallationScheduleRequest {
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  installerId?: string;
  installationTeamId?: string;
  status?: 'scheduled' | 'confirmed' | 'canceled' | 'completed';
  notes?: string;
}

// 安装路线规划创建请求
export interface CreateInstallationRoutePlanRequest {
  date: string;
  installerId: string;
  installationIds: string[];
}

// 安装提醒创建请求
export interface CreateInstallationReminderRequest {
  installationId: string;
  type: 'sms' | 'email' | 'app' | 'wechat';
  recipient: string;
  content: string;
  scheduledTime: string;
}

// 数据库安装订单类型
export interface InstallationOrderFromDB {
    id: string;
    installation_no: string;
    sales_order_id: string;
    sales_order?: {
        [key: string]: any;
        sales_order_no?: string;
        customer?: Array<{
            name?: string;
            project_address?: string;
            phone?: string;
        }>;
    };
}

// 数据库安装调度记录类型
export interface InstallationScheduleFromDB {
    id: string;
    installation_id: string;
    installation_no: string;
    customer_name: string;
    project_address: string;
    scheduled_date: string;
    time_slot: {
        startTime: string;
        endTime: string;
    };
    estimated_duration: number;
    installer_id: string;
    installation_team_id: string;
    status: 'scheduled' | 'confirmed' | 'canceled' | 'completed';
    notes?: string;
    created_at: string;
    updated_at: string;
    installer?: {
        name?: string;
    };
    installation_team?: {
        name?: string;
    };
}

// 数据库安装路线计划记录类型
export interface InstallationRoutePlanFromDB {
    id: string;
    date: string;
    installer_id: string;
    total_travel_time: number;
    total_travel_distance: number;
    estimated_start_time: string;
    estimated_end_time: string;
    created_at: string;
    updated_at: string;
    installer?: {
        name?: string;
    };
    plan_installations?: Array<{
        id: string;
        installation_id: string;
        installation_no?: string;
        customer_name?: string;
        project_address?: string;
        scheduled_time?: string;
        sequence: number;
        estimated_travel_time: number;
        estimated_travel_distance: number;
        installation?: {
            installation_no: string;
            customer_name: string;
            project_address: string;
            time_slot: {
                startTime: string;
                endTime: string;
            };
        };
    }>;
    installations?: Array<{
        id: string;
        installation_id: string;
        installation_no?: string;
        customer_name?: string;
        project_address?: string;
        scheduled_time?: string;
        sequence: number;
        estimated_travel_time: number;
        estimated_travel_distance: number;
        installation?: {
            installation_no: string;
            customer_name: string;
            project_address: string;
            time_slot: {
                startTime: string;
                endTime: string;
            };
        };
    }>;
}

// 数据库安装提醒记录类型
export interface InstallationReminderFromDB {
    id: string;
    installation_id: string;
    type: 'sms' | 'email' | 'app' | 'wechat';
    recipient: string;
    content: string;
    scheduled_time: string;
    status: 'pending' | 'sent' | 'failed';
    sent_time?: string;
    failure_reason?: string;
    created_at: string;
    updated_at: string;
}

// 安装调度服务
export const installationScheduleService = {
    /**
     * Create installation schedule
     */
    async createInstallationSchedule(data: CreateInstallationScheduleRequest) {
        const supabase = createClient();
        const { data: user } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Check if installer is available
        const isAvailable = await this.checkInstallerAvailability(
            data.installerId || '',
            data.scheduledDate,
            data.startTime,
            data.endTime
        );

        if (!isAvailable) {
            throw new Error('Installer is not available at the requested time');
        }

        // Get installation info
        const { data: installation, error: installationError } = await supabase
            .from('installation_orders')
            .select('id, installation_no, sales_order_id, sales_order:sales_orders(customer:customers(name, project_address))')
            .eq('id', data.installationId)
            .single();

        if (installationError) throw new Error(installationError.message);
        if (!installation) throw new Error('Installation not found');

        // Create schedule
        const installOrder = installation as InstallationOrderFromDB;
        const so = installOrder.sales_order?.[0] || installOrder.sales_order;
        const cust = so?.customer?.[0] || so?.customer;

        const { data: schedule, error } = await supabase
            .from('installation_schedules')
            .insert({
                installation_id: data.installationId,
                installation_no: installOrder.installation_no || (so?.sales_order_no || ''),
                customer_name: cust?.name || '',
                project_address: cust?.project_address || '',
                scheduled_date: data.scheduledDate,
                time_slot: {
                    startTime: data.startTime,
                    endTime: data.endTime
                },
                estimated_duration: this.calculateDuration(data.startTime, data.endTime),
                installer_id: data.installerId,
                installation_team_id: data.installationTeamId,
                status: 'scheduled',
                notes: data.notes,
                created_by: user.user?.id
            })
            .select(`
                *, 
                installer:users(name),
                installation_team:installation_teams(name)
            `)
            .single();

        if (error) throw new Error(error.message);

        // Update installation status
        const { error: updateError } = await supabase
            .from('installation_orders')
            .update({
                status: 'assigning',
                updated_at: new Date().toISOString()
            })
            .eq('id', data.installationId);

        if (updateError) {
        }

        // 创建安装调度通知
        if (schedule.installerId) {
            await notificationService.createInstallationNotification({
                user_id: schedule.installerId,
                type: 'installation',
                title: '新的安装调度',
                content: `您已被分配了新的安装任务：${schedule.customerName}，时间：${schedule.scheduledDate} ${schedule.timeSlot.startTime}`,
                installationId: schedule.installation_id
            });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.mapToInstallationSchedule(schedule as any);
    },

    /**
     * Update installation schedule
     */
    async updateInstallationSchedule(scheduleId: string, data: UpdateInstallationScheduleRequest) {
        const supabase = createClient();

        // Check if changing time or installer, then check availability
        if ((data.scheduledDate || data.startTime || data.endTime || data.installerId) && 
            data.installerId && data.scheduledDate && data.startTime && data.endTime) {
            const isAvailable = await this.checkInstallerAvailability(
                data.installerId,
                data.scheduledDate,
                data.startTime,
                data.endTime,
                scheduleId // Exclude current schedule from check
            );

            if (!isAvailable) {
                throw new Error('Installer is not available at the requested time');
            }
        }

        const updatedAt = new Date().toISOString();
        const updateData: Partial<InstallationScheduleFromDB> & { updated_at: string } = { updated_at: updatedAt };
        if (data.scheduledDate) updateData.scheduled_date = data.scheduledDate;
        if (data.startTime && data.endTime) {
            updateData.time_slot = {
                startTime: data.startTime,
                endTime: data.endTime
            };
            updateData.estimated_duration = this.calculateDuration(data.startTime, data.endTime);
        }
        if (data.installerId) updateData.installer_id = data.installerId;
        if (data.installationTeamId) updateData.installation_team_id = data.installationTeamId;
        if (data.status) updateData.status = data.status;
        if (data.notes) updateData.notes = data.notes;

        const { data: schedule, error } = await supabase
            .from('installation_schedules')
            .update(updateData)
            .eq('id', scheduleId)
            .select(`
                *, 
                installer:users(name),
                installation_team:installation_teams(name)
            `)
            .single();

        if (error) throw new Error(error.message);

        // Update installation status if schedule status changed
        if (data.status) {
            let installationStatus = 'assigning';
            if (data.status === 'confirmed') installationStatus = 'waiting';
            else if (data.status === 'completed') installationStatus = 'confirming';

            const { error: updateError } = await supabase
                .from('installation_orders')
                .update({
                    status: installationStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', schedule.installation_id);

        if (updateError) {
        }

        }

        // 创建安装调度更新通知
        if (schedule.installerId) {
            await notificationService.createInstallationNotification({
                user_id: schedule.installerId,
                type: 'installation',
                title: '安装调度更新',
                content: `您的安装任务已更新：${schedule.customerName}，时间：${schedule.scheduledDate} ${schedule.timeSlot.startTime}`,
                installationId: schedule.installation_id
            });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.mapToInstallationSchedule(schedule as any);
    },

    /**
     * Delete installation schedule
     */
    async deleteInstallationSchedule(scheduleId: string) {
        const supabase = createClient();

        // Get schedule first to get installation id
        const { data: schedule, error: getError } = await supabase
            .from('installation_schedules')
            .select('installation_id')
            .eq('id', scheduleId)
            .single();

        if (getError) throw new Error(getError.message);

        // Delete schedule
        const { error: deleteError } = await supabase
            .from('installation_schedules')
            .delete()
            .eq('id', scheduleId);

        if (deleteError) throw new Error(deleteError.message);

        // Check if there are other schedules for this installation
        const { data: otherSchedules, error: checkError } = await supabase
            .from('installation_schedules')
            .select('id')
            .eq('installation_id', schedule.installation_id);

        if (checkError) throw new Error(checkError.message);

        // If no other schedules, update installation status
        if (!otherSchedules || otherSchedules.length === 0) {
            const { error: updateError } = await supabase
                .from('installation_orders')
                .update({
                    status: 'pending',
                    updated_at: new Date().toISOString()
                })
                .eq('id', schedule.installation_id);

            if (updateError) {
            }
        }
    },

    /**
     * Get installation schedules
     */
    async getInstallationSchedules(params: {
        page?: number;
        pageSize?: number;
        status?: string;
        startDate?: string;
        endDate?: string;
        installerId?: string;
        installationTeamId?: string;
        customerName?: string;
    } = {}) {
        const supabase = createClient();
        const { 
            page = 1, 
            pageSize = 10, 
            status, 
            startDate, 
            endDate,
            installerId,
            installationTeamId,
            customerName
        } = params;

        let query = supabase
            .from('installation_schedules')
            .select(`
                *, 
                installer:users(name),
                installation_team:installation_teams(name)
            `, { count: 'exact' })
            .order('scheduled_date', { ascending: true })
            .order('time_slot.startTime', { ascending: true });

        // Apply filters
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (startDate) {
            query = query.gte('scheduled_date', startDate);
        }
        if (endDate) {
            query = query.lte('scheduled_date', endDate);
        }
        if (installerId) {
            query = query.eq('installer_id', installerId);
        }
        if (installationTeamId) {
            query = query.eq('installation_team_id', installationTeamId);
        }
        if (customerName) {
            query = query.ilike('customer_name', `%${customerName}%`);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await query.range(from, to);
        if (error) throw new Error(error.message);

        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            schedules: (data || []).map((item: any) => this.mapToInstallationSchedule(item)),
            total: count || 0
        };
    },

    /**
     * Get installation schedule by ID
     */
    async getInstallationScheduleById(scheduleId: string) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('installation_schedules')
            .select(`
                *, 
                installer:users(name),
                installation_team:installation_teams(name)
            `)
            .eq('id', scheduleId)
            .single();

        if (error) throw new Error(error.message);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.mapToInstallationSchedule(data as any);
    },

    /**
     * Get installation schedules by installation ID
     */
    async getInstallationSchedulesByInstallationId(installationId: string) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('installation_schedules')
            .select(`
                *, 
                installer:users(name),
                installation_team:installation_teams(name)
            `)
            .eq('installation_id', installationId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((item: any) => this.mapToInstallationSchedule(item));
    },

    /**
     * Get installation calendar
     */
    async getInstallationCalendar(year: number, month: number) {
        const supabase = createClient();
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('installation_schedules')
            .select(`
                id, installation_no, customer_name, scheduled_date, time_slot,
                status, installation_id
            `)
            .gte('scheduled_date', startDate)
            .lte('scheduled_date', endDate)
            .order('scheduled_date', { ascending: true })
            .order('time_slot.startTime', { ascending: true });

        if (error) throw new Error(error.message);

        // Define the type for the raw query result
        interface RawSchedule {
            id: string;
            installation_no: string;
            customer_name: string;
            scheduled_date: string;
            time_slot: {
                startTime: string;
                endTime: string;
            };
            status: 'scheduled' | 'confirmed' | 'canceled' | 'completed';
            installation_id: string;
        }

        // Group by date
        const schedulesByDate: Record<string, RawSchedule[]> = {};
        (data || []).forEach((raw: RawSchedule) => {
            const date = raw.scheduled_date;
            if (!date) return;
            if (!schedulesByDate[date]) schedulesByDate[date] = [];
            schedulesByDate[date].push(raw);
        });

        // Generate calendar items
        const calendarItems: InstallationCalendarItem[] = [];
        const today = new Date().toISOString().split('T')[0];
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day).toISOString().split('T')[0] as string;
            const schedules = schedulesByDate[date] || [];
            const dayOfWeek = new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'short' });
            const isWeekend = ['Sat', 'Sun'].includes(dayOfWeek);

            calendarItems.push({
                date: date || '',
                day: dayOfWeek,
                isToday: (date || '') === today,
                isWeekend,
                hasInstallations: schedules.length > 0,
                installations: schedules.map((schedule: RawSchedule) => ({
                    id: schedule.id,
                    installationNo: schedule.installation_no || '',
                    customerName: schedule.customer_name || '',
                    startTime: schedule.time_slot?.startTime || '',
                    endTime: schedule.time_slot?.endTime || '',
                    status: schedule.status
                })),
                totalInstallations: schedules.length
            });
        }

        return calendarItems;
    },

    /**
     * Check installer availability
     */
    async checkInstallerAvailability(
        installerId: string,
        date: string,
        startTime: string,
        endTime: string,
        excludeScheduleId?: string
    ) {
        const supabase = createClient();
        let query = supabase
            .from('installation_schedules')
            .select('id')
            .eq('installer_id', installerId)
            .eq('scheduled_date', date)
            .not('status', 'in', ['canceled', 'completed'])
            .overlaps('time_slot', JSON.stringify({
                startTime,
                endTime
            }));


        if (excludeScheduleId) {
            query = query.not('id', 'eq', excludeScheduleId);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return !data || data.length === 0;
    },

    /**
     * Get installer availability for a specific date
     */
    async getInstallerAvailability(installerId: string, date: string, duration: number = 120) {
        const supabase = createClient();

        // Get existing schedules for the installer on this date
        const { data: schedules, error } = await supabase
            .from('installation_schedules')
            .select('time_slot')
            .eq('installer_id', installerId)
            .eq('scheduled_date', date)
            .not('status', 'in', ['canceled', 'completed'])
            .order('time_slot.startTime', { ascending: true });

        if (error) throw new Error(error.message);

        // Generate time slots (assuming 9 AM to 6 PM, 30-minute intervals)
        const timeSlots: TimeSlot[] = [];
        const startHour = 9;
        const endHour = 18;

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const slotStartTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const slotEndTime = this.addMinutes(slotStartTime, duration);

                // Check if slot ends after endHour:00
                if (slotEndTime && parseInt(slotEndTime.split(':')[0] || '0') >= endHour) {
                    continue;
                }

                // Check if slot overlaps with any existing schedules
                const isAvailable = !(schedules || []).some(schedule => {
                    return this.isTimeOverlap(
                        slotStartTime, slotEndTime,
                        schedule.time_slot.startTime, schedule.time_slot.endTime
                    );
                });

                timeSlots.push({
                    startTime: slotStartTime,
                    endTime: slotEndTime,
                    isAvailable
                });
            }
        }

        return {
            date,
            timeSlots
        } as InstallationAvailability;
    },

    /**
     * Create installation route plan
     */
    async createInstallationRoutePlan(data: CreateInstallationRoutePlanRequest) {
        const supabase = createClient();
        const { data: user } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Get installations with their addresses
        const { data: installations, error: installationsError } = await supabase
            .from('installation_schedules')
            .select(`
                id, installation_id, customer_name, project_address, scheduled_date, time_slot,
                installation:installation_orders(sales_order_id, sales_order:sales_orders(customer:customers(phone)))
            `)
            .in('installation_id', data.installationIds)
            .eq('scheduled_date', data.date);

        if (installationsError) throw new Error(installationsError.message);
        if (!installations || installations.length === 0) throw new Error('No installations found for the given IDs');

        // Create route plan (simplified - in real scenario, use a routing API to optimize the order)
        const routePlan = {
            date: data.date,
            installer_id: data.installerId,
            installations: installations.map((install, index) => ({
                installation_id: install.installation_id || '',
                installation_no: (install as any).installation_no || '',
                customer_name: install.customer_name || '',
                project_address: install.project_address || '',
                scheduled_time: install.time_slot?.startTime || '',
                sequence: index + 1,
                estimated_travel_time: index === 0 ? 0 : 30, // Default 30 mins travel time between installations
                estimated_travel_distance: index === 0 ? 0 : 10 // Default 10 km between installations
            })),
            total_travel_time: Math.max(0, (installations.length - 1)) * 30,
            total_travel_distance: Math.max(0, (installations.length - 1)) * 10,
            estimated_start_time: (installations[0]?.time_slot?.startTime || '') as string,
            estimated_end_time: (installations[installations.length - 1]?.time_slot?.endTime || '') as string,
            created_by: user.user?.id
        };

        const { data: createdPlan, error } = await supabase
            .from('installation_route_plans')
            .insert(routePlan)
            .select(`
                *, 
                installer:users(name)
            `)
            .single();

        if (error) throw new Error(error.message);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.mapToInstallationRoutePlan(createdPlan as any);
    },

    /**
     * Get installation route plan
     */
    async getInstallationRoutePlan(planId: string) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('installation_route_plans')
            .select(`
                *, 
                installer:users(name),
                plan_installations:installation_route_plan_installations(
                    *, 
                    installation:installation_schedules(installation_no, customer_name, project_address, time_slot)
                )
            `)
            .eq('id', planId)
            .single();

        if (error) throw new Error(error.message);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.mapToInstallationRoutePlan(data as any);
    },

    /**
     * Get installation route plans by installer ID and date
     */
    async getInstallationRoutePlansByInstallerAndDate(installerId: string, date: string) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('installation_route_plans')
            .select(`
                *, 
                installer:users(name),
                plan_installations:installation_route_plan_installations(
                    *, 
                    installation:installation_schedules(installation_no, customer_name, project_address, time_slot)
                )
            `)
            .eq('installer_id', installerId)
            .eq('date', date);

        if (error) throw new Error(error.message);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((item: any) => this.mapToInstallationRoutePlan(item));
    },

    /**
     * Create installation reminder
     */
    async createInstallationReminder(data: CreateInstallationReminderRequest) {
        const supabase = createClient();
        const { data: user } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: reminder, error } = await supabase
            .from('installation_reminders')
            .insert({
                installation_id: data.installationId,
                type: data.type,
                recipient: data.recipient,
                content: data.content,
                scheduled_time: data.scheduledTime,
                status: 'pending',
                created_by: user.user?.id
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.mapToInstallationReminder(reminder as any);
    },

    /**
     * Get installation reminders by installation ID
     */
    async getInstallationRemindersByInstallationId(installationId: string) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('installation_reminders')
            .select('*')
            .eq('installation_id', installationId)
            .order('scheduled_time', { ascending: true });

        if (error) throw new Error(error.message);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((item: any) => this.mapToInstallationReminder(item));
    },

    // Helper to calculate duration in minutes
    calculateDuration(startTime: string, endTime: string): number {
        const startParts = startTime.split(':').map(Number);
        const endParts = endTime.split(':').map(Number);
        const startHour = startParts[0] || 0;
        const startMinute = startParts[1] || 0;
        const endHour = endParts[0] || 0;
        const endMinute = endParts[1] || 0;
        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;
        return endTotalMinutes - startTotalMinutes;
    },

    // Helper to check time overlap
    isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
        return start1 < end2 && end1 > start2;
    },

    // Helper to add minutes to time string
    addMinutes(time: string, minutes: number): string {
        const timeParts = time.split(':').map(Number);
        const hour = timeParts[0] || 0;
        const minute = timeParts[1] || 0;
        const totalMinutes = hour * 60 + minute + minutes;
        const newHour = Math.floor(totalMinutes / 60);
        const newMinute = totalMinutes % 60;
        return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
    },

    // Helper to map DB result to InstallationSchedule Type
    mapToInstallationSchedule(dbRecord: InstallationScheduleFromDB): InstallationSchedule {
        return {
            id: dbRecord.id,
            installationId: dbRecord.installation_id,
            installationNo: dbRecord.installation_no,
            customerName: dbRecord.customer_name,
            projectAddress: dbRecord.project_address,
            scheduledDate: dbRecord.scheduled_date,
            timeSlot: dbRecord.time_slot,
            estimatedDuration: dbRecord.estimated_duration,
            installerId: dbRecord.installer_id,
            installerName: dbRecord.installer?.name || '',
            installationTeamId: dbRecord.installation_team_id,
            installationTeamName: dbRecord.installation_team?.name,
            status: dbRecord.status,
            notes: dbRecord.notes,
            createdAt: dbRecord.created_at,
            updatedAt: dbRecord.updated_at
        };
    },

    // Helper to map DB result to InstallationRoutePlan Type
    mapToInstallationRoutePlan(dbRecord: InstallationRoutePlanFromDB): InstallationRoutePlan {
        return {
            id: dbRecord.id,
            date: dbRecord.date,
            installerId: dbRecord.installer_id,
            installerName: dbRecord.installer?.name || '',
            installations: (dbRecord.plan_installations || dbRecord.installations || []).map((item) => ({
                id: item.installation_id || item.id,
                installationNo: item.installation_no || item.installation?.installation_no || '',
                customerName: item.customer_name || item.installation?.customer_name || '',
                projectAddress: item.project_address || item.installation?.project_address || '',
                scheduledTime: item.scheduled_time || item.installation?.time_slot?.startTime || '',
                sequence: item.sequence,
                estimatedTravelTime: item.estimated_travel_time,
                estimatedTravelDistance: item.estimated_travel_distance
            })),
            totalTravelTime: dbRecord.total_travel_time,
            totalTravelDistance: dbRecord.total_travel_distance,
            estimatedStartTime: dbRecord.estimated_start_time,
            estimatedEndTime: dbRecord.estimated_end_time,
            createdAt: dbRecord.created_at,
            updatedAt: dbRecord.updated_at
        };
    },

    // Helper to map DB result to InstallationReminder Type
    mapToInstallationReminder(dbRecord: InstallationReminderFromDB): InstallationReminder {
        return {
            id: dbRecord.id,
            installationId: dbRecord.installation_id,
            type: dbRecord.type as 'sms' | 'app' | 'wechat',
            recipient: dbRecord.recipient,
            content: dbRecord.content,
            scheduledTime: dbRecord.scheduled_time,
            status: dbRecord.status,
            sentTime: dbRecord.sent_time,
            failureReason: dbRecord.failure_reason,
            createdAt: dbRecord.created_at,
            updatedAt: dbRecord.updated_at
        };
    }
};
