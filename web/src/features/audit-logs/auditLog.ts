import { prisma as _prisma } from "@langfuse/shared";
import { type MembershipRole } from "@langfuse/shared";

export type AuditableResource =
  | "membership"
  | "membershipInvitation"
  | "datasetItem"
  | "dataset"
  | "trace"
  | "project"
  | "observation"
  | "score"
  | "model"
  | "prompt"
  | "session"
  | "apiKey";

type AuditLog = {
  resourceType: AuditableResource;
  resourceId: string;
  action: string;
  before?: unknown;
  after?: unknown;
} & (
  | {
      projectId: string;
      userId: string;
      userProjectRole: MembershipRole;
    }
  | {
      session: {
        user: {
          id: string;
        };
        projectRole: MembershipRole;
        projectId: string;
      };
    }
);

export async function auditLog(log: AuditLog, prisma?: typeof _prisma) {
  await (prisma ?? _prisma).auditLog.create({
    data: {
      projectId: "projectId" in log ? log.projectId : log.session.projectId,
      userId: "userId" in log ? log.userId : log.session.user.id,
      userProjectRole:
        "userProjectRole" in log
          ? log.userProjectRole
          : log.session.projectRole,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      action: log.action,
      before: log.before ? JSON.stringify(log.before) : undefined,
      after: log.after ? JSON.stringify(log.after) : undefined,
    },
  });
}
