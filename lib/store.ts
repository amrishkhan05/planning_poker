import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "./crypto";
import { FIBONACCI_SCALE, SESSION_TTL_HOURS, TSHIRT_SCALE } from "./constants";
import type {
  AppStore,
  AuditEventRecord,
  InviteRecord,
  JiraConnectionRecord,
  MembershipRecord,
  PlanningIssueRecord,
  PlanningIssueView,
  PlanningRoundRecord,
  PlanningRoundView,
  PlanningSessionRecord,
  PlanningSessionView,
  PlanningVoteRecord,
  SessionMode,
  SessionParticipantRecord,
  UserRecord,
  VoteScale,
  WorkspaceDashboardView,
  WorkspaceRecord,
  WorkspaceRole,
} from "./types";

const storePath = path.join(process.cwd(), ".data", "store.json");

let inFlightWrite: Promise<void> = Promise.resolve();

function now() {
  return new Date().toISOString();
}

function scaleDefaults(scale: VoteScale) {
  if (scale === "tshirt") return TSHIRT_SCALE;
  if (scale === "custom") return ["S", "M", "L", "XL"];
  return FIBONACCI_SCALE;
}

async function ensureStoreFile() {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    const seeded = createSeedStore();
    await fs.writeFile(storePath, JSON.stringify(seeded, null, 2), "utf8");
  }
}

async function readStore(): Promise<AppStore> {
  await ensureStoreFile();
  const raw = await fs.readFile(storePath, "utf8");
  return JSON.parse(raw) as AppStore;
}

async function writeStore(nextStore: AppStore) {
  inFlightWrite = inFlightWrite.then(() =>
    fs.writeFile(storePath, JSON.stringify(nextStore, null, 2), "utf8"),
  );
  await inFlightWrite;
}

