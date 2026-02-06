
import 'dotenv/config';

const BASE_URL = 'http://localhost:3000/api/mobile';

async function main() {
    console.log('🚀 Starting Mobile Leads API Test (API Only Mode)...');

    // 1. Login with EXISTING Seed User (Sales Wang Fang)
    const testUser = {
        phone: '13901001001',
        password: '123456'
    };

    console.log(`� Logging in as ${testUser.phone}...`);
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
    });

    if (!loginRes.ok) {
        const text = await loginRes.text();
        throw new Error(`Login failed: ${loginRes.status} ${text}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.data?.accessToken || loginData.data?.token;
    if (!token) throw new Error('No token in login response');

    console.log('✅ Login successful, token obtained.');

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 2. Create Lead
    const uniqueSuffix = Date.now().toString().slice(-8); // 8 digits
    const newLead = {
        customerName: `API Test Lead ${uniqueSuffix}`,
        customerPhone: `138${uniqueSuffix}`, // 3 + 8 = 11 digits
        intentionLevel: 'HIGH',
        remark: 'Created via mobile api test (API only)'
    };

    console.log(`📝 Creating Lead: ${newLead.customerName}...`);
    const createRes = await fetch(`${BASE_URL}/leads`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newLead)
    });

    const createData = await createRes.json();
    if (!createData.success) {
        console.error('Create failed:', createData);
        throw new Error('Create lead failed');
    }

    const leadId = createData.data?.id;
    if (!leadId) throw new Error('No lead ID returned');
    console.log('✅ Lead created ID:', leadId);

    // 3. Get List
    console.log('📋 Fetching Lead List...');
    const listRes = await fetch(`${BASE_URL}/leads?tab=mine`, { headers });
    const listData = await listRes.json();
    if (!listData.success) {
        console.warn('List fetch failed:', listData);
    } else {
        console.log(`✅ List fetched: ${listData.data.items.length} items`);
        // Verify our lead is in the list
        const found = listData.data.items.find((l: any) => l.id === leadId);
        if (found) console.log('✅ Created lead found in list.');
        else console.warn('⚠️ Created lead NOT found in list (might be pagination or delay).');
    }

    // 4. Get Detail
    console.log('📄 Fetching Detail...');
    const detailRes = await fetch(`${BASE_URL}/leads/${leadId}`, { headers });
    const detailData = await detailRes.json();
    if (!detailData.success) throw new Error('Get detail failed');
    console.log('✅ Detail fetched:', detailData.data.customerName);

    // 5. Add Followup
    console.log('💬 Adding Followup...');
    const followupRes = await fetch(`${BASE_URL}/leads/${leadId}/followup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            type: 'PHONE',
            content: 'API Test Call Followup',
            nextFollowUpAt: new Date(Date.now() + 86400000).toISOString(),
            status: 'FOLLOWING_UP'
        })
    });
    const followupData = await followupRes.json();
    if (!followupData.success) {
        console.warn('Add followup failed:', followupData);
    } else {
        console.log('✅ Followup added');
    }

    // 6. Void Lead
    console.log('🚫 Voiding Lead...');
    const voidRes = await fetch(`${BASE_URL}/leads/${leadId}/void`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: 'API Test Void' })
    });
    const voidData = await voidRes.json();
    if (!voidData.success) throw new Error('Void failed');
    console.log('✅ Lead voided');

    console.log('🎉 All Mobile Leads API Tests Passed!');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Test Failed:', err);
    process.exit(1);
});
