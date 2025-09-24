import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function SeedData() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const sampleFeederPoints = [
    {
      name: 'Central Market Feeder Point',
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'Central Market, Connaught Place, New Delhi, India'
      },
      status: 'active',
      priority: 'high',
      description: 'Primary monitoring point for central market activities',
      assignedUserId: null,
      assignedTeamId: null,
      assignedAt: null,
      assignedBy: null,
      lastInspection: null,
      nextInspectionDue: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      name: 'Hospital Junction Monitoring',
      location: {
        latitude: 28.6129,
        longitude: 77.2295,
        address: 'AIIMS Hospital Junction, New Delhi, India'
      },
      status: 'active',
      priority: 'medium',
      description: 'Traffic and emergency access monitoring',
      assignedUserId: null,
      assignedTeamId: null,
      assignedAt: null,
      assignedBy: null,
      lastInspection: null,
      nextInspectionDue: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      name: 'Railway Station Security',
      location: {
        latitude: 28.6414,
        longitude: 77.2191,
        address: 'New Delhi Railway Station, New Delhi, India'
      },
      status: 'maintenance',
      priority: 'high',
      description: 'Railway station security and crowd management',
      assignedUserId: null,
      assignedTeamId: null,
      assignedAt: null,
      assignedBy: null,
      lastInspection: null,
      nextInspectionDue: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      name: 'Airport Terminal Checkpoint',
      location: {
        latitude: 28.5562,
        longitude: 77.1000,
        address: 'Indira Gandhi International Airport, New Delhi, India'
      },
      status: 'active',
      priority: 'high',
      description: 'Airport security and passenger flow monitoring',
      assignedUserId: null,
      assignedTeamId: null,
      assignedAt: null,
      assignedBy: null,
      lastInspection: null,
      nextInspectionDue: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      name: 'Industrial Area Patrol',
      location: {
        latitude: 28.4595,
        longitude: 77.0266,
        address: 'Gurgaon Industrial Area, Haryana, India'
      },
      status: 'inactive',
      priority: 'low',
      description: 'Industrial compliance and safety monitoring',
      assignedUserId: null,
      assignedTeamId: null,
      assignedAt: null,
      assignedBy: null,
      lastInspection: null,
      nextInspectionDue: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ]

  const seedFeederPoints = async () => {
    setLoading(true)
    const logs: string[] = []
    
    try {
      logs.push('🌱 Starting to seed feeder points...')
      
      for (let i = 0; i < sampleFeederPoints.length; i++) {
        const feederPoint = sampleFeederPoints[i]
        logs.push(`📍 Creating: ${feederPoint.name}`)
        
        const docRef = await addDoc(collection(db, 'feederPoints'), feederPoint)
        logs.push(`✅ Created with ID: ${docRef.id}`)
      }
      
      logs.push(`🎉 Successfully created ${sampleFeederPoints.length} feeder points!`)
      
    } catch (error) {
      logs.push(`❌ Error seeding data: ${(error as Error).message}`)
    }
    
    setResults(logs)
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Seed Database with Sample Data</h1>
      
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          <strong>Warning:</strong> This will add sample feeder points to your database. 
          Only run this if you need test data.
        </p>
      </div>
      
      <button 
        onClick={seedFeederPoints}
        disabled={loading}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Seeding Data...' : 'Seed Feeder Points'}
      </button>
      
      {results.length > 0 && (
        <div className="mt-6 space-y-2">
          <h2 className="text-lg font-semibold">Results:</h2>
          {results.map((result, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg font-mono text-sm ${
                result.includes('❌') ? 'bg-red-50 text-red-800' :
                result.includes('✅') || result.includes('🎉') ? 'bg-green-50 text-green-800' :
                result.includes('🌱') || result.includes('📍') ? 'bg-blue-50 text-blue-800' :
                'bg-gray-50 text-gray-800'
              }`}
            >
              {result}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
