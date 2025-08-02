import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, limit, where, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  totalComplaints: number;
  totalInspections: number;
  totalFeederPoints: number;
  totalTeams: number;
  totalIPRecords: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  organization?: string;
  department?: string;
  isActive: boolean;
  createdAt: any;
  lastLogin?: any;
}

export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  department: string;
  requestedRole: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reportedBy: string;
  assignedTo?: string;
  createdAt: any;
  updatedAt: any;
}

export interface IPRecord {
  id: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  deviceInfo: string;
  location?: string;
  registeredAt: any;
  lastUsed: any;
  isActive: boolean;
}

export class DataService {
  // Get dashboard statistics
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [
        usersSnapshot,
        activeUsersSnapshot,
        pendingRequestsSnapshot,
        complaintsSnapshot,
        inspectionsSnapshot,
        feederPointsSnapshot,
        teamsSnapshot,
        ipRecordsSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'approvedUsers')),
        getDocs(query(collection(db, 'approvedUsers'), where('isActive', '==', true))),
        getDocs(query(collection(db, 'accessRequests'), where('status', '==', 'pending'))),
        getDocs(collection(db, 'complaints')),
        getDocs(collection(db, 'inspections')),
        getDocs(collection(db, 'feederPoints')),
        getDocs(collection(db, 'teams')),
        getDocs(collection(db, 'ipRecords'))
      ]);

      return {
        totalUsers: usersSnapshot.size,
        activeUsers: activeUsersSnapshot.size,
        pendingRequests: pendingRequestsSnapshot.size,
        totalComplaints: complaintsSnapshot.size,
        totalInspections: inspectionsSnapshot.size,
        totalFeederPoints: feederPointsSnapshot.size,
        totalTeams: teamsSnapshot.size,
        totalIPRecords: ipRecordsSnapshot.size
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        pendingRequests: 0,
        totalComplaints: 0,
        totalInspections: 0,
        totalFeederPoints: 0,
        totalTeams: 0,
        totalIPRecords: 0
      };
    }
  }

  // Get all users
  static async getAllUsers(): Promise<User[]> {
    try {
      const snapshot = await getDocs(query(collection(db, 'approvedUsers'), orderBy('createdAt', 'desc')));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Get all access requests
  static async getAllAccessRequests(): Promise<AccessRequest[]> {
    try {
      const snapshot = await getDocs(query(collection(db, 'accessRequests'), orderBy('createdAt', 'desc')));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AccessRequest));
    } catch (error) {
      console.error('Error fetching access requests:', error);
      return [];
    }
  }

  // Get all complaints
  static async getAllComplaints(): Promise<Complaint[]> {
    try {
      const snapshot = await getDocs(query(collection(db, 'complaints'), orderBy('createdAt', 'desc')));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Complaint));
    } catch (error) {
      console.error('Error fetching complaints:', error);
      return [];
    }
  }

  // Get all IP records
  static async getAllIPRecords(): Promise<IPRecord[]> {
    try {
      const snapshot = await getDocs(query(collection(db, 'ipRecords'), orderBy('registeredAt', 'desc')));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as IPRecord));
    } catch (error) {
      console.error('Error fetching IP records:', error);
      return [];
    }
  }

  // Get recent activity (last 50 actions)
  static async getRecentActivity(): Promise<any[]> {
    try {
      // This would combine various activities from different collections
      // For now, we'll get recent user registrations and complaints
      const [usersSnapshot, complaintsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'approvedUsers'), orderBy('createdAt', 'desc'), limit(25))),
        getDocs(query(collection(db, 'complaints'), orderBy('createdAt', 'desc'), limit(25)))
      ]);

      const activities = [];

      // Add user activities
      usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'user_registered',
          description: `New user registered: ${data.name}`,
          timestamp: data.createdAt,
          user: data.name,
          email: data.email
        });
      });

      // Add complaint activities
      complaintsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'complaint_created',
          description: `New complaint: ${data.title}`,
          timestamp: data.createdAt,
          user: data.reportedBy,
          priority: data.priority
        });
      });

      // Sort by timestamp and return latest 50
      return activities
        .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds)
        .slice(0, 50);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  static async getUserReports(userId: string): Promise<any[]> {
    try {
      const snapshot = await getDocs(collection(db, 'complaints'))
      const reports = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(report => report.userId === userId)

      return reports
    } catch (error) {
      console.error('Error fetching user reports:', error)
      return []
    }
  }

  static async getUserFeederPoints(userId: string): Promise<any[]> {
    try {
      const snapshot = await getDocs(collection(db, 'feederPoints'))

      // Get feeder points assigned directly to the user
      let directlyAssignedPoints = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(point => point.assignedUserId === userId)

      // Get feeder points assigned to user's teams
      let teamAssignedPoints: any[] = []

      // First, get all teams where the user is a member
      const teamsSnapshot = await getDocs(collection(db, 'teams'))
      const userTeamIds: string[] = []

      teamsSnapshot.forEach((doc) => {
        const team = doc.data()
        const isMember = team.members && team.members.some((member: any) =>
          member.id === userId && member.isActive
        )

        if (isMember) {
          userTeamIds.push(team.id)
        }
      })

      // Get feeder points assigned to user's teams
      if (userTeamIds.length > 0) {
        teamAssignedPoints = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(point => userTeamIds.includes(point.assignedTeamId))
      }

      // Combine both types and remove duplicates
      const allFeederPoints = [...directlyAssignedPoints, ...teamAssignedPoints]
      const uniqueFeederPoints = allFeederPoints.filter((fp, index, self) =>
        index === self.findIndex(f => f.id === fp.id)
      )

      // Add assignment type information
      const enhancedFeederPoints = uniqueFeederPoints.map(point => {
        if (point.assignedUserId === userId) {
          return { ...point, assignmentType: 'individual' }
        } else {
          // Find the team name for team assignments
          const assignedTeam = teamsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .find(team => team.id === point.assignedTeamId)

          return {
            ...point,
            assignmentType: 'team',
            teamName: assignedTeam?.name || 'Unknown Team'
          }
        }
      })

      return enhancedFeederPoints
    } catch (error) {
      console.error('Error fetching user feeder points:', error)
      return []
    }
  }

  static async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    try {
      // Try to update in approvedUsers collection first (main collection)
      const approvedUserRef = doc(db, 'approvedUsers', userId)
      const approvedUserDoc = await getDoc(approvedUserRef)

      if (approvedUserDoc.exists()) {
        await updateDoc(approvedUserRef, {
          ...userData,
          updatedAt: new Date()
        })
        console.log('User updated in approvedUsers collection')
        return
      }

      // If not found in approvedUsers, try users collection
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        await updateDoc(userRef, {
          ...userData,
          updatedAt: new Date()
        })
        console.log('User updated in users collection')
        return
      }

      throw new Error('User not found in any collection')
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      // Try to delete from approvedUsers collection first
      const approvedUserRef = doc(db, 'approvedUsers', userId)
      const approvedUserDoc = await getDoc(approvedUserRef)

      if (approvedUserDoc.exists()) {
        await deleteDoc(approvedUserRef)
        console.log('User deleted from approvedUsers collection')
        return
      }

      // If not found in approvedUsers, try users collection
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        await deleteDoc(userRef)
        console.log('User deleted from users collection')
        return
      }

      throw new Error('User not found in any collection')
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  static async getAllFeederPoints(): Promise<any[]> {
    try {
      console.log('🔍 Attempting to fetch feeder points from collection: feederPoints')
      const snapshot = await getDocs(collection(db, 'feederPoints'))
      console.log(`📊 Raw snapshot size: ${snapshot.size} documents`)

      const feederPoints = snapshot.docs.map(doc => {
        const data = doc.data()
        console.log(`📄 Document ${doc.id}:`, data)
        return {
          id: doc.id,
          ...data,
          // Ensure location structure is consistent
          location: data.location || {
            latitude: null,
            longitude: null,
            address: 'No address provided'
          }
        }
      })

      console.log(`✅ Successfully processed ${feederPoints.length} feeder points`)
      console.log('📋 Sample feeder point:', feederPoints[0])
      return feederPoints
    } catch (error) {
      console.error('❌ Error fetching feeder points:', error)
      console.error('❌ Error details:', error.message)
      return []
    }
  }

  static async getTeams(): Promise<any[]> {
    try {
      const snapshot = await getDocs(collection(db, 'teams'))
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error fetching teams:', error)
      return []
    }
  }

  static async testDatabaseConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing database connection...')

      // Test basic connection by trying to read from a collection
      const testSnapshot = await getDocs(collection(db, 'users'))
      console.log(`✅ Database connection successful! Found ${testSnapshot.size} users`)

      // List all collections we're trying to access
      const collections = ['feederPoints', 'teams', 'users', 'approvedUsers', 'complaints']
      for (const collectionName of collections) {
        try {
          const snapshot = await getDocs(collection(db, collectionName))
          console.log(`📊 Collection '${collectionName}': ${snapshot.size} documents`)
        } catch (error) {
          console.log(`❌ Collection '${collectionName}': Error - ${error.message}`)
        }
      }

      return true
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      return false
    }
  }

  static async createSampleFeederPoints(): Promise<void> {
    try {
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
          createdAt: new Date(),
          updatedAt: new Date()
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
          createdAt: new Date(),
          updatedAt: new Date()
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
          createdAt: new Date(),
          updatedAt: new Date()
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
          createdAt: new Date(),
          updatedAt: new Date()
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
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      console.log('🌱 Creating sample feeder points...')

      for (const feederPoint of sampleFeederPoints) {
        const docRef = doc(collection(db, 'feederPoints'))
        await setDoc(docRef, feederPoint)
        console.log(`✅ Created feeder point: ${feederPoint.name}`)
      }

      console.log(`🎉 Successfully created ${sampleFeederPoints.length} sample feeder points!`)
    } catch (error) {
      console.error('❌ Error creating sample feeder points:', error)
      throw error
    }
  }
}
