// Test the smoke detector parsing functionality
const {
    parseSmokeDetectorCode
} = require('./src/lib/smoke-detector-utils.ts');

// Test cases
const testCases = [
    "224-1002-3SD 99354845",
    "222-1006-1SD 99123456",
    "225-1205-5SD 99876543",
    "222-106-2SD 99354845 L1-112,L1-132",
    "222-106-2SD 99354845 L1-01,L1-02",
    "invalid format",
    "123-456-2SD 789012"
];

console.log('Testing Smoke Detector Code Parsing:');
console.log('=====================================');

testCases.forEach(testCase => {
    const result = parseSmokeDetectorCode(testCase);
    console.log(`Input: "${testCase}"`);
    if (result) {
        console.log(`  ✓ Building: ${result.buildingNumber}`);
        console.log(`  ✓ Unit: ${result.unitNumber}`);
        console.log(`  ✓ Quantity: ${result.quantity} smoke detectors`);
        console.log(`  ✓ Phone: ${result.phoneNumber}`);
    } else {
        console.log(`  ✗ Failed to parse`);
    }
    console.log('');
});

// Test the statistics calculation
const mockPhoneIssues = [{
        id: '1',
        apartment_id: 'apt1',
        issue_type: 'smoke_detector',
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        created_at: new Date().toISOString()
    },
    {
        id: '2',
        apartment_id: 'apt1',
        issue_type: 'smoke_detector',
        status: 'resolved',
        resolved_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        created_at: new Date().toISOString()
    },
    {
        id: '3',
        apartment_id: 'apt1',
        issue_type: 'smoke_detector',
        status: 'open',
        created_at: new Date().toISOString()
    }
];

console.log('Testing Statistics Calculation:');
console.log('===============================');
console.log('Mock data: 2 resolved SD issues, 1 open SD issue');

// This would need to be imported properly in a real test
// const stats = calculateSmokeDetectorStats(mockPhoneIssues, 'apt1');
// console.log('Stats:', stats);