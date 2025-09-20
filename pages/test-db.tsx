import { useState } from 'react';
import { DataService } from '@/lib/dataService';

export default function TestDbPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleTestClick = async () => {
    setIsLoading(true);
    setResult(null);
    console.log('Starting database connection test...');
    const success = await DataService.testDatabaseConnection();
    if (success) {
      console.log('Test function returned success.');
      setResult('Connection test completed successfully! Check the console for details on collection counts.');
    } else {
      console.log('Test function returned failure.');
      setResult('Connection test failed. Check the browser\'s developer console for specific error messages from Firebase.');
    }
    setIsLoading(false);
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Firebase Connection Test</h1>
      <p>Click the button below to test the connection to your Firestore database.</p>
      <p>Open your browser\'s developer console (usually by pressing F12) to see detailed logs.</p>
      <button 
        onClick={handleTestClick} 
        disabled={isLoading}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        {isLoading ? 'Testing...' : 'Run Connection Test'}
      </button>
      {result && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <h2>Result:</h2>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}