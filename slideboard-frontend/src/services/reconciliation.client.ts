import { withErrorHandler } from '@/lib/api/error-handler';
import { supabase } from '@/lib/supabase/client';
import { ReconciliationStatement, CreateStatementRequest, StatementType } from '@/shared/types/reconciliation';
import { Database } from '@/shared/types/supabase';

type ReconciliationStatementRow = Database['public']['Tables']['reconciliation_statements']['Row'];
type ReconciliationItemRow = Database['public']['Tables']['reconciliation_items']['Row'];

interface ReconciliationStatementWithRelations extends ReconciliationStatementRow {
    items?: ReconciliationItemRow[];
    // Ideally we would join customer or supplier here, but since target_id is polymorphic (or just an ID), 
    // we might need separate queries or logic to fetch names if not stored.
    // For now, let's assume names are fetched or we join if possible.
    // But `reconciliation_statements` doesn't have FK to customers/suppliers in my definition (it has `target_id`).
    // So we might need to fetch target name manually or rely on client to know it.
    // Actually, in `getStatements`, we can try to join if we know the type.
    // Or we store `target_name` in the table? 
    // Let's assume we can fetch names separately or the UI handles it.
    // Wait, the frontend type `ReconciliationStatement` has `targetName`.
    // My DB schema `reconciliation_statements` does NOT have `target_name` (I missed adding it or assumed join).
    // Let's add `targetName` logic or fetching.
    // For simplicity in this iteration, I will assume we can get it from a join or separate call.
    // But since Supabase joins on polymorphic IDs are hard, let's assume we might need to add `target_name` to DB or fetch it.
    // Let's try to fetch it.
}

export const reconciliationService = {
  /**
   * Get reconciliation statements list
   */
  async getStatements(type: StatementType) {
    return withErrorHandler(async () => {
      let query = supabase
        .from('reconciliation_statements')
        .select(`
          *,
          items:reconciliation_items(*)
        `)
        .eq('type', type)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Enrich with target names (Customer or Supplier)
      // This is N+1 but necessary without polymorphic FKs or denormalization
      const enrichedData = await Promise.all((data || []).map(async (item) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const statement = item as any;
          let targetName = 'Unknown';
          if (statement.type === 'customer') {
              const { data: customer } = await supabase.from('customers').select('name').eq('id', statement.target_id).single();
              if (customer) targetName = customer.name;
          } else if (statement.type === 'supplier') {
              const { data: supplier } = await supabase.from('suppliers').select('name').eq('id', statement.target_id).single();
              if (supplier) targetName = supplier.name;
          }
          return { ...statement, target_name: targetName };
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return enrichedData.map(item => this.mapToStatement(item as any));
    });
  },

  /**
   * Create reconciliation statement
   */
  async createStatement(data: CreateStatementRequest) {
    return withErrorHandler(async () => {
      // 1. Calculate total amount
      const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);
      
      // 2. Generate Statement No
      const statementNo = `ST-${data.type === 'customer' ? 'C' : 'S'}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      // 3. Insert Statement
      const { data: stmt, error: stmtError } = await supabase
        .from('reconciliation_statements')
        .insert({
          statement_no: statementNo,
          type: data.type,
          target_id: data.targetId,
          period_start: data.periodStart,
          period_end: data.periodEnd,
          total_amount: totalAmount,
          status: 'draft',
          created_by: (await supabase.auth.getUser()).data.user?.id || ''
        } as any)
        .select()
        .single();

      if (stmtError) throw stmtError;

      // 4. Insert Items
      const itemsToInsert = data.items.map(item => ({
        statement_id: stmt.id,
        source_type: item.sourceType,
        source_id: item.sourceId,
        amount: item.amount,
        date: item.date
      }));

      const { error: itemsError } = await supabase
        .from('reconciliation_items')
        .insert(itemsToInsert as any);

      if (itemsError) throw itemsError;

      return stmt;
    });
  },

  // Helper to map DB result to Frontend Type
  mapToStatement(dbRecord: ReconciliationStatementWithRelations & { target_name?: string }): ReconciliationStatement {
      return {
          id: dbRecord.id,
          statementNo: dbRecord.statement_no,
          type: dbRecord.type as StatementType,
          targetId: dbRecord.target_id,
          targetName: dbRecord.target_name || '',
          periodStart: dbRecord.period_start,
          periodEnd: dbRecord.period_end,
          totalAmount: dbRecord.total_amount,
          status: dbRecord.status as any,
          items: (dbRecord.items || []).map(item => ({
              id: item.id,
              statementId: item.statement_id,
              sourceType: item.source_type as any,
              sourceId: item.source_id,
              sourceNo: '', // Need to fetch or store source no? Ideally store it or fetch. For now empty.
              amount: item.amount,
              date: item.date,
              notes: item.notes || undefined
          })),
          createdBy: dbRecord.created_by,
          createdAt: dbRecord.created_at,
          updatedAt: dbRecord.updated_at
      };
  }
};
