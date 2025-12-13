import { createClient } from '@/lib/supabase/client';
import { Database } from '@/shared/types/supabase';
import {
    InstallationTeam,
    Installer,
    InstallationTeamListItem,
    InstallerListItem,
    CreateInstallationTeamRequest,
    UpdateInstallationTeamRequest,
    CreateInstallerRequest,
    UpdateInstallerRequest
} from '@/types/installation-team';

type InstallationTeamRow = Database['public']['Tables']['installation_teams']['Row'];
type InstallerRow = Database['public']['Tables']['installers']['Row'];

interface InstallationTeamWithRelations extends InstallationTeamRow {
    team_leader?: { name: string } | null;
    team_members?: Array<{
        installer_id: string;
        installer?: { name: string; skill_level: string } | null;
    }> | null;
}

interface InstallerWithRelations extends InstallerRow {
    team?: { name: string } | null;
}


interface TeamQueryParams {
    page?: number;
    pageSize?: number;
    status?: string;
    name?: string;
    teamLeaderId?: string;
}

interface InstallerQueryParams {
    page?: number;
    pageSize?: number;
    status?: string;
    skillLevel?: string;
    name?: string;
    teamId?: string;
}

export const installationTeamService = {
    /**
     * Create installation team
     */
    async createInstallationTeam(data: CreateInstallationTeamRequest) {
        const supabase = createClient();

        // Start a transaction
        const { data: team, error: teamError } = await supabase
            .from('installation_teams')
            .insert({
                name: data.name,
                team_leader_id: data.teamLeaderId,
                status: 'active',
                total_members: data.teamMemberIds.length + 1 // +1 for team leader
            })
            .select()
            .single();

        if (teamError) throw new Error(teamError.message);

        // Add team members
        const teamMembers = data.teamMemberIds.map(memberId => ({
            team_id: team.id,
            installer_id: memberId
        }));

        const { error: membersError } = await supabase
            .from('installation_team_members')
            .insert(teamMembers);

        if (membersError) {
            // Rollback team creation if adding members fails
            await supabase.from('installation_teams').delete().eq('id', team.id);
            throw new Error(membersError.message);
        }

        // Update team leader's team_id
        const { error: leaderError } = await supabase
            .from('installers')
            .update({ team_id: team.id })
            .eq('id', data.teamLeaderId);

        if (leaderError) {
            // Rollback team creation and members if updating leader fails
            await supabase.from('installation_team_members').delete().eq('team_id', team.id);
            await supabase.from('installation_teams').delete().eq('id', team.id);
            throw new Error(leaderError.message);
        }

        // Update team members' team_id
        const { error: membersUpdateError } = await supabase
            .from('installers')
            .update({ team_id: team.id })
            .in('id', data.teamMemberIds);

        if (membersUpdateError) {
            // Rollback all changes if updating members fails
            await supabase.from('installation_team_members').delete().eq('team_id', team.id);
            await supabase.from('installation_teams').delete().eq('id', team.id);
            await supabase.from('installers').update({ team_id: null }).eq('id', data.teamLeaderId);
            throw new Error(membersUpdateError.message);
        }

        return this.getInstallationTeamById(String(team.id));
    },

    /**
     * Update installation team
     */
    async updateInstallationTeam(id: string, data: UpdateInstallationTeamRequest) {
        const supabase = createClient();
        const updateData: Database['public']['Tables']['installation_teams']['Update'] = {};

        if (data.name) updateData.name = data.name;
        if (data.status) updateData.status = data.status;
        if (data.teamLeaderId) updateData.team_leader_id = data.teamLeaderId;

        // Update team
        const { data: team, error: teamError } = await supabase
            .from('installation_teams')
            .update(updateData)
            .eq('id', Number(id))
            .select()
            .single();

        if (teamError) throw new Error(teamError.message);

        // Update team members if provided
        if (data.teamMemberIds) {
            // Get current members
            const { data: currentMembers, error: currentMembersError } = await supabase
                .from('installation_team_members')
                .select('installer_id')
                .eq('team_id', Number(id));

            if (currentMembersError) throw new Error(currentMembersError.message);

            const currentMemberIds = currentMembers.map(member => member.installer_id);
            const newMemberIds = data.teamMemberIds;
            const teamLeaderId = data.teamLeaderId || team.team_leader_id;

            if (teamLeaderId && teamLeaderId !== team.team_leader_id) {
                const { error: leaderUpdateError } = await supabase
                    .from('installation_teams')
                    .update({ team_leader_id: teamLeaderId })
                    .eq('id', Number(id))
                if (leaderUpdateError) throw new Error(leaderUpdateError.message)
            }

            // Members to add
            const membersToAdd = newMemberIds.filter(id => !currentMemberIds.includes(id));
            // Members to remove
            const membersToRemove = currentMemberIds.filter(id => !newMemberIds.includes(id));

            // Add new members
            if (membersToAdd.length > 0) {
                const membersToInsert = membersToAdd.map(memberId => ({
                    team_id: Number(id),
                    installer_id: memberId
                }));

                const { error: addError } = await supabase
                    .from('installation_team_members')
                    .insert(membersToInsert);

                if (addError) throw new Error(addError.message);

                // Update new members' team_id
                const { error: updateAddError } = await supabase
                    .from('installers')
                    .update({ team_id: Number(id) })
                    .in('id', membersToAdd);

                if (updateAddError) throw new Error(updateAddError.message);
            }

            // Remove members
            if (membersToRemove.length > 0) {
                const { error: removeError } = await supabase
                    .from('installation_team_members')
                    .delete()
                    .eq('team_id', Number(id))
                    .in('installer_id', membersToRemove);

                if (removeError) throw new Error(removeError.message);

                // Update removed members' team_id to null
                const { error: updateRemoveError } = await supabase
                    .from('installers')
                    .update({ team_id: null })
                    .in('id', membersToRemove);

                if (updateRemoveError) throw new Error(updateRemoveError.message);
            }

            // Update total members count
            await supabase
                .from('installation_teams')
                .update({ total_members: newMemberIds.length + 1 }) // +1 for team leader
                .eq('id', Number(id));
        }

        return this.getInstallationTeamById(id);
    },

    /**
     * Delete installation team
     */
    async deleteInstallationTeam(id: string) {
        const supabase = createClient();

        // Get team members
        const { data: members, error: membersError } = await supabase
            .from('installation_team_members')
            .select('installer_id')
            .eq('team_id', Number(id));

        if (membersError) throw new Error(membersError.message);

        const memberIds = members.map(member => member.installer_id);

        // Get team leader
        const { data: team, error: teamError } = await supabase
            .from('installation_teams')
            .select('team_leader_id')
            .eq('id', Number(id))
            .single();

        if (teamError) throw new Error(teamError.message);

        // Start transaction
        // Remove team members
        const { error: removeMembersError } = await supabase
            .from('installation_team_members')
            .delete()
            .eq('team_id', Number(id));

        if (removeMembersError) throw new Error(removeMembersError.message);

        // Update team leader's team_id to null
        const { error: updateLeaderError } = await supabase
            .from('installers')
            .update({ team_id: null })
            .eq('id', team.team_leader_id);

        if (updateLeaderError) throw new Error(updateLeaderError.message);

        // Update team members' team_id to null
        const { error: updateMembersError } = await supabase
            .from('installers')
            .update({ team_id: null })
            .in('id', memberIds);

        if (updateMembersError) throw new Error(updateMembersError.message);

        // Delete team
        const { error: deleteTeamError } = await supabase
            .from('installation_teams')
            .delete()
            .eq('id', Number(id));

        if (deleteTeamError) throw new Error(deleteTeamError.message);
    },

    /**
     * Get installation teams list
     */
    async getInstallationTeams(params: TeamQueryParams = {}) {
        const supabase = createClient();
        const {
            page = 1,
            pageSize = 10,
            status,
            name,
            teamLeaderId
        } = params;

        let query = supabase
            .from('installation_teams')
            .select(`
                id, name, status, team_leader_id, total_members, 
                completed_installations, average_rating, created_at, updated_at,
                team_leader:users(name)
            `, { count: 'exact' });

        // Apply filters
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (name) {
            query = query.ilike('name', `%${name}%`);
        }
        if (teamLeaderId) {
            query = query.eq('team_leader_id', teamLeaderId);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await query
            .range(from, to)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            teams: (data || []).map((item: any) => this.mapToInstallationTeamListItem(item)),
            total: count || 0
        };
    },

    /**
     * Get installation team by ID
     */
    async getInstallationTeamById(id: string) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('installation_teams')
            .select(`
                *, 
                team_leader:users(name),
                team_members:installation_team_members(
                    installer_id,
                    installer:installers(id, name, skill_level, status)
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw new Error(error.message);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.mapToInstallationTeam(data as any);
    },

    /**
     * Create installer
     */
    async createInstaller(data: CreateInstallerRequest) {
        const supabase = createClient();

        const { data: installer, error } = await supabase
            .from('installers')
            .insert({
                user_id: data.userId,
                name: data.name,
                phone: data.phone,
                team_id: data.teamId ? Number(data.teamId) : null,
                status: 'active',
                skill_level: data.skillLevel,
                years_of_experience: data.yearsOfExperience,
                work_time: data.workTime as any,
                performance_rating: 0,
                completed_installations: 0,
                canceled_installations: 0,
                rework_installations: 0,
                total_working_hours: 0
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.mapToInstaller(installer as any);
    },

    /**
     * Update installer
     */
    async updateInstaller(id: string, data: UpdateInstallerRequest) {
        const supabase = createClient();

        const updateData: Database['public']['Tables']['installers']['Update'] = {};
        if (data.name) updateData.name = data.name;
        if (data.phone) updateData.phone = data.phone;
        if (data.avatar) updateData.avatar = data.avatar;
        if (data.status) updateData.status = data.status;
        if (data.skillLevel) updateData.skill_level = data.skillLevel;
        if (data.skills) updateData.skills = data.skills as any;
        if (data.qualifications) updateData.qualifications = data.qualifications as any;
        if (data.yearsOfExperience) updateData.years_of_experience = data.yearsOfExperience;
        if (data.workTime) updateData.work_time = data.workTime as any;
        if (data.teamId !== undefined) updateData.team_id = data.teamId ? Number(data.teamId) : null;

        const { data: installer, error } = await supabase
            .from('installers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.mapToInstaller(installer as any);
    },

    /**
     * Delete installer
     */
    async deleteInstaller(id: string) {
        const supabase = createClient();

        // Remove from team if in a team
        const { error: removeFromTeamError } = await supabase
            .from('installation_team_members')
            .delete()
            .eq('installer_id', id);

        if (removeFromTeamError) throw new Error(removeFromTeamError.message);

        // Delete installer
        const { error: deleteError } = await supabase
            .from('installers')
            .delete()
            .eq('id', id);

        if (deleteError) throw new Error(deleteError.message);
    },

    /**
     * Get installers list
     */
    async getInstallers(params: InstallerQueryParams = {}) {
        const supabase = createClient();
        const {
            page = 1,
            pageSize = 10,
            status,
            skillLevel,
            name,
            teamId
        } = params;

        let query = supabase
            .from('installers')
            .select(`
                id, name, phone, email, avatar, team_id, status, skill_level, 
                years_of_experience, performance_rating, completed_installations, 
                created_at, updated_at,
                team:installation_teams(name)
            `, { count: 'exact' });

        // Apply filters
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (skillLevel && skillLevel !== 'all') {
            query = query.eq('skill_level', skillLevel);
        }
        if (name) {
            query = query.ilike('name', `%${name}%`);
        }
        if (teamId && teamId !== 'all') {
            query = query.eq('team_id', Number(teamId));
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await query
            .range(from, to)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            installers: (data || []).map((item: any) => this.mapToInstallerListItem(item)),
            total: count || 0
        };
    },

    /**
     * Get installer by ID
     */
    async getInstallerById(id: string) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('installers')
            .select(`
                *, 
                team:installation_teams(name)
            `)
            .eq('id', id)
            .single();

        if (error) throw new Error(error.message);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.mapToInstaller(data as any);
    },

    /**
     * Add team member
     */
    async addTeamMember(teamId: string, installerId: string) {
        const supabase = createClient();

        // Check if installer already in a team
        const { data: existingTeam, error: existingTeamError } = await supabase
            .from('installers')
            .select('team_id')
            .eq('id', installerId)
            .single();

        if (existingTeamError) throw new Error(existingTeamError.message);

        if (existingTeam.team_id) {
            throw new Error('Installer is already in a team');
        }

        // Add to team members
        const { error: addMemberError } = await supabase
            .from('installation_team_members')
            .insert({
                team_id: Number(teamId),
                installer_id: installerId
            });

        if (addMemberError) throw new Error(addMemberError.message);

        // Update installer's team_id
        const { error: updateInstallerError } = await supabase
            .from('installers')
            .update({ team_id: Number(teamId) })
            .eq('id', installerId);

        if (updateInstallerError) {
            // Rollback
            await supabase
                .from('installation_team_members')
                .delete()
                .eq('team_id', Number(teamId))
                .eq('installer_id', installerId);
            throw new Error(updateInstallerError.message);
        }

        // Update team's total members
        const { data: team, error: fetchTeamError } = await supabase
            .from('installation_teams')
            .select('total_members')
            .eq('id', Number(teamId))
            .single()
        if (fetchTeamError) {
            await supabase
                .from('installation_team_members')
                .delete()
                .eq('team_id', Number(teamId))
                .eq('installer_id', installerId)
            throw new Error(fetchTeamError.message)
        }

        const { error: updateTeamError } = await supabase
            .from('installation_teams')
            .update({
                total_members: (team?.total_members || 0) + 1
            })
            .eq('id', Number(teamId))

        if (updateTeamError) {
            // Rollback
            await supabase
                .from('installation_team_members')
                .delete()
                .eq('team_id', Number(teamId))
                .eq('installer_id', installerId);
            await supabase
                .from('installers')
                .update({ team_id: null })
                .eq('id', installerId);
            throw new Error(updateTeamError.message);
        }
    },

    /**
     * Remove team member
     */
    async removeTeamMember(teamId: string, installerId: string) {
        const supabase = createClient();

        // Remove from team members
        const { error: removeMemberError } = await supabase
            .from('installation_team_members')
            .delete()
            .eq('team_id', Number(teamId))
            .eq('installer_id', installerId);

        if (removeMemberError) throw new Error(removeMemberError.message);

        // Update installer's team_id
        const { error: updateInstallerError } = await supabase
            .from('installers')
            .update({ team_id: null })
            .eq('id', installerId);

        if (updateInstallerError) {
            // Rollback
            await supabase
                .from('installation_team_members')
                .insert({
                    team_id: Number(teamId),
                    installer_id: installerId
                });
            throw new Error(updateInstallerError.message);
        }

        // Update team's total members
        const { data: team, error: fetchTeamError } = await supabase
            .from('installation_teams')
            .select('total_members')
            .eq('id', Number(teamId))
            .single()
        if (fetchTeamError) {
            await supabase
                .from('installation_team_members')
                .insert({ team_id: Number(teamId), installer_id: installerId })
            throw new Error(fetchTeamError.message)
        }

        const nextTotal = Math.max(0, (team?.total_members || 0) - 1)
        const { error: updateTeamError } = await supabase
            .from('installation_teams')
            .update({ total_members: nextTotal })
            .eq('id', Number(teamId))

        if (updateTeamError) {
            // Rollback
            await supabase
                .from('installation_team_members')
                .insert({
                    team_id: Number(teamId),
                    installer_id: installerId
                });
            await supabase
                .from('installers')
                .update({ team_id: Number(teamId) })
                .eq('id', installerId);
            throw new Error(updateTeamError.message);
        }
    },

    async getInstallerBindingStatus() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { matchedByUid: false, matchedByEmail: false, userId: null }
        const { data } = await supabase
            .from('installers')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
        const matchedByUid = !!(data && data.length > 0)
        return { matchedByUid, matchedByEmail: false, userId: user.id }
    },

    async bindCurrentUser() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, userId: null }
        return { success: true, userId: user.id }
    },

    // Helper to map DB result to InstallationTeamListItem Type
    mapToInstallationTeamListItem(dbRecord: InstallationTeamWithRelations): InstallationTeamListItem {
        return {
            id: String(dbRecord.id),
            name: dbRecord.name,
            status: dbRecord.status as any, // Cast if status enum doesn't match perfectly
            teamLeaderName: dbRecord.team_leader?.name || '',
            totalMembers: dbRecord.total_members,
            completedInstallations: dbRecord.completed_installations || 0,
            averageRating: dbRecord.average_rating || 0,
            createdAt: dbRecord.created_at || '',
            updatedAt: dbRecord.updated_at || ''
        };
    },

    // Helper to map DB result to InstallationTeam Type
    mapToInstallationTeam(dbRecord: InstallationTeamWithRelations): InstallationTeam {
        return {
            id: String(dbRecord.id),
            name: dbRecord.name,
            status: dbRecord.status as any,
            teamLeaderId: dbRecord.team_leader_id || '',
            teamLeaderName: dbRecord.team_leader?.name || '',
            teamMembers: dbRecord.team_members?.map((member) => ({
                installerId: member.installer_id,
                name: member.installer?.name || '',
                skillLevel: (member.installer?.skill_level || 'junior') as any
            })) || [],
            totalMembers: dbRecord.total_members,
            completedInstallations: dbRecord.completed_installations || 0,
            averageRating: dbRecord.average_rating || 0,
            createdAt: dbRecord.created_at || '',
            updatedAt: dbRecord.updated_at || ''
        };
    },

    // Helper to map DB result to InstallerListItem Type
    mapToInstallerListItem(dbRecord: InstallerWithRelations): InstallerListItem {
        return {
            id: dbRecord.id,
            name: dbRecord.name,
            status: dbRecord.status as any,
            skillLevel: dbRecord.skill_level as any,
            teamName: dbRecord.team?.name || undefined,
            performanceRating: dbRecord.performance_rating || 0,
            completedInstallations: dbRecord.completed_installations || 0,
            createdAt: dbRecord.created_at || ''
        };
    },

    // Helper to map DB result to Installer Type
    mapToInstaller(dbRecord: InstallerWithRelations): Installer {
        return {
            id: dbRecord.id,
            userId: dbRecord.user_id,
            name: dbRecord.name,
            phone: dbRecord.phone,
            avatar: dbRecord.avatar || undefined,
            teamId: dbRecord.team_id ? String(dbRecord.team_id) : undefined,
            teamName: dbRecord.team?.name || undefined,
            status: dbRecord.status as any,
            skillLevel: dbRecord.skill_level as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            skills: (dbRecord.skills as any) || [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            qualifications: (dbRecord.qualifications as any) || [],
            yearsOfExperience: dbRecord.years_of_experience || 0,
            workTime: (dbRecord.work_time as any) || [],
            currentLocation: undefined,
            performanceRating: dbRecord.performance_rating || 0,
            completedInstallations: dbRecord.completed_installations || 0,
            canceledInstallations: dbRecord.canceled_installations || 0,
            reworkInstallations: dbRecord.rework_installations || 0,
            totalWorkingHours: dbRecord.total_working_hours || 0,
            createdAt: dbRecord.created_at || '',
            updatedAt: dbRecord.updated_at || ''
        };
    }
};
