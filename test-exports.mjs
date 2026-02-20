import * as actions from './src/features/dashboard/actions.ts';

console.log('Exported keys:', Object.keys(actions));

const expected = [
    'getUserDashboardConfig',
    'saveUserDashboardConfig',
    'resetDashboardConfig',
    'getDashboardStats'
];

expected.forEach(key => {
    if (actions[key]) {
        console.log(`✅ Found: ${key} (${typeof actions[key]})`);
    } else {
        console.log(`❌ Missing: ${key}`);
    }
});
