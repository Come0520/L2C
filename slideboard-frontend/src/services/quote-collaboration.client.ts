import { createClient } from '@/lib/supabase/client';

export interface QuoteCollaborator {
    id: string;
    quote_id: string;
    user_id: string;
    permission: 'view' | 'edit' | 'admin';
    invited_by?: string;
    invited_at: string;
    // User info from users table
    name?: string;
    avatar_url?: string;
    is_online?: boolean;
}

// 用户元数据类型
export interface UserMetaData {
    name?: string;
    avatar_url?: string;
    phone?: string;
    [key: string]: string | number | boolean | undefined;
}

// 数据库用户类型
export interface UserFromDB {
    id: string;
    raw_user_meta_data: UserMetaData;
}

// 报价协作原始数据库记录类型
export interface QuoteCollaboratorFromDB {
    id: string;
    quote_id: string;
    user_id: string;
    permission: 'view' | 'edit' | 'admin';
    invited_by?: string;
    invited_at: string;
    users: UserFromDB;
}

// 报价评论原始数据库记录类型
export interface QuoteCommentFromDB {
    id: string;
    quote_id: string;
    user_id: string;
    content: string;
    position_x?: number;
    position_y?: number;
    created_at: string;
    updated_at: string;
    users: UserFromDB;
}

export interface QuoteComment {
    id: string;
    quote_id: string;
    user_id: string;
    content: string;
    position?: { x: number; y: number };
    created_at: string;
    updated_at: string;
    // User info
    user_name?: string;
    user_avatar?: string;
}

class QuoteCollaborationService {
    private supabase = createClient();

    /**
     * Get collaborators for a quote
     */
    async getCollaborators(quoteId: string): Promise<QuoteCollaborator[]> {
        const { data, error } = await this.supabase
            .from('quote_collaborators')
            .select(`
        *,
        users (
          id,
          raw_user_meta_data
        )
      `)
            .eq('quote_id', quoteId)
            .order('invited_at', { ascending: false });

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((collab: any) => ({
            id: collab.id,
            quote_id: collab.quote_id,
            user_id: collab.user_id,
            permission: collab.permission,
            invited_by: collab.invited_by,
            invited_at: collab.invited_at,
            name: collab.users?.raw_user_meta_data?.name || 'Unknown',
            avatar_url: collab.users?.raw_user_meta_data?.avatar_url,
            is_online: false, // Would need real-time presence tracking
        }));
    }

    /**
     * Invite a collaborator to a quote
     */
    async inviteCollaborator(
        quoteId: string,
        userPhone: string,
        permission: 'view' | 'edit' = 'view'
    ): Promise<QuoteCollaborator> {
        const { data: user } = await this.supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        // Find user by phone (assuming phone is stored in user metadata)
        const { data: users, error: userError } = await this.supabase
            .from('users')
            .select('id, raw_user_meta_data')
            .eq('raw_user_meta_data->>phone', userPhone)
            .single();

        if (userError || !users) {
            throw new Error('User not found with this phone number');
        }

        // Add collaborator
        const { data: _data, error } = await this.supabase
            .from('quote_collaborators')
            .insert({
                quote_id: quoteId,
                user_id: users.id,
                permission,
                invited_by: user.user.id,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('User is already a collaborator');
            }
            throw error;
        }

        // Get full collaborator data
        const collaborators = await this.getCollaborators(quoteId);
        const newCollaborator = collaborators.find(c => c.user_id === users.id);

        if (!newCollaborator) throw new Error('Failed to retrieve collaborator data');

        return newCollaborator;
    }

    /**
     * Remove a collaborator from a quote
     */
    async removeCollaborator(quoteId: string, collaboratorId: string): Promise<void> {
        const { error } = await this.supabase
            .from('quote_collaborators')
            .delete()
            .eq('id', collaboratorId)
            .eq('quote_id', quoteId);

        if (error) throw error;
    }

    /**
     * Get comments for a quote
     */
    async getComments(quoteId: string): Promise<QuoteComment[]> {
        const { data, error } = await this.supabase
            .from('quote_comments')
            .select(`
        *,
        users (
          id,
          raw_user_meta_data
        )
      `)
            .eq('quote_id', quoteId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((comment: any) => ({
            id: comment.id,
            quote_id: comment.quote_id,
            user_id: comment.user_id,
            content: comment.content,
            position: typeof comment.position_x === 'number' && typeof comment.position_y === 'number'
                ? { x: comment.position_x, y: comment.position_y }
                : undefined,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
            user_name: comment.users?.raw_user_meta_data?.name || 'Unknown',
            user_avatar: comment.users?.raw_user_meta_data?.avatar_url,
        }));
    }

    /**
     * Add a comment to a quote
     */
    async addComment(
        quoteId: string,
        content: string,
        position?: { x: number; y: number }
    ): Promise<QuoteComment> {
        const { data: user } = await this.supabase.auth.getUser();
        if (!user.user) throw new Error('Not authenticated');

        const { data, error } = await this.supabase
            .from('quote_comments')
            .insert({
                quote_id: quoteId,
                user_id: user.user.id,
                content,
                position_x: position?.x,
                position_y: position?.y,
            })
            .select()
            .single();

        if (error) throw error;

        // Get full comment data
        const comments = await this.getComments(quoteId);
        const newComment = comments.find(c => c.id === data.id);

        if (!newComment) throw new Error('Failed to retrieve comment data');

        return newComment;
    }

    /**
     * Delete a comment
     */
    async deleteComment(commentId: string): Promise<void> {
        const { error } = await this.supabase
            .from('quote_comments')
            .delete()
            .eq('id', commentId);

        if (error) throw error;
    }
}

export const quoteCollaborationService = new QuoteCollaborationService();
