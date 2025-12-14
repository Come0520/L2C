const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rdpiajialjnmngnaokix.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_0NzVI9zoIaiXxjyQ_4s08w_A4IyK8fL';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ADMIN_EMAIL = 'bigeyecome@hotmail.com';
const PASSWORD = '123456';

async function runTests() {
    console.log('🚀 Starting RPC Function Verification (Smoke Test)...');

    // 1. Login
    console.log(`Logging in as Admin: ${ADMIN_EMAIL}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: PASSWORD
    });

    if (authError) {
        console.error(`❌ Admin login failed: ${authError.message}`);
        process.exit(1);
    }
    console.log(`✅ Logged in.`);

    const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
        global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } }
    });

    // 2. Verify Functions Exist by calling them with dummy data
    const dummyOrderId = '00000000-0000-0000-0000-000000000000';
    const dummyUserId = authData.user.id;

    const tests = [
        {
            name: 'update_order_status_v2',
            call: () => client.rpc('update_order_status_v2', {
                p_order_id: dummyOrderId,
                p_new_status: 'pending_measurement',
                p_user_id: dummyUserId,
                p_expected_version: 1,
                p_note: 'Smoke Test'
            })
        },
        {
            name: 'batch_assign_sales_person',
            call: () => client.rpc('batch_assign_sales_person', {
                p_order_ids: [dummyOrderId],
                p_sales_person_id: dummyUserId,
                p_actor_id: dummyUserId
            })
        },
        {
            name: 'get_order_status_history_enhanced',
            call: () => client.rpc('get_order_status_history_enhanced', {
                p_order_id: dummyOrderId,
                p_limit: 10,
                p_offset: 0
            })
        },
        {
            name: 'get_order_status_statistics',
            call: () => client.rpc('get_order_status_statistics', {
                p_order_id: dummyOrderId
            })
        }
    ];

    let passed = 0;
    for (const test of tests) {
        console.log(`\nTesting ${test.name}...`);
        try {
            const { data, error } = await test.call();
            
            if (error) {
                // If error is "function does not exist", FAIL.
                // If error is "relation not found" or "invalid input" or "permission denied" or custom logic error, PASS (function exists).
                if (error.message.includes('function') && error.message.includes('does not exist')) {
                     console.error(`❌ Function MISSING: ${error.message}`);
                } else {
                     console.log(`✅ Function Exists (returned logic error or empty): ${error.message}`);
                     passed++;
                }
            } else {
                console.log(`✅ Function Exists (returned data):`, data);
                passed++;
            }
        } catch (err) {
            console.error(`❌ Unexpected Error:`, err);
        }
    }

    console.log(`\nSummary: ${passed}/${tests.length} Functions Verified.`);
}

runTests();
