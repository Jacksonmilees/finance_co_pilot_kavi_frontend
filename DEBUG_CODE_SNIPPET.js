// Quick Debug Component - Add this temporarily to Transactions.jsx
// Place it right after the imports and before export default function Transactions()

// Add this right after line 28 (after const businesses = getBusinesses();)
console.log('=== TRANSACTIONS PAGE DEBUG ===');
console.log('1. User:', user);
console.log('2. User ID:', user?.id);
console.log('3. Businesses from getBusinesses():', businesses);
console.log('4. Active Business ID:', activeBusinessId);
console.log('5. Computed businessId:', businessId);
console.log('6. Query enabled?:', !!businessId && !!user?.id);
console.log('7. Transactions data:', transactions);
console.log('8. Is Loading?:', isLoading);
console.log('9. Error?:', transactionsError);
console.log('================================');
