import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
    // 1. 获取当前时间
    const now = new Date().toISOString()

    // 2. 查询到期且未完成的提醒
    const { data: reminders, error } = await supabase
        .from('reminders')
        .select('*, user:users(email, phone)') // 假设有关联的用户信息
        .lte('due_at', now)
        .eq('is_completed', false)
        .eq('is_notified', false) // 假设新增一个字段防止重复通知

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    if (!reminders || reminders.length === 0) {
        return new Response(JSON.stringify({ message: 'No due reminders' }), { status: 200 })
    }

    // 3. 发送通知 (模拟)
    const results = []
    for (const reminder of reminders) {
        console.log(`[NOTIFICATION] Reminder due: "${reminder.title}" for user ${reminder.user_id}`)

        // TODO: 集成 Resend 或 Twilio 发送真实通知

        // 4. 标记为已通知
        const { error: updateError } = await supabase
            .from('reminders')
            .update({ is_notified: true })
            .eq('id', reminder.id)

        if (updateError) {
            console.error(`Failed to update reminder ${reminder.id}:`, updateError)
        } else {
            results.push(reminder.id)
        }
    }

    return new Response(
        JSON.stringify({ message: `Processed ${results.length} reminders`, processed_ids: results }),
        { headers: { 'Content-Type': 'application/json' } }
    )
})
