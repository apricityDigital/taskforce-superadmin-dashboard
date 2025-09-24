import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, limit, where, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
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

export interface ComplianceReport {
  id: string;
  feederPointId: string;
  feederPointName: string;
  userId: string;
  userName: string;
  teamId: string;
  teamName: string;
  submittedAt: any; // Firestore timestamp
  submittedLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  distanceFromFeederPoint: number; // in meters
  status: 'pending' | 'approved' | 'rejected' | 'requires_action';
  answers: ComplianceAnswer[];
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: any;
  createdAt: any;
  updatedAt: any;
  tripNumber: 1 | 2 | 3; // Which trip of the day (1st, 2nd, or 3rd)
  tripDate: string; // Date in YYYY-MM-DD format for daily tracking
  dailyTripId: string; // Unique identifier for the day's trips (userId_feederPointId_date)
  aiAnalysis?: string;
  ministryReport?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  description?: string;
  title?: string;
  submittedBy?: string;
  attachments?: ComplianceReportAttachment[];
}

export interface ComplianceAnswer {
  questionId: string;
  answer: 'yes' | 'no' | string;
  photos?: string[]; // Array of photo URLs
  notes?: string;
}

export interface ComplianceReportAttachment {
    id: string;
    type: 'photo' | 'video' | 'audio' | 'document';
    url: string;
    filename: string;
    uploadedDate: string;
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

export interface Team {
  id: string;
  name: string;
  members: User[];
}

export interface FeederPoint {
  id: string;
  name: string;
  assignedUserId?: string;
  assignedTeamId?: string;
  status: 'active' | 'maintenance' | 'inactive';
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  priority: 'high' | 'medium' | 'low';
  lastInspection?: any; // Firestore timestamp
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
        getDocs(collection(db, 'complianceReports')),
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
  static onUsersChange(callback: (users: User[]) => void) {
    const q = query(collection(db, 'approvedUsers'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      callback(users);
    });
  }

  static async getAllUsers(): Promise<User[]> {
    const q = query(collection(db, 'approvedUsers'));
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
    return users;
  }

