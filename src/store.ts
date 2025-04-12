// src/store.ts (Includes Goal/Instruction Overrides)

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import {
  type PlaygroundChatMessage,
  type SessionEntry
} from '@/types/playground'

// Interface for the structure of Agent data expected by the UI
interface Agent {
  value: string // Agent ID
  label: string // Agent Name
  model: {
    provider: string
    id?: string
  }
  storage?: boolean
  // Add optional default goal/instructions
  goal?: string | null
  instructions?: string[] | null
}

// Interface defining the structure of the global state
interface PlaygroundStore {
  hydrated: boolean
  setHydrated: () => void
  streamingErrorMessage: string
  setStreamingErrorMessage: (streamingErrorMessage: string) => void
  endpoints: {
    endpoint: string
    id_playground_endpoint: string
  }[]
  setEndpoints: (
    endpoints: {
      endpoint: string
      id_playground_endpoint: string
    }[]
  ) => void
  isStreaming: boolean
  setIsStreaming: (isStreaming: boolean) => void
  isEndpointActive: boolean
  setIsEndpointActive: (isActive: boolean) => void
  isEndpointLoading: boolean
  setIsEndpointLoading: (isLoading: boolean) => void
  messages: PlaygroundChatMessage[]
  setMessages: (
    messages:
      | PlaygroundChatMessage[]
      | ((prevMessages: PlaygroundChatMessage[]) => PlaygroundChatMessage[])
  ) => void
  hasStorage: boolean
  setHasStorage: (hasStorage: boolean) => void
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>
  selectedEndpoint: string
  setSelectedEndpoint: (selectedEndpoint: string) => void
  agents: Agent[]
  setAgents: (agents: Agent[]) => void
  selectedModel: string
  setSelectedModel: (model: string) => void
  sessionsData: SessionEntry[] | null
  setSessionsData: (
    sessionsData:
      | SessionEntry[]
      | ((prevSessions: SessionEntry[] | null) => SessionEntry[] | null)
  ) => void
  isSessionsLoading: boolean
  setIsSessionsLoading: (isSessionsLoading: boolean) => void
  // UI Control State
  numDocumentsToRetrieve: number
  setNumDocumentsToRetrieve: (num: number) => void
  selectedModelOverride: string | null
  setSelectedModelOverride: (modelId: string | null) => void
  numHistoryToInclude: number
  setNumHistoryToInclude: (num: number) => void
  // State for Goal/Instructions Overrides
  goalOverride: string | null
  setGoalOverride: (goal: string | null) => void
  instructionsOverride: string | null
  setInstructionsOverride: (instructions: string | null) => void
  // Max tokens control
  maxTokens: number | null
  setMaxTokens: (tokens: number | null) => void
  // Store default agent values (fetched from backend)
  defaultGoal: string | null
  setDefaultGoal: (goal: string | null) => void
  defaultInstructions: string[] | null
  setDefaultInstructions: (instructions: string[] | null) => void
}

// Create the Zustand store with persistence
export const usePlaygroundStore = create<PlaygroundStore>()(
  persist(
    (set) => ({
      // Default values
      hydrated: false,
      streamingErrorMessage: '',
      endpoints: [],
      isStreaming: false,
      isEndpointActive: false,
      isEndpointLoading: true,
      messages: [],
      hasStorage: false,
      chatInputRef: { current: null },
      selectedEndpoint: 'http://localhost:7777',
      agents: [],
      selectedModel: '',
      sessionsData: null,
      isSessionsLoading: false,
      numDocumentsToRetrieve: 3,
      selectedModelOverride: null,
      numHistoryToInclude: 3,
      goalOverride: null,
      instructionsOverride: null,
      defaultGoal: null,
      defaultInstructions: null,
      maxTokens: null,

      // Setter functions
      setHydrated: () => set({ hydrated: true }),
      setStreamingErrorMessage: (streamingErrorMessage) =>
        set(() => ({ streamingErrorMessage })),
      setEndpoints: (endpoints) => set(() => ({ endpoints })),
      setIsStreaming: (isStreaming) => set(() => ({ isStreaming })),
      setIsEndpointActive: (isActive) =>
        set(() => ({ isEndpointActive: isActive })),
      setIsEndpointLoading: (isLoading) =>
        set(() => ({ isEndpointLoading: isLoading })),
      setMessages: (messages) =>
        set((state) => ({
          messages:
            typeof messages === 'function' ? messages(state.messages) : messages
        })),
      setHasStorage: (hasStorage) => set(() => ({ hasStorage })),
      setSelectedEndpoint: (selectedEndpoint) =>
        set(() => ({ selectedEndpoint })),
      setAgents: (agents) => set({ agents }),
      setSelectedModel: (selectedModel) => set(() => ({ selectedModel })),
      setSessionsData: (sessionsData) =>
        set((state) => ({
          sessionsData:
            typeof sessionsData === 'function'
              ? sessionsData(state.sessionsData)
              : sessionsData
        })),
      setIsSessionsLoading: (isSessionsLoading) =>
        set(() => ({ isSessionsLoading })),
      setNumDocumentsToRetrieve: (num) =>
        set({ numDocumentsToRetrieve: Math.max(1, num) }),
      setSelectedModelOverride: (modelId) => set({ selectedModelOverride: modelId }),
      setNumHistoryToInclude: (num) => set({ numHistoryToInclude: Math.max(0, num) }),
      setGoalOverride: (goal) => set({ goalOverride: goal }),
      setInstructionsOverride: (instructions) => set({ instructionsOverride: instructions }),
      setMaxTokens: (tokens) => set({ maxTokens: tokens }),
      setDefaultGoal: (goal) => set({ defaultGoal: goal }),
      setDefaultInstructions: (instructions) => set({ defaultInstructions: instructions }),
    }),
    {
      name: 'endpoint-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedEndpoint: state.selectedEndpoint,
        numDocumentsToRetrieve: state.numDocumentsToRetrieve,
        selectedModelOverride: state.selectedModelOverride,
        numHistoryToInclude: state.numHistoryToInclude,
        goalOverride: state.goalOverride,
        instructionsOverride: state.instructionsOverride,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated?.()
      }
    }
  )
)
