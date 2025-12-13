const { createClient } = require('@supabase/supabase-js');

// Config from .env.local
const SUPABASE_URL = 'https://rdpiajialjnmngnaokix.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0NzVI9zoIaiXxjyQ_4s08w_A4IyK8fL';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testLogin() {
    const EMAIL = 'bigeyecome@hotmail.com';
    const PASSWORD = '123456';

    console.log('='.repeat(60));
    console.log('Testing Email Login for:', EMAIL);
    console.log('='.repeat(60));

    try {
        // Attempt login
        const { data, error } = await supabase.auth.signInWithPassword({
            email: EMAIL,
            password: PASSWORD
        });

        if (error) {
            console.log('\n❌ LOGIN FAILED');
            console.log('Error Code:', error.status);
            console.log('Error Message:', error.message);
            console.log('Error Details:', JSON.stringify(error, null, 2));

            // Check if it's an email confirmation issue
            if (error.message.includes('Email not confirmed')) {
                console.log('\n⚠️  ISSUE: Email needs to be confirmed');
                console.log('Please check your email for a confirmation link');
            }

            return;
        }

        if (data.user) {
            console.log('\n✅ LOGIN SUCCESSFUL!');
            console.log('-'.repeat(60));
            console.log('User Details:');
            console.log('  - User ID:', data.user.id);
            console.log('  - Email:', data.user.email);
            console.log('  - Email Confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No ⚠️');
            console.log('  - Role:', data.user.user_metadata?.role || 'N/A');
            console.log('  - Created:', data.user.created_at);
            console.log('-'.repeat(60));

            if (data.session) {
                console.log('\nSession Token (first 50 chars):', data.session.access_token.substring(0, 50) + '...');
            }
        } else {
            console.log('\n⚠️  Login succeeded but no user data returned');
        }

    } catch (err) {
        console.log('\n❌ UNEXPECTED ERROR');
        console.error(err);
    }
}

testLogin()
    .then(() => {
        console.log('\n' + '='.repeat(60));
        console.log('Test Complete');
        console.log('='.repeat(60));
        process.exit(0);
    })
    .catch(e => {
        console.error('\n❌ Fatal error:', e);
        process.exit(1);
    });
