import { useEffect, useState } from 'react'
import { DataService } from '@/lib/dataService'

export default function TestDatabase() {
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    testDatabase()
  }, [])

  const testDatabase = async () => {
    const logs: string[] = []
    
    try {
      logs.push('🚀 Starting database tests...')
      
      // Test connection
      const connectionTest = await DataService.testDatabaseConnection()
      logs.push(`Database connection: ${connectionTest ? '✅ Success' : '❌ Failed'}`)
      
      // Test each service method
      const users = await DataService.getAllUsers()
      logs.push(`Users: ${users.length} found`)
      
      const feederPoints = await DataService.getAllFeederPoints()
      logs.push(`Feeder Points: ${feederPoints.length} found`)
      
      const teams = await DataService.getTeams()
      logs.push(`Teams: ${teams.length} found`)
      
      // Show sample data
      if (feederPoints.length > 0) {
        logs.push(`Sample feeder point: ${JSON.stringify(feederPoints[0], null, 2)}`)
      }
      
      if (users.length > 0) {
        logs.push(`Sample user: ${JSON.stringify(users[0], null, 2)}`)
      }
      
      logs.push('✅ All tests completed')
      
    } catch (error) {
      logs.push(`❌ Error during testing: ${error.message}`)
    }
    
    setResults(logs)
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>
      
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Testing database connection...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg font-mono text-sm ${
                result.includes('❌') ? 'bg-red-50 text-red-800' :
                result.includes('✅') ? 'bg-green-50 text-green-800' :
                result.includes('🚀') || result.includes('🧪') ? 'bg-blue-50 text-blue-800' :
                'bg-gray-50 text-gray-800'
              }`}
            >
              {result}
            </div>
          ))}
          
          <button 
            onClick={testDatabase}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Run Tests Again
          </button>
        </div>
      )}
    </div>
  )
}
