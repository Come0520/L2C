const { createClient } = require('@supabase/supabase-js');

// Config from .env.production
const SUPABASE_URL = 'https://rdpiajialjnmngnaokix.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0NzVI9zoIaiXxjyQ_4s08w_A4IyK8fL';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    const EMAIL = '15601911921@admin.com';
    const PASSWORD = '040316';
    const NAME = '来长城';

    console.log(`Creating user with email: ${EMAIL}...`);

    // 1. Try to sign in first to see if exists
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASSWORD
    });

    if (!signInError && signInData.user) {
        console.log('User already exists. Checking role...');
        // Login successful, get session to check own role (bypass RLS)
        const authenticatedClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
            global: {
                headers: {
                    Authorization: `Bearer ${signInData.session.access_token}`
                }
            }
        });
        await checkRole(authenticatedClient, signInData.user.id);
        return;
    }

    // 2. Sign Up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: EMAIL,
        password: PASSWORD,
        options: {
            data: {
                name: NAME,
                role: 'admin' // Important: expecting trigger to sync this to public.users
            }
        }
    });

    if (signUpError) {
        console.error('Sign up failed:', signUpError.message);
        process.exit(1);
    }

    if (signUpData.user) {
        console.log('User created successfully. ID:', signUpData.user.id);
        console.log('Waiting for trigger to sync to public.users...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // We are logged in after signUp if autoConfirm is on (default for email usually, but might require verify)
        // Check if we have session
        if (signUpData.session) {
            const authenticatedClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
                global: {
                    headers: {
                        Authorization: `Bearer ${signUpData.session.access_token}`
                    }
                }
            });
            await checkRole(authenticatedClient, signUpData.user.id);
        } else {
            console.log('User created but no session returned. Email confirmation might be required.');
            console.log('Please check your email if confirmation is enabled, or check Supabase dashboard.');
        }

    } else {
        console.log('Sign up successful but no user/session data returned.');
    }
}

async function checkRole(client, userId) {
    const { data, error } = await client
        .from('users')
        .select('role, id, name')
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
