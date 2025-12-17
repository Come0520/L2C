const { createClient } = require('@supabase/supabase-js');

// Config from .env.local
const SUPABASE_URL = 'https://rdpiajialjnmngnaokix.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0NzVI9zoIaiXxjyQ_4s08w_A4IyK8fL';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    const EMAIL = 'bigeyecome@hotmail.com';
    const PASSWORD = '123456';

    console.log(`Updating user ${EMAIL} to admin role...`);

    // 1. Sign in with the user's credentials
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASSWORD
    });

    if (signInError) {
        console.error('❌ Login failed:', signInError.message);
        process.exit(1);
    }

    if (!signInData.user) {
        console.error('❌ No user data returned after login');
        process.exit(1);
    }

    console.log('✅ User logged in successfully. User ID:', signInData.user.id);

    // 2. Update user metadata to LEAD_ADMIN (super admin) role
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        data: {
            role: 'LEAD_ADMIN'
        }
    });

    if (updateError) {
        console.error('❌ Failed to update user metadata:', updateError.message);
        process.exit(1);
    }

    console.log('✅ User metadata updated successfully');

    // 3. Update public.users table (if exists)
    const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .update({ role: 'LEAD_ADMIN' })
        .eq('supabase_uid', signInData.user.id)
        .select();

    if (publicError) {
        console.log('⚠️  Warning: Could not update public.users table:', publicError.message);
        console.log('   This might be expected if RLS policies prevent direct updates.');
    } else if (publicUsers && publicUsers.length > 0) {
        console.log('✅ Public users table updated successfully');
        console.log('   Updated user:', publicUsers[0]);
    } else {
        console.log('⚠️  No rows updated in public.users table');
    }

    // 4. Verify the update
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        console.log('\n📋 Final user data:');
        console.log('   Email:', session.user.email);
        console.log('   Role (from metadata):', session.user.user_metadata?.role);
        console.log('   User ID:', session.user.id);
    }

    console.log('\n✅ SUCCESS: User has been set as admin!');
    console.log('   The user may need to log out and log back in for changes to take effect.');
}

main()
    .then(() => process.exit(0))
    .catch(e => {
        console.error('❌ Unexpected error:', e);
        process.exit(1);
    });
