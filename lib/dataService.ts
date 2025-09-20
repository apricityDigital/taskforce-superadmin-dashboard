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
  static onFeederPointsChange(callback: (points: any[]) => void) {
    const q = query(collection(db, 'feederPoints'));
    return onSnapshot(q, (snapshot) => {
      const points = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(points);
    });
  }

  static async getAllFeederPoints(): Promise<any[]> {
    const q = query(collection(db, 'feederPoints'));
    const snapshot = await getDocs(q);
    const points = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return points;
  }

  // Get all teams
  static onTeamsChange(callback: (teams: any[]) => void) {
    const q = query(collection(db, 'teams'));
    return onSnapshot(q, (snapshot) => {
      const teams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(teams);
    });
  }

  // Other functions omitted for brevity...
}