  // Get all access requests
  static onAccessRequestsChange(callback: (requests: AccessRequest[]) => void) {
    const q = query(collection(db, 'accessRequests'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AccessRequest));
      callback(requests);
    });
  }

  // Get all complaints
  static onComplaintsChange(callback: (complaints: Complaint[]) => void) {
    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const complaints = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Complaint));
      callback(complaints);
    });
  }

  static async getAllComplaints(): Promise<Complaint[]> {
    const q = query(collection(db, 'complaints'));
    const snapshot = await getDocs(q);
    const complaints = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Complaint));
    return complaints;
  }

  // Get all compliance reports
  static async getAllComplianceReports(): Promise<ComplianceReport[]> {
    const q = query(collection(db, 'complianceReports'), orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ComplianceReport));
    return reports;
  }

  static onComplianceReportsChange(callback: (reports: ComplianceReport[]) => void) {
    const q = query(collection(db, 'complianceReports'), orderBy('submittedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ComplianceReport));
      callback(reports);
    });
  }

  // Update compliance report status
  static async updateComplianceReportStatus(
    reportId: string, 
    status: ComplianceReport['status'], 
    adminNotes?: string,
    reviewedBy?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (adminNotes) {
        updateData.adminNotes = adminNotes;
      }
      if (reviewedBy) {
        updateData.reviewedBy = reviewedBy;
      }

      await updateDoc(doc(db, 'complianceReports', reportId), updateData);

      console.log('✅ Compliance report status updated:', reportId, status);
    } catch (error) {
      console.error('❌ Error updating compliance report status:', error);
      throw error;
    }
  }

  // Get all IP records
  static onIPRecordsChange(callback: (records: IPRecord[]) => void) {
    const q = query(collection(db, 'ipRecords'), orderBy('registeredAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as IPRecord));
      callback(records);
    });
  }

  // Get all feeder points
  static onFeederPointsChange(callback: (points: FeederPoint[]) => void) {
    const q = query(collection(db, 'feederPoints'));
    return onSnapshot(q, (snapshot) => {
      const points = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FeederPoint));
      callback(points);
    });
  }

  static async getAllFeederPoints(): Promise<FeederPoint[]> {
    const q = query(collection(db, 'feederPoints'));
    const snapshot = await getDocs(q);
    const points = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FeederPoint));
    return points;
  }

  // Get all teams
  static onTeamsChange(callback: (teams: Team[]) => void) {
    const q = query(collection(db, 'teams'));
    return onSnapshot(q, (snapshot) => {
      const teams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Team));
      callback(teams);
    });
  }

  static async updateFeederPoint(id: string, data: Partial<FeederPoint>): Promise<void> {
    const feederPointRef = doc(db, 'feederPoints', id);
    await updateDoc(feederPointRef, data);
  }

  static async createFeederPoint(data: Partial<FeederPoint>): Promise<void> {
    const feederPointsCollection = collection(db, 'feederPoints');
    await setDoc(doc(feederPointsCollection), data, { merge: true });
  }

  static async deleteFeederPoint(id: string): Promise<void> {
    const feederPointRef = doc(db, 'feederPoints', id);
    await deleteDoc(feederPointRef);
  }

  static async createSampleFeederPoints(): Promise<void> {
    const samplePoints = [
      { name: 'FP-001', status: 'active', priority: 'high', location: { address: '123 Main St', latitude: 34.0522, longitude: -118.2437 } },
      { name: 'FP-002', status: 'maintenance', priority: 'medium', location: { address: '456 Oak Ave', latitude: 34.0522, longitude: -118.2437 } },
      { name: 'FP-003', status: 'inactive', priority: 'low', location: { address: '789 Pine Ln', latitude: 34.0522, longitude: -118.2437 } },
    ];

    const feederPointsCollection = collection(db, 'feederPoints');
    for (const point of samplePoints) {
      await setDoc(doc(feederPointsCollection), point);
    }
  }

  static async getRecentActivity(): Promise<any[]> {
    try {
      const q = query(collection(db, 'recentActivity'), orderBy('timestamp', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      const activity = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return activity;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  static async approveAccessRequest(request: AccessRequest): Promise<void> {
    try {
      const requestRef = doc(db, 'accessRequests', request.id);
      await updateDoc(requestRef, {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: 'AdminUserPlaceholder', // Replace with actual admin user ID/name
        updatedAt: serverTimestamp()
      });
      console.log('✅ Access request approved:', request.id);
    } catch (error) {
      console.error('❌ Error approving access request:', error);
      throw error;
    }
  }

  static async rejectAccessRequest(requestId: string): Promise<void> {
    try {
      const requestRef = doc(db, 'accessRequests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        reviewedAt: serverTimestamp(),
        reviewedBy: 'AdminUserPlaceholder', // Replace with actual admin user ID/name
        updatedAt: serverTimestamp()
      });
      console.log('✅ Access request rejected:', requestId);
    } catch (error) {
      console.error('❌ Error rejecting access request:', error);
      throw error;
    }
  }

  static async updateComplaint(complaintId: string, complaint: Complaint): Promise<void> {
    try {
      const complaintRef = doc(db, 'complaints', complaintId);
      await updateDoc(complaintRef, {
        ...complaint,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Complaint updated:', complaintId);
    } catch (error) {
      console.error('❌ Error updating complaint:', error);
      throw error;
    }
  }

  static async deleteComplaint(complaintId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'complaints', complaintId));
      console.log('✅ Complaint deleted:', complaintId);
    } catch (error) {
      console.error('❌ Error deleting complaint:', error);
      throw error;
    }
  }

  static async testDatabaseConnection(): Promise<boolean> {
    try {
      console.log("Attempting to fetch collections from Firestore...");
      const collections = await Promise.all([
        getDocs(collection(db, 'approvedUsers')),
        getDocs(collection(db, 'accessRequests')),
        getDocs(collection(db, 'complianceReports')),
        getDocs(collection(db, 'feederPoints')),
        getDocs(collection(db, 'teams')),
      ]);
      console.log('Successfully fetched collections:');
      console.log(`- approvedUsers: ${collections[0].size} documents`);
      console.log(`- accessRequests: ${collections[1].size} documents`);
      console.log(`- complianceReports: ${collections[2].size} documents`);
      console.log(`- feederPoints: ${collections[3].size} documents`);
      console.log(`- teams: ${collections[4].size} documents`);
      return true;
    } catch (error) {
      console.error("Error testing database connection:", error);
      return false;
    }
  }

  static async getUserReports(userId: string): Promise<ComplianceReport[]> {
    const q = query(collection(db, 'complianceReports'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ComplianceReport));
  }

  static async getUserFeederPoints(userId: string): Promise<FeederPoint[]> {
    const q = query(collection(db, 'feederPoints'), where('assignedUserId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeederPoint));
  }

  static async updateUser(id: string, data: Partial<User>): Promise<void> {
    const userRef = doc(db, 'approvedUsers', id);
    await updateDoc(userRef, data);
  }

  static async deleteUser(id: string): Promise<void> {
    const userRef = doc(db, 'approvedUsers', id);
    await deleteDoc(userRef);
  }
}