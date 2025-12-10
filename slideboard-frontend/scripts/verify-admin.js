const { createClient } = require('@supabase/supabase-js');

// Config from .env.production
const SUPABASE_URL = 'https://rdpiajialjnmngnaokix.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0NzVI9zoIaiXxjyQ_4s08w_A4IyK8fL';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    const PHONE = '15601911921';
    const PASSWORD = '040316';
    const NAME = '来长城';

    console.log(`Checking user: ${PHONE}...`);

    try {
        // 1. Try to sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            phone: PHONE,
            password: PASSWORD
        });

        if (signInError) {
            console.log('Sign in failed:', signInError.message);

            // If sign in failed, try to create user
            console.log('Attempting to create user...');
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                phone: PHONE,
                password: PASSWORD,
                options: {
                    data: {
                        name: NAME,
                        role: 'admin'
                    }
                }
            });

            if (signUpError) {
                console.error('Sign up failed:', signUpError.message);
                process.exit(1);
            }

            if (signUpData.user) {
                console.log('User created successfully. ID:', signUpData.user.id);
                // Wait for trigger
                await new Promise(resolve => setTimeout(resolve, 3000));
                await checkRole(supabase, signUpData.user.id);
            } else {
                console.log('Sign up successful but no user data returned.');
            }

        } else {
            console.log('User already exists and logged in successfully.');
            // Update checkRole to use the authenticated client if possible, but here 'supabase' is anon.
            // We should use the returned session to create an authenticated client to query the profile!
            // This bypasses RLS for "view own profile".

            const authenticatedClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
                global: {
                    headers: {
                        Authorization: `Bearer ${signInData.session.access_token}`
                    }
                }
            });

            await checkRole(authenticatedClient, signInData.user.id);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
}

async function checkRole(client, userId) {
    console.log('Checking role for user:', userId);
    // Check public.users
    const { data, error } = await client
        .from('users')
        .select('role, id, name')
        // We try querying by supabase_uid which is often the foreign key
        .eq('supabase_uid', userId)
        .maybeSingle();

    if (error) {
        console.log('Error checking public user role:', error.message);
        return;
    }

    if (!data) {
        console.log('User not found in public.users table (trigger might be delayed or failed).');
        return;
    }

    console.log(`User found in public.users: ${data.name} (Role: ${data.role})`);

    if (data.role === 'admin') {
        console.log('SUCCESS: User is an admin.');
    } else {
        console.log('WARNING: User exists but role is NOT admin.');
    }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