function createSeedStore(): AppStore {
  const createdAt = now();
  const workspaceId = "ws-acme";
  const ownerId = "user-owner";
  const engineerId = "user-engineer";
  const productId = "user-product";
  const sessionId = "session-q2";
  const issueId = "issue-1";
  const roundId = "round-1";

  return {
    workspaces: [
      {
        id: workspaceId,
        name: "Acme Delivery",
        createdAt,
      },
    ],
    users: [
      {
        id: ownerId,
        email: "owner@acme.test",
        displayName: "Avery Owner",
        passwordHash: hashPassword("password123"),
        workspaceId,
        createdAt,
      },
      {
        id: productId,
        email: "mila@acme.test",
        displayName: "Mila Product",
        passwordHash: hashPassword("password123"),
        workspaceId,
        createdAt,
      },
      {
        id: engineerId,
        email: "noah@acme.test",
        displayName: "Noah Engineer",
        passwordHash: hashPassword("password123"),
        workspaceId,
        createdAt,
      },
    ],
    memberships: [
      { id: "mem-1", workspaceId, userId: ownerId, role: "owner" },
      { id: "mem-2", workspaceId, userId: productId, role: "admin" },
      { id: "mem-3", workspaceId, userId: engineerId, role: "member" },
    ],
    authSessions: [],
    invites: [],
    jiraConnections: [
      {
        workspaceId,
        baseUrl: "https://acme.atlassian.net",
        projectKeys: ["ACME", "PLN"],
        storyPointsField: "customfield_10016",
        teamField: "customfield_10020",
        connectedAt: createdAt,
      },
    ],
    auditEvents: [
      {
        id: "audit-1",
        workspaceId,
        actorUserId: ownerId,
        action: "session.created",
        targetType: "planning_session",
        targetId: sessionId,
        detail: "Seed planning room created for product delivery estimates.",
        createdAt,
      },
    ],
    planningSessions: [
      {
        id: sessionId,
        workspaceId,
        title: "Q2 Platform Hardening",
        status: "active",
        mode: "live",
        scale: "fibonacci",
        customValues: [],
        facilitatorId: ownerId,
        createdById: ownerId,
        jiraProjectKey: "ACME",
        activeIssueId: issueId,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    sessionParticipants: [
      { id: "sp-1", sessionId, userId: ownerId, role: "facilitator", joinedAt: createdAt },
      { id: "sp-2", sessionId, userId: productId, role: "participant", joinedAt: createdAt },
      { id: "sp-3", sessionId, userId: engineerId, role: "participant" },
    ],
    planningIssues: [
      {
        id: issueId,
        sessionId,
        title: "Strengthen Jira writeback approvals",
        summary: "Make estimate sync explicit for corporate teams with a visible approval step.",
        order: 0,
        jiraIssueKey: "ACME-214",
        jiraIssueUrl: "https://acme.atlassian.net/browse/ACME-214",
        issueType: "Story",
        priority: "High",
        labels: ["planning-poker", "jira"],
        importedAt: createdAt,
        syncStatus: "pending",
        referenceStory: "5",
      },
      {
        id: "issue-2",
        sessionId,
        title: "Async reminder cadence",
        summary: "Allow distributed participants to estimate before reveal with deadline nudges.",
        order: 1,
        jiraIssueKey: "ACME-219",
        jiraIssueUrl: "https://acme.atlassian.net/browse/ACME-219",
        issueType: "Story",
        priority: "Medium",
        labels: ["async", "enterprise"],
        importedAt: createdAt,
        syncStatus: "pending",
        referenceStory: "3",
      },
    ],
    planningRounds: [
      { id: roundId, issueId, index: 1, status: "collecting" },
      { id: "round-2", issueId: "issue-2", index: 1, status: "collecting" },
    ],
    planningVotes: [],
  };
}

function buildIssueViews(store: AppStore, session: PlanningSessionRecord): PlanningIssueView[] {
  const users = new Map(store.users.map((user) => [user.id, user]));
  return store.planningIssues
    .filter((issue) => issue.sessionId === session.id)
    .sort((left, right) => left.order - right.order)
    .map((issue) => {
      const rounds = store.planningRounds
        .filter((round) => round.issueId === issue.id)
        .sort((left, right) => left.index - right.index);
      const roundViews: PlanningRoundView[] = rounds.map((round) => ({
        id: round.id,
        index: round.index,
        status: round.status,
        revealedAt: round.revealedAt,
        finalizedAt: round.finalizedAt,
        votes: store.planningVotes
          .filter((vote) => vote.roundId === round.id)
          .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
          .map((vote) => ({
            id: vote.id,
            userId: vote.userId,
            displayName: users.get(vote.userId)?.displayName || "Unknown User",
            value: vote.value,
            createdAt: vote.createdAt,
          })),
      }));
      return {
        ...issue,
        rounds: roundViews,
        currentRoundId: roundViews[roundViews.length - 1]?.id || "",
        voteCount: roundViews[roundViews.length - 1]?.votes.length || 0,
      };
    });
}

function buildSessionView(store: AppStore, session: PlanningSessionRecord): PlanningSessionView {
  const users = new Map(store.users.map((user) => [user.id, user]));
  const issues = buildIssueViews(store, session);
  const participants = store.sessionParticipants
    .filter((participant) => participant.sessionId === session.id)
    .map((participant) => {
      const user = users.get(participant.userId);
      return {
        userId: participant.userId,
        displayName: user?.displayName || "Unknown User",
        email: user?.email || "unknown@example.com",
        role: participant.role,
        joinedAt: participant.joinedAt,
      };
    });
  return {
    id: session.id,
    title: session.title,
    status: session.status,
    mode: session.mode,
    scale: session.scale,
    customValues: session.customValues,
    facilitatorId: session.facilitatorId,
    facilitatorName: users.get(session.facilitatorId)?.displayName || "Unknown User",
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    jiraProjectKey: session.jiraProjectKey,
    activeIssueId: session.activeIssueId,
    participantCount: participants.length,
    participants,
    issues,
    summary: {
      completedIssues: issues.filter((issue) => issue.finalEstimate).length,
      syncedIssues: issues.filter((issue) => issue.syncStatus === "synced").length,
      totalVotes: issues.reduce(
        (sum, issue) => sum + issue.rounds.reduce((roundSum, round) => roundSum + round.votes.length, 0),
        0,
      ),
    },
  };
}

function appendAuditEvent(
  store: AppStore,
  input: Omit<AuditEventRecord, "id" | "createdAt">,
) {
  store.auditEvents.unshift({
    id: randomUUID(),
    createdAt: now(),
    ...input,
  });
}

function requireMembership(store: AppStore, userId: string) {
  const user = store.users.find((item) => item.id === userId);
  if (!user) {
    throw new Error("User not found");
  }
  const membership = store.memberships.find(
    (item) => item.userId === userId && item.workspaceId === user.workspaceId,
  );
  if (!membership) {
    throw new Error("Membership not found");
  }
  const workspace = store.workspaces.find((item) => item.id === user.workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }
  return { user, membership, workspace };
}

function allowedScaleValues(scale: VoteScale, customValues: string[]) {
  return scale === "custom" ? customValues : scaleDefaults(scale);
}

export async function loginUser(email: string, password: string) {
  const store = await readStore();
  const user = store.users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password");
  }
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString();
  const token = randomUUID();
  store.authSessions = store.authSessions.filter((session) => session.userId !== user.id);
  store.authSessions.push({ token, userId: user.id, expiresAt });
  await writeStore(store);
  return { token, user };
}

export async function registerWorkspace(input: {
  workspaceName: string;
  displayName: string;
  email: string;
  password: string;
}) {
  const store = await readStore();
  if (store.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("Email already exists");
  }
  const workspaceId = randomUUID();
  const userId = randomUUID();
  const createdAt = now();
  const workspace: WorkspaceRecord = {
    id: workspaceId,
    name: input.workspaceName,
    createdAt,
  };
  const user: UserRecord = {
    id: userId,
    email: input.email,
    displayName: input.displayName,
    passwordHash: hashPassword(input.password),
    workspaceId,
    createdAt,
  };
  const membership: MembershipRecord = {
    id: randomUUID(),
    workspaceId,
    userId,
    role: "owner",
  };
  const token = randomUUID();
  store.workspaces.push(workspace);
  store.users.push(user);
  store.memberships.push(membership);
  store.authSessions.push({
    token,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString(),
  });
  appendAuditEvent(store, {
    workspaceId,
    actorUserId: userId,
    action: "workspace.created",
    targetType: "workspace",
    targetId: workspaceId,
    detail: `Workspace ${input.workspaceName} created.`,
  });
  await writeStore(store);
  return { token, user };
}

export async function getUserByToken(token?: string | null) {
  if (!token) return null;
  const store = await readStore();
  const session = store.authSessions.find((item) => item.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    store.authSessions = store.authSessions.filter((item) => item.token !== token);
    await writeStore(store);
    return null;
  }
  return store.users.find((user) => user.id === session.userId) || null;
}

export async function clearAuthSession(token?: string | null) {
  if (!token) return;
  const store = await readStore();
  store.authSessions = store.authSessions.filter((item) => item.token !== token);
  await writeStore(store);
}

export async function getDashboard(userId: string): Promise<WorkspaceDashboardView> {
  const store = await readStore();
  const { user, membership, workspace } = requireMembership(store, userId);
  return {
    workspace,
    me: user,
    membership,
    jiraConnection: store.jiraConnections.find((item) => item.workspaceId === workspace.id),
    members: store.memberships
      .filter((item) => item.workspaceId === workspace.id)
      .map((member) => {
        const memberUser = store.users.find((userItem) => userItem.id === member.userId)!;
        return {
          id: memberUser.id,
          displayName: memberUser.displayName,
          email: memberUser.email,
          role: member.role,
        };
      }),
    sessions: store.planningSessions
      .filter((session) => session.workspaceId === workspace.id)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((session) => buildSessionView(store, session)),
    recentAuditEvents: store.auditEvents
      .filter((event) => event.workspaceId === workspace.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 10),
  };
}

export async function listSessions(userId: string) {
  const dashboard = await getDashboard(userId);
  return dashboard.sessions;
}

export async function getSession(sessionId: string, userId: string) {
  const store = await readStore();
  const { workspace } = requireMembership(store, userId);
  const session = store.planningSessions.find(
    (item) => item.id === sessionId && item.workspaceId === workspace.id,
  );
  if (!session) {
    throw new Error("Session not found");
  }
  return buildSessionView(store, session);
}

export async function createSession(input: {
  userId: string;
  title: string;
  mode: SessionMode;
  scale: VoteScale;
  customValues?: string[];
  participantIds: string[];
}) {
  const store = await readStore();
  const { workspace, user } = requireMembership(store, input.userId);
  const participantIds = Array.from(new Set([input.userId, ...input.participantIds]));
  const createdAt = now();
  const sessionId = randomUUID();
  const session: PlanningSessionRecord = {
    id: sessionId,
    workspaceId: workspace.id,
    title: input.title,
    status: "draft",
    mode: input.mode,
    scale: input.scale,
    customValues: input.scale === "custom" ? input.customValues || scaleDefaults("custom") : [],
    facilitatorId: input.userId,
    createdById: input.userId,
    createdAt,
    updatedAt: createdAt,
  };
  store.planningSessions.unshift(session);
  store.sessionParticipants.push(
    ...participantIds.map(
      (participantId): SessionParticipantRecord => ({
        id: randomUUID(),
        sessionId,
        userId: participantId,
        role: participantId === input.userId ? "facilitator" : "participant",
      }),
    ),
  );
  appendAuditEvent(store, {
    workspaceId: workspace.id,
    actorUserId: user.id,
    action: "session.created",
    targetType: "planning_session",
    targetId: sessionId,
    detail: `Created ${input.mode} session ${input.title}.`,
  });
  await writeStore(store);
  return buildSessionView(store, session);
}

export async function updateSession(
  sessionId: string,
  userId: string,
  patch: Partial<Pick<PlanningSessionRecord, "title" | "status" | "activeIssueId">>,
) {
  const store = await readStore();
  const { workspace } = requireMembership(store, userId);
  const session = store.planningSessions.find(
    (item) => item.id === sessionId && item.workspaceId === workspace.id,
  );
  if (!session) throw new Error("Session not found");
  if (session.facilitatorId !== userId) throw new Error("Only the facilitator can update this session");
  if (patch.title !== undefined) session.title = patch.title;
  if (patch.status !== undefined) session.status = patch.status;
  if (patch.activeIssueId !== undefined) session.activeIssueId = patch.activeIssueId;
  session.updatedAt = now();
  appendAuditEvent(store, {
    workspaceId: workspace.id,
    actorUserId: userId,
    action: "session.updated",
    targetType: "planning_session",
    targetId: sessionId,
    detail: "Session details were updated.",
  });
  await writeStore(store);
  return buildSessionView(store, session);
}

export async function importJiraIssues(
  sessionId: string,
  userId: string,
  input: {
    projectKey: string;
    count?: number;
  },
) {
  const store = await readStore();
  const { workspace } = requireMembership(store, userId);
  const jiraConnection = store.jiraConnections.find((item) => item.workspaceId === workspace.id);
  const session = store.planningSessions.find((item) => item.id === sessionId);
  if (!session || session.workspaceId !== workspace.id) throw new Error("Session not found");
  if (session.facilitatorId !== userId) throw new Error("Only the facilitator can import issues");

  const issueCount = Math.max(1, Math.min(input.count || 5, 8));
  const currentCount = store.planningIssues.filter((issue) => issue.sessionId === sessionId).length;
  for (let index = 0; index < issueCount; index += 1) {
    const issueId = randomUUID();
    const order = currentCount + index;
    const jiraIssueKey = `${input.projectKey.toUpperCase()}-${210 + order}`;
    store.planningIssues.push({
      id: issueId,
      sessionId,
      title: [
        "Approval-aware Jira sync",
        "Async estimation reminders",
        "Custom corporate vote decks",
        "Audit export for PMO review",
        "Reference story suggestions",
      ][order % 5],
      summary: "Imported from Jira for estimation and retained as a stable planning snapshot.",
      order,
      jiraIssueKey,
      jiraIssueUrl:
        jiraConnection?.baseUrl ? `${jiraConnection.baseUrl}/browse/${jiraIssueKey}` : undefined,
      issueType: ["Story", "Spike", "Bug"][order % 3],
      priority: ["High", "Medium", "Low"][order % 3],
      labels: ["jira", "planning-poker"],
      importedAt: now(),
      syncStatus: "pending",
      referenceStory: ["3", "5", "8"][order % 3],
    });
    const roundId = randomUUID();
    store.planningRounds.push({
      id: roundId,
      issueId,
      index: 1,
      status: "collecting",
    });
    if (!session.activeIssueId) {
      session.activeIssueId = issueId;
    }
  }
  session.status = "active";
  session.jiraProjectKey = input.projectKey.toUpperCase();
  session.updatedAt = now();
  appendAuditEvent(store, {
    workspaceId: workspace.id,
    actorUserId: userId,
    action: "jira.imported",
    targetType: "planning_session",
    targetId: sessionId,
    detail: `Imported ${issueCount} issues from ${input.projectKey.toUpperCase()}.`,
  });
  await writeStore(store);
  return buildSessionView(store, session);
}

export async function submitVote(
  sessionId: string,
  issueId: string,
  userId: string,
  value: string,
) {
  const store = await readStore();
  const { workspace } = requireMembership(store, userId);
  const session = store.planningSessions.find((item) => item.id === sessionId);
  if (!session || session.workspaceId !== workspace.id) throw new Error("Session not found");
  const participant = store.sessionParticipants.find(
    (item) => item.sessionId === sessionId && item.userId === userId,
  );
  if (!participant || participant.role === "viewer") {
    throw new Error("You are not allowed to vote in this room");
  }

  const issue = store.planningIssues.find((item) => item.id === issueId && item.sessionId === sessionId);
  if (!issue) throw new Error("Issue not found");
  const round = store.planningRounds
    .filter((item) => item.issueId === issueId)
    .sort((left, right) => right.index - left.index)[0];
  if (!round || round.status !== "collecting") {
    throw new Error("Voting is closed for this issue");
  }
  const allowed = allowedScaleValues(session.scale, session.customValues);
  if (!allowed.includes(value)) {
    throw new Error("Vote is not allowed for this scale");
  }
  store.planningVotes = store.planningVotes.filter(
    (vote) => !(vote.roundId === round.id && vote.userId === userId),
  );
  store.planningVotes.push({
    id: randomUUID(),
    roundId: round.id,
    issueId,
    userId,
    value,
    createdAt: now(),
  });
  participant.joinedAt = participant.joinedAt || now();
  session.updatedAt = now();
  appendAuditEvent(store, {
    workspaceId: workspace.id,
    actorUserId: userId,
    action: "vote.submitted",
    targetType: "planning_issue",
    targetId: issueId,
    detail: "A participant submitted an estimate.",
  });
  await writeStore(store);
  return buildSessionView(store, session);
}

export async function revealVotes(sessionId: string, issueId: string, userId: string) {
  const store = await readStore();
  const { workspace } = requireMembership(store, userId);
  const session = store.planningSessions.find((item) => item.id === sessionId);
  if (!session || session.workspaceId !== workspace.id) throw new Error("Session not found");
  if (session.facilitatorId !== userId) throw new Error("Only the facilitator can reveal votes");
  const round = store.planningRounds
    .filter((item) => item.issueId === issueId)
    .sort((left, right) => right.index - left.index)[0];
  if (!round) throw new Error("Round not found");
  round.status = "revealed";
  round.revealedAt = now();
  session.updatedAt = now();
  appendAuditEvent(store, {
    workspaceId: workspace.id,
    actorUserId: userId,
    action: "votes.revealed",
    targetType: "planning_issue",
    targetId: issueId,
    detail: "Facilitator revealed the current round.",
  });
  await writeStore(store);
  return buildSessionView(store, session);
}

export async function finalizeIssue(
  sessionId: string,
  issueId: string,
  userId: string,
  finalEstimate: string,
) {
  const store = await readStore();
  const { workspace } = requireMembership(store, userId);
  const session = store.planningSessions.find((item) => item.id === sessionId);
  if (!session || session.workspaceId !== workspace.id) throw new Error("Session not found");
  if (session.facilitatorId !== userId) throw new Error("Only the facilitator can finalize");
  const issue = store.planningIssues.find((item) => item.id === issueId);
  if (!issue) throw new Error("Issue not found");
  const round = store.planningRounds
    .filter((item) => item.issueId === issueId)
    .sort((left, right) => right.index - left.index)[0];
  if (!round) throw new Error("Round not found");
  round.status = "finalized";
  round.finalizedAt = now();
  issue.finalEstimate = finalEstimate;
  issue.syncStatus = store.jiraConnections.some((item) => item.workspaceId === workspace.id)
    ? "synced"
    : "failed";
  issue.syncedAt = issue.syncStatus === "synced" ? now() : undefined;
  const nextIssue = store.planningIssues
    .filter((item) => item.sessionId === sessionId && !item.finalEstimate)
    .sort((left, right) => left.order - right.order)[0];
  session.activeIssueId = nextIssue?.id;
  session.updatedAt = now();
  appendAuditEvent(store, {
    workspaceId: workspace.id,
    actorUserId: userId,
    action: "issue.finalized",
    targetType: "planning_issue",
    targetId: issueId,
    detail: `Final estimate ${finalEstimate} saved with ${issue.syncStatus} Jira sync.`,
  });
  await writeStore(store);
  return buildSessionView(store, session);
}

export async function closeSession(sessionId: string, userId: string) {
  const store = await readStore();
  const { workspace } = requireMembership(store, userId);
  const session = store.planningSessions.find((item) => item.id === sessionId);
  if (!session || session.workspaceId !== workspace.id) throw new Error("Session not found");
  if (session.facilitatorId !== userId) throw new Error("Only the facilitator can close");
  session.status = "closed";
  session.updatedAt = now();
  appendAuditEvent(store, {
    workspaceId: workspace.id,
    actorUserId: userId,
    action: "session.closed",
    targetType: "planning_session",
    targetId: sessionId,
    detail: "The planning session was closed.",
  });
  await writeStore(store);
  return buildSessionView(store, session);
}

export async function connectJira(
  userId: string,
  input: {
    baseUrl: string;
    projectKeys: string[];
    storyPointsField: string;
    teamField?: string;
  },
) {
  const store = await readStore();
  const { workspace, membership } = requireMembership(store, userId);
  if (membership.role === "member") {
    throw new Error("Only workspace owners or admins can update Jira settings");
  }
  const connection: JiraConnectionRecord = {
    workspaceId: workspace.id,
    baseUrl: input.baseUrl.replace(/\/$/, ""),
    projectKeys: input.projectKeys,
    storyPointsField: input.storyPointsField,
    teamField: input.teamField,
    connectedAt: now(),
  };
  store.jiraConnections = [
    ...store.jiraConnections.filter((item) => item.workspaceId !== workspace.id),
    connection,
  ];
  appendAuditEvent(store, {
    workspaceId: workspace.id,
    actorUserId: userId,
    action: "jira.connected",
    targetType: "integration",
    detail: `Connected Jira for ${input.projectKeys.join(", ")}.`,
  });
  await writeStore(store);
  return connection;
}

export async function inviteMember(
  userId: string,
  input: { email: string; role: WorkspaceRole },
) {
  const store = await readStore();
  const { workspace, membership } = requireMembership(store, userId);
  if (membership.role === "member") {
    throw new Error("Only owners and admins can invite teammates");
  }
  const invite: InviteRecord = {
    id: randomUUID(),
    workspaceId: workspace.id,
    email: input.email,
    role: input.role,
    invitedById: userId,
    token: randomUUID(),
    createdAt: now(),
  };
  store.invites.unshift(invite);
  appendAuditEvent(store, {
    workspaceId: workspace.id,
    actorUserId: userId,
    action: "member.invited",
    targetType: "invite",
    targetId: invite.id,
    detail: `Invited ${input.email} as ${input.role}.`,
  });
  await writeStore(store);
  return invite;
}

export async function getSessionHistory(sessionId: string, userId: string) {
  const session = await getSession(sessionId, userId);
  const store = await readStore();
  return {
    session,
    auditEvents: store.auditEvents
      .filter((event) => event.targetId === sessionId || event.targetType === "planning_issue")
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 30),
  };
}

export async function syncIssueEstimate(sessionId: string, issueId: string, userId: string) {
  const store = await readStore();
  const { workspace } = requireMembership(store, userId);
  const session = store.planningSessions.find((item) => item.id === sessionId);
  if (!session || session.workspaceId !== workspace.id) throw new Error("Session not found");
  const issue = store.planningIssues.find((item) => item.id === issueId && item.sessionId === sessionId);
  if (!issue) throw new Error("Issue not found");
  const jiraConnection = store.jiraConnections.find((item) => item.workspaceId === workspace.id);
  if (!jiraConnection) throw new Error("Jira is not connected");
  issue.syncStatus = "synced";
  issue.syncedAt = now();
  session.updatedAt = now();
  appendAuditEvent(store, {
    workspaceId: workspace.id,
    actorUserId: userId,
    action: "jira.synced",
    targetType: "planning_issue",
    targetId: issueId,
    detail: `Synced ${issue.jiraIssueKey || issue.title} to Jira.`,
  });
  await writeStore(store);
  return { issue, jiraConnection };
}
