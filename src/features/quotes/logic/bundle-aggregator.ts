// Bundle Aggregator Mock
export function aggregateBundle(bundle: any) {
    console.log('Mock aggregateBundle called');
    return { ...bundle, totalAmount: 0 };
}
