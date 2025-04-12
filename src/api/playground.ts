// src/api/playground.ts (Updated)

import { toast } from 'sonner'

import { APIRoutes } from './routes' // Assuming APIRoutes is correctly defined here

import { Agent, ComboboxAgent, SessionEntry } from '@/types/playground' // Assuming types are here

// --- Existing API Functions ---

export const getPlaygroundAgentsAPI = async (
  endpoint: string
): Promise<ComboboxAgent[]> => {
  const url = APIRoutes.GetPlaygroundAgents(endpoint)
  try {
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) {
      toast.error(`Failed to fetch playground agents: ${response.statusText}`)
      return []
    }
    const data = await response.json()
    // Transform the API response into the expected shape.
    const agents: ComboboxAgent[] = data.map((item: Agent) => ({
      value: item.agent_id || '',
      label: item.name || '',
      model: item.model || '', // Ensure model structure matches ComboboxAgent
      storage: item.storage || false
    }))
    return agents
  } catch {
    toast.error('Error fetching playground agents')
    return []
  }
}

export const getPlaygroundStatusAPI = async (base: string): Promise<number> => {
    try {
        const response = await fetch(APIRoutes.PlaygroundStatus(base), {
          method: 'GET'
        });
        return response.status;
    } catch (error) {
        console.error("Error fetching playground status:", error);
        // Return a status code indicating an error, e.g., 503 Service Unavailable
        return 503;
    }
}


export const getAllPlaygroundSessionsAPI = async (
  base: string,
  agentId: string
): Promise<SessionEntry[]> => {
  try {
    const response = await fetch(
      APIRoutes.GetPlaygroundSessions(base, agentId),
      {
        method: 'GET'
      }
    )
    if (!response.ok) {
      if (response.status === 404) {
        // Return empty array when storage is not enabled or no sessions found
        return []
      }
      throw new Error(`Failed to fetch sessions: ${response.statusText}`)
    }
    // Check if response is empty before parsing JSON
    const text = await response.text();
    if (!text) {
        return []; // Return empty array if response body is empty
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Error fetching playground sessions:", error); // Log error
    toast.error('Error fetching sessions'); // Notify user
    return []
  }
}

export const getPlaygroundSessionAPI = async (
  base: string,
  agentId: string,
  sessionId: string
) => {
  const response = await fetch(
    APIRoutes.GetPlaygroundSession(base, agentId, sessionId),
    {
      method: 'GET'
    }
  )
   if (!response.ok) {
        // Handle non-OK responses appropriately
        const errorText = await response.text();
        console.error(`Failed to fetch session ${sessionId}: ${response.status} ${errorText}`);
        throw new Error(`Failed to fetch session: ${response.statusText}`);
    }
  return response.json()
}

export const deletePlaygroundSessionAPI = async (
  base: string,
  agentId: string,
  sessionId: string
) => {
  const response = await fetch(
    APIRoutes.DeletePlaygroundSession(base, agentId, sessionId),
    {
      method: 'DELETE'
    }
  )
  // No need to parse JSON for a DELETE confirmation usually, just check status
  return response;
}


// --- NEW FUNCTION: Add Content to Knowledge Base ---
/**
 * Sends text content to the backend to be added to the specified agent's knowledge base.
 * @param endpoint - The base URL of the playground API.
 * @param agentId - The ID of the agent whose knowledge base will be updated.
 * @param content - The text content to add.
 * @returns Promise<boolean> - True if successful, false otherwise.
 */
export const addContentToKnowledgeBaseAPI = async (
  endpoint: string,
  agentId: string,
  content: string
): Promise<boolean> => {
  // Construct the specific API route for adding knowledge
  const url = APIRoutes.AddKnowledge(endpoint, agentId); // Ensure this route is defined in APIRoutes
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Sending JSON payload
      },
      body: JSON.stringify({ content: content }), // Send content in JSON body
    });

    if (!response.ok) {
      // Handle errors, potentially reading error details from response body
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      const errorMessage = errorData?.detail || `Failed to add content: ${response.statusText}`;
      console.error("Error adding to knowledge base:", errorMessage);
      toast.error(`Error adding to KB: ${errorMessage}`);
      return false; // Indicate failure
    }

    // Optionally parse success message if backend sends one
    // const data = await response.json();
    // console.log("Success adding to KB:", data);
    return true; // Indicate success

  } catch (error) {
    console.error("Error calling addContentToKnowledgeBaseAPI:", error);
    toast.error('Network error while adding content to knowledge base.');
    return false; // Indicate failure
  }
};
// --- END NEW FUNCTION ---
