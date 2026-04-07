export type WorkspaceRole = "owner" | "admin" | "member";
export type SessionMode = "live" | "async";
export type SessionStatus = "draft" | "active" | "closed";
export type VoteScale = "fibonacci" | "tshirt" | "custom";
export type ParticipantRole = "facilitator" | "participant" | "viewer";
export type RoundStatus = "collecting" | "revealed" | "finalized";
export type SyncStatus = "pending" | "synced" | "failed";

export type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  workspaceId: string;
  createdAt: string;
};

export type WorkspaceRecord = {
  id: string;
  name: string;
  createdAt: string;
};

export type MembershipRecord = {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
};

export type AuthSessionRecord = {
  token: string;
  userId: string;
  expiresAt: string;
};

export type InviteRecord = {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  invitedById: string;
  token: string;
  createdAt: string;
};

export type JiraConnectionRecord = {
  workspaceId: string;
  baseUrl: string;
  projectKeys: string[];
  storyPointsField: string;
  teamField?: string;
  connectedAt: string;
};

export type AuditEventRecord = {
  id: string;
  workspaceId: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId?: string;
  detail?: string;
  createdAt: string;
};

export type SessionParticipantRecord = {
  id: string;
  sessionId: string;
  userId: string;
  role: ParticipantRole;
  joinedAt?: string;
};

export type PlanningSessionRecord = {
  id: string;
  workspaceId: string;
  title: string;
  status: SessionStatus;
  mode: SessionMode;
  scale: VoteScale;
  customValues: string[];
  facilitatorId: string;
  createdById: string;
  jiraProjectKey?: string;
  activeIssueId?: string;
  createdAt: string;
  updatedAt: string;
};

export type PlanningIssueRecord = {
  id: string;
  sessionId: string;
  title: string;
  summary: string;
  order: number;
  jiraIssueKey?: string;
  jiraIssueUrl?: string;
  issueType: string;
  priority: string;
  labels: string[];
  importedAt: string;
  finalEstimate?: string;
  syncStatus: SyncStatus;
  syncedAt?: string;
  referenceStory?: string;
};

export type PlanningRoundRecord = {
  id: string;
  issueId: string;
  index: number;
  status: RoundStatus;
  revealedAt?: string;
  finalizedAt?: string;
};

export type PlanningVoteRecord = {
  id: string;
  roundId: string;
  issueId: string;
  userId: string;
  value: string;
  createdAt: string;
};

export type AppStore = {
  workspaces: WorkspaceRecord[];
  users: UserRecord[];
  memberships: MembershipRecord[];
  authSessions: AuthSessionRecord[];
  invites: InviteRecord[];
  jiraConnections: JiraConnectionRecord[];
  auditEvents: AuditEventRecord[];
  planningSessions: PlanningSessionRecord[];
  sessionParticipants: SessionParticipantRecord[];
  planningIssues: PlanningIssueRecord[];
  planningRounds: PlanningRoundRecord[];
  planningVotes: PlanningVoteRecord[];
};

export type SessionParticipantView = {
  userId: string;
  displayName: string;
  email: string;
  role: ParticipantRole;
  joinedAt?: string;
};

export type PlanningVoteView = {
  id: string;
  userId: string;
  displayName: string;
  value: string;
  createdAt: string;
};

export type PlanningRoundView = {
  id: string;
  index: number;
  status: RoundStatus;
  revealedAt?: string;
  finalizedAt?: string;
  votes: PlanningVoteView[];
};

export type PlanningIssueView = {
  id: string;
  title: string;
  summary: string;
  order: number;
  jiraIssueKey?: string;
  jiraIssueUrl?: string;
  issueType: string;
  priority: string;
  labels: string[];
  importedAt: string;
  finalEstimate?: string;
  syncStatus: SyncStatus;
  syncedAt?: string;
  referenceStory?: string;
  rounds: PlanningRoundView[];
  currentRoundId: string;
  voteCount: number;
};

export type PlanningSessionView = {
  id: string;
  title: string;
  status: SessionStatus;
  mode: SessionMode;
  scale: VoteScale;
  customValues: string[];
  facilitatorId: string;
  facilitatorName: string;
  createdAt: string;
  updatedAt: string;
  jiraProjectKey?: string;
  activeIssueId?: string;
  participantCount: number;
  participants: SessionParticipantView[];
  issues: PlanningIssueView[];
  summary: {
    completedIssues: number;
    syncedIssues: number;
    totalVotes: number;
  };
};

export type WorkspaceDashboardView = {
  workspace: WorkspaceRecord;
  me: UserRecord;
  membership: MembershipRecord;
  jiraConnection?: JiraConnectionRecord;
  members: Array<{
    id: string;
    displayName: string;
    email: string;
    role: WorkspaceRole;
  }>;
  sessions: PlanningSessionView[];
  recentAuditEvents: AuditEventRecord[];
};
