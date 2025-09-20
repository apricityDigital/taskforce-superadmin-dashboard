import { Report } from './dataService';

export const mockReports: Report[] = [
  {
    id: '1',
    teamId: 'team-1',
    teamName: 'Team Alpha',
    feederPointId: 'fp-1',
    feederPointName: 'Feeder Point 1',
    title: 'Waste overflow at Feeder Point 1',
    description: 'The waste at Feeder Point 1 is overflowing and needs to be collected immediately.',
    status: 'pending',
    priority: 'high',
    submittedDate: new Date().toISOString(),
    submittedBy: 'John Doe',
    attachments: [
      {
        id: 'att-1',
        type: 'photo',
        url: 'https://via.placeholder.com/150',
        filename: 'report-1.jpg',
        uploadedDate: new Date().toISOString(),
      },
    ],
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'Bangalore, India',
    },
    type: 'complaint',
  },
  {
    id: '2',
    teamId: 'team-2',
    teamName: 'Team Bravo',
    feederPointId: 'fp-2',
    feederPointName: 'Feeder Point 2',
    title: 'Scheduled maintenance at Feeder Point 2',
    description: 'Scheduled maintenance at Feeder Point 2 has been completed successfully.',
    status: 'approved',
    priority: 'medium',
    submittedDate: new Date().toISOString(),
    submittedBy: 'Jane Smith',
    attachments: [],
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'Bangalore, India',
    },
    type: 'maintenance',
  },
];
