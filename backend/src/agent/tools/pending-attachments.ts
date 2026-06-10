export interface PendingKnowledgeAttachment {
  name: string;
  size?: number;
  path: string;
}

const pendingKnowledgeAttachments = new Map<
  string,
  PendingKnowledgeAttachment[]
>();

export function setPendingKnowledgeAttachments(
  userId: string,
  attachments: PendingKnowledgeAttachment[],
): void {
  pendingKnowledgeAttachments.set(userId, attachments);
}

export function getPendingKnowledgeAttachments(
  userId: string,
): PendingKnowledgeAttachment[] {
  return pendingKnowledgeAttachments.get(userId) ?? [];
}

export function clearPendingKnowledgeAttachments(userId: string): void {
  pendingKnowledgeAttachments.delete(userId);
}
