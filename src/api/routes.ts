// src/api/routes.ts (Updated Run Route)

export const APIRoutes = {
  // Existing Routes
  GetPlaygroundAgents: (PlaygroundApiUrl: string) =>
    `${PlaygroundApiUrl}/v1/playground/agents`,

  // Point AgentRun to the custom endpoint
  AgentRun: (PlaygroundApiUrl: string, agentId: string) =>
    `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/runs/custom`,

  PlaygroundStatus: (PlaygroundApiUrl: string) =>
    `${PlaygroundApiUrl}/v1/playground/status`,
  GetPlaygroundSessions: (PlaygroundApiUrl: string, agentId: string) =>
    `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/sessions`,
  GetPlaygroundSession: (
    PlaygroundApiUrl: string,
    agentId: string,
    sessionId: string
  ) =>
    `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/sessions/${sessionId}`,
  DeletePlaygroundSession: (
    PlaygroundApiUrl: string,
    agentId: string,
    sessionId: string
  ) =>
    `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/sessions/${sessionId}`,

  // Knowledge Base Routes
  AddKnowledge: (PlaygroundApiUrl: string, agentId: string) =>
    `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/knowledge/add`,
  UploadKnowledgeFile: (PlaygroundApiUrl: string, agentId: string) =>
    `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/knowledge/upload`,
  ListKnowledgeFiles: (PlaygroundApiUrl: string, agentId: string) =>
    `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/knowledge/list`,
  GetKnowledgeStatus: (PlaygroundApiUrl: string, agentId: string) =>
    `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/knowledge/status`,

  // Document Management Routes
  ListDocuments: (PlaygroundApiUrl: string, agentId: string) =>
    `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/documents`,
  GetDocument: (PlaygroundApiUrl: string, agentId: string, documentId: string) =>
    `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/documents/${documentId}`,
  CreateDocument: (PlaygroundApiUrl: string, agentId: string) =>
    `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/documents`,
  UpdateDocument: (PlaygroundApiUrl: string, agentId: string, documentId: string) =>
    `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/documents/${documentId}`,
  DeleteDocument: (PlaygroundApiUrl: string, agentId: string, documentId: string) =>
    `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/documents/${documentId}`
}

