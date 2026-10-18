export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  studentId?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export type ItemCategory =
  | 'Electronics'
  | 'Books and Stationery'
  | 'Bags'
  | 'ID Cards'
  | 'Clothing'
  | 'Keys'
  | 'Water Bottles'
  | 'Accessories'
  | 'Other';

export type ReportType = 'lost' | 'found';

export type ItemStatus =
  | 'Pending Review'
  | 'Active'
  | 'Matched'
  | 'Claim Pending'
  | 'Returned / Resolved'
  | 'Rejected'
  | 'Closed';

export type ContactPreference = 'email' | 'in_app' | 'phone';

export interface ItemReport {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  reportType: ReportType;
  itemName: string;
  normalizedName: string;
  category: ItemCategory;
  description: string;
  keywords?: string;
  location: string;
  eventDate: string;
  imageUrl?: string;
  distinguishingFeatures?: string;
  contactPreference: ContactPreference;
  contactPhone?: string;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
}

export type ClaimStatus =
  | 'Pending'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Completed';

export interface ClaimRequest {
  id: string;
  itemId: string;
  itemTitle: string;
  reportType: ReportType;
  ownerId: string;
  claimantId: string;
  claimantName: string;
  claimantEmail: string;
  explanation: string;
  identifyingDetails?: string;
  supportingInfo?: string;
  status: ClaimStatus;
  reviewedBy?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'match'
  | 'claim_created'
  | 'claim_approved'
  | 'claim_rejected'
  | 'status_change'
  | 'item_resolved'
  | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  itemId?: string;
  claimId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: 'item' | 'claim' | 'user' | 'system';
  targetId: string;
  details: string;
  createdAt: string;
}

export interface MatchResult {
  item: ItemReport;
  score: number;
  reasons: string[];
}
