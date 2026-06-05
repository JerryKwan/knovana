import type { SdkMcpToolDefinition } from "@anthropic-ai/claude-agent-sdk";
import { createSaveToKbTool } from "./kb-save";
import { createReadKbTool } from "./kb-read";
import { createUpdateKbTool } from "./kb-update";
import { createSearchKbTool } from "./kb-search";
import { createListKbTool } from "./kb-list";
import { createDeleteKbTool } from "./kb-delete";
import { createTagManagerTool } from "./tag-manager";
import { createAttachmentManagerTool } from "./attachment-manager";

export interface ToolContext {
  userId: string;
  kbRoot: string; // The root directory of the user's specific knowledge base, e.g. knowledge-base/usr_123
}

export function createTools(ctx: ToolContext): SdkMcpToolDefinition<any>[] {
  return [
    createSaveToKbTool(ctx),
    createReadKbTool(ctx),
    createUpdateKbTool(ctx),
    createSearchKbTool(ctx),
    createListKbTool(ctx),
    createDeleteKbTool(ctx),
    createTagManagerTool(ctx),
    createAttachmentManagerTool(ctx),
  ] as SdkMcpToolDefinition<any>[];
}
