// src/components/playground/Sidebar/Sidebar.tsx (Includes Goal/Instruction Controls)

'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AgentSelector } from '@/components/playground/Sidebar/AgentSelector'
import useChatActions from '@/hooks/useChatActions'
import { usePlaygroundStore } from '@/store' // Use the updated store
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { getProviderIcon } from '@/lib/modelProvider'
import Sessions from './Sessions'
import { isValidUrl } from '@/lib/utils'
import { toast } from 'sonner'
import { useQueryState } from 'nuqs'
import { truncateText } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
// Import TextArea (assuming it exists or use standard HTML)
import { TextArea } from '@/components/ui/textarea'


const ENDPOINT_PLACEHOLDER = 'NO ENDPOINT ADDED'

// --- Reusable Components ---
// SidebarHeader, NewChatButton, ModelDisplay, Endpoint components remain the same
// ... (Paste the full code for SidebarHeader, NewChatButton, ModelDisplay, Endpoint here from previous correct version) ...
const SidebarHeader = () => (
  <div className="flex items-center gap-2">
    <Icon type="agno" size="xs" />
    <span className="text-xs font-medium uppercase text-white">Agent UI</span>
  </div>
)

const NewChatButton = ({
  disabled,
  onClick
}: {
  disabled: boolean
  onClick: () => void
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    size="lg"
    className="h-9 w-full rounded-xl bg-primary text-xs font-medium text-background hover:bg-primary/80"
  >
    <Icon type="plus-icon" size="xs" className="text-background" />
    <span className="uppercase">New Chat</span>
  </Button>
)

const ModelDisplay = ({ model }: { model: string }) => (
  <div className="flex h-9 w-full items-center gap-3 rounded-xl border border-primary/15 bg-accent p-3 text-xs font-medium uppercase text-muted">
    {(() => {
      const icon = getProviderIcon(model)
      return icon ? <Icon type={icon} className="shrink-0" size="xs" /> : null
    })()}
    {model}
  </div>
)

const Endpoint = () => {
  // State and hooks for endpoint management
  const {
    selectedEndpoint,
    isEndpointActive,
    setSelectedEndpoint,
    setAgents,
    setSessionsData,
    setMessages
  } = usePlaygroundStore()
  const { initializePlayground } = useChatActions()
  const [isEditing, setIsEditing] = useState(false)
  const [endpointValue, setEndpointValue] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [, setAgentId] = useQueryState('agent')
  const [, setSessionId] = useQueryState('session')

  // Effect to sync local state with store
  useEffect(() => {
    setEndpointValue(selectedEndpoint)
    setIsMounted(true)
  }, [selectedEndpoint])

  // Helper to determine status indicator color
  const getStatusColor = (isActive: boolean) =>
    isActive ? 'bg-positive' : 'bg-destructive'

  // Handler for saving the edited endpoint
  const handleSave = async () => {
    if (!isValidUrl(endpointValue)) {
      toast.error('Please enter a valid URL')
      return
    }
    const cleanEndpoint = endpointValue.replace(/\/$/, '') // Remove trailing slash
    setSelectedEndpoint(cleanEndpoint)
    // Reset related state when endpoint changes
    setAgentId(null)
    setSessionId(null)
    setIsEditing(false)
    setIsHovering(false)
    setAgents([])
    setSessionsData([])
    setMessages([])
    // Re-initialize playground after saving
    await initializePlayground()
  }

  // Handler for canceling endpoint edit
  const handleCancel = () => {
    setEndpointValue(selectedEndpoint) // Revert to original value
    setIsEditing(false)
    setIsHovering(false)
  }

  // Handler for keyboard events (Enter to save, Escape to cancel)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  // Handler for refreshing endpoint status and agent list
  const handleRefresh = async () => {
    setIsRotating(true)
    await initializePlayground() // Re-fetch status and agents
    // Simple animation feedback
    setTimeout(() => setIsRotating(false), 500)
  }

  // Render the endpoint section UI
  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="text-xs font-medium uppercase text-primary">Endpoint</div>
      {isEditing ? (
        // Editing mode UI
        <div className="flex w-full items-center gap-1">
          <input
            type="text"
            value={endpointValue}
            onChange={(e) => setEndpointValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex h-9 w-full items-center text-ellipsis rounded-xl border border-primary/15 bg-accent p-3 text-xs font-medium text-muted focus:border-primary/50 focus:outline-none focus:ring-0"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className="hover:cursor-pointer hover:bg-transparent"
            aria-label="Save Endpoint"
          >
            <Icon type="save" size="xs" />
          </Button>
        </div>
      ) : (
        // Display mode UI
        <div className="flex w-full items-center gap-1">
          <motion.div
            className="relative flex h-9 w-full cursor-pointer items-center justify-between rounded-xl border border-primary/15 bg-accent p-3 uppercase"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => setIsEditing(true)} // Enter edit mode on click
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            title="Click to edit endpoint"
          >
            {/* Animated presence for hover effect */}
            <AnimatePresence mode="wait">
              {isHovering ? (
                // Hover state: Show "EDIT ENDPOINT"
                <motion.div
                  key="endpoint-display-hover"
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-primary">
                    <Icon type="edit" size="xxs" /> EDIT ENDPOINT
                  </p>
                </motion.div>
              ) : (
                // Default state: Show endpoint URL and status
                <motion.div
                  key="endpoint-display"
                  className="absolute inset-0 flex items-center justify-between px-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-xs font-medium text-muted">
                    {/* Display truncated endpoint or placeholder */}
                    {isMounted
                      ? truncateText(selectedEndpoint, 21) ||
                        ENDPOINT_PLACEHOLDER
                      : 'http://localhost:7777'}
                  </p>
                  {/* Status indicator dot */}
                  <div
                    className={`size-2 shrink-0 rounded-full ${getStatusColor(isEndpointActive)}`}
                    title={isEndpointActive ? 'Connected' : 'Disconnected'}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          {/* Refresh button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="hover:cursor-pointer hover:bg-transparent"
            aria-label="Refresh Endpoint"
            title="Refresh connection & agents"
          >
            <motion.div
              key={isRotating ? 'rotating' : 'idle'} // Key change triggers animation
              animate={{ rotate: isRotating ? 360 : 0 }} // Rotate animation
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <Icon type="refresh" size="xs" />
            </motion.div>
          </Button>
        </div>
      )}
    </div>
  )
}


// --- Main Sidebar Component ---
const Sidebar = () => {
  // State for sidebar collapse/expand
  const [isCollapsed, setIsCollapsed] = useState(false)
  // Custom hook for chat actions
  const { clearChat, focusChatInput, initializePlayground } = useChatActions()
  // Get state and setters from Zustand store
  const {
    messages,
    selectedEndpoint,
    isEndpointActive,
    selectedModel,
    hydrated,
    isEndpointLoading,
    numDocumentsToRetrieve,
    setNumDocumentsToRetrieve,
    selectedModelOverride,
    setSelectedModelOverride,
    numHistoryToInclude,
    setNumHistoryToInclude,
    // Get Goal/Instruction State
    goalOverride,
    setGoalOverride,
    instructionsOverride,
    setInstructionsOverride,
  } = usePlaygroundStore()
  // State to track if component is mounted
  const [isMounted, setIsMounted] = useState(false)
  // Get agentId from URL query params
  const [agentId] = useQueryState('agent')

  // Effect to initialize playground
  useEffect(() => {
    setIsMounted(true)
    if (hydrated) initializePlayground()
  }, [selectedEndpoint, initializePlayground, hydrated])

  // Handler for "New Chat"
  const handleNewChat = () => {
    clearChat()
    focusChatInput()
  }

  // Handler for Docs to Retrieve input
  const handleNumDocsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10)
    if (!isNaN(value)) {
      setNumDocumentsToRetrieve(value)
    }
  }

  // Handler for Model Override select
  const handleModelChange = (value: string) => {
    setSelectedModelOverride(value === 'agent-default' ? null : value)
  }

  // Handler for History Count input
  const handleHistoryCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     const value = parseInt(event.target.value, 10);
     if (!isNaN(value)) {
       setNumHistoryToInclude(value);
     }
  }

  // Handlers for Goal/Instruction TextAreas
  const handleGoalChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setGoalOverride(event.target.value || null); // Set to null if empty
  }

  const handleInstructionsChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInstructionsOverride(event.target.value || null); // Set to null if empty
  }

  // Render the Sidebar UI
  return (
    <motion.aside
      className="relative flex h-screen shrink-0 grow-0 flex-col overflow-y-auto px-2 py-3 font-dmmono"
      initial={{ width: '16rem' }}
      animate={{ width: isCollapsed ? '2.5rem' : '16rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Collapse/Expand Button */}
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-2 top-2 z-10 p-1"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        type="button"
        whileTap={{ scale: 0.95 }}
      >
        <Icon
          type="sheet"
          size="xs"
          className={`transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`}
        />
      </motion.button>

      {/* Sidebar Content Area */}
      <motion.div
        className="w-60 space-y-5"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -20 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          pointerEvents: isCollapsed ? 'none' : 'auto'
        }}
      >
        <SidebarHeader />
        <NewChatButton
          disabled={messages.length === 0}
          onClick={handleNewChat}
        />

        {isMounted && (
          <>
            <Endpoint />
            {isEndpointActive && (
              <>
                {/* Agent Selection Section */}
                <motion.div
                  className="flex w-full flex-col items-start gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  <div className="text-xs font-medium uppercase text-primary">
                    Agent
                  </div>
                  {isEndpointLoading ? (
                     <div className="flex w-full flex-col gap-2">
                      <Skeleton className="h-9 w-full rounded-xl" />
                      <Skeleton className="h-9 w-full rounded-xl" />
                    </div>
                  ) : (
                    <>
                      <AgentSelector />
                      {selectedModel && agentId && (
                        <ModelDisplay model={selectedModel} />
                      )}
                    </>
                  )}
                </motion.div>

                {/* --- UI CONTROLS SECTION --- */}
                <motion.div
                  className="flex w-full flex-col items-start gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: 'easeInOut' }}
                >
                  {/* Model Override Dropdown */}
                  <div className="w-full space-y-2">
                    <label
                      htmlFor="model-override"
                      className="block text-xs font-medium uppercase text-primary"
                    >
                      Model Override
                    </label>
                    <Select
                      value={selectedModelOverride ?? 'agent-default'}
                      onValueChange={handleModelChange}
                      disabled={!agentId}
                    >
                      <SelectTrigger
                        id="model-override"
                        className="h-9 w-full rounded-xl border border-primary/15 bg-primaryAccent text-xs font-medium uppercase"
                      >
                        <SelectValue placeholder="Agent Default" />
                      </SelectTrigger>
                      <SelectContent className="border-none bg-primaryAccent font-dmmono shadow-lg">
                        <SelectItem value="agent-default" className="cursor-pointer">
                          <div className="flex items-center gap-3 text-xs font-medium uppercase">
                            <Icon type={'agent'} size="xs" /> Agent Default
                          </div>
                        </SelectItem>
                        <SelectItem value="gpt-4o-mini" className="cursor-pointer">
                          <div className="flex items-center gap-3 text-xs font-medium uppercase">
                            <Icon type={'open-ai'} size="xs" /> GPT-4o Mini
                          </div>
                        </SelectItem>
                        <SelectItem value="gpt-4o" className="cursor-pointer">
                          <div className="flex items-center gap-3 text-xs font-medium uppercase">
                            <Icon type={'open-ai'} size="xs" /> GPT-4o
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted">
                      Overrides the agent's default model for the next run.
                    </p>
                  </div>

                  {/* Document Retrieval Count Input */}
                  <div className="w-full space-y-2">
                    <label
                      htmlFor="num-docs"
                      className="block text-xs font-medium uppercase text-primary"
                    >
                      Docs to Retrieve (RAG)
                    </label>
                    <input
                      id="num-docs"
                      type="number"
                      min="1" max="10" step="1"
                      value={numDocumentsToRetrieve}
                      onChange={handleNumDocsChange}
                      disabled={!agentId}
                      className="flex h-9 w-full rounded-xl border border-primary/15 bg-primaryAccent p-3 text-xs font-medium text-primary file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary/50"
                    />
                     <p className="text-xs text-muted">
                      Number of documents the agent searches for.
                    </p>
                  </div>

                  {/* Chat History Count Input */}
                  <div className="w-full space-y-2">
                    <label
                      htmlFor="num-history"
                      className="block text-xs font-medium uppercase text-primary"
                    >
                      Chat History to Include
                    </label>
                    <input
                      id="num-history"
                      type="number" min="0" max="20" step="1"
                      value={numHistoryToInclude}
                      onChange={handleHistoryCountChange}
                      disabled={!agentId}
                      className="flex h-9 w-full rounded-xl border border-primary/15 bg-primaryAccent p-3 text-xs font-medium text-primary file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary/50"
                    />
                     <p className="text-xs text-muted">
                      Number of past message pairs sent to the model.
                    </p>
                  </div>

                  {/* Goal Override TextArea */}
                  <div className="w-full space-y-2">
                     <label
                       htmlFor="goal-override"
                       className="block text-xs font-medium uppercase text-primary"
                     >
                       Goal Override
                     </label>
                     <TextArea
                       id="goal-override"
                       placeholder="Enter goal to override agent default..."
                       value={goalOverride ?? ''} // Use override state, default to empty string
                       onChange={handleGoalChange}
                       disabled={!agentId}
                       className="min-h-[60px] max-h-[100px] rounded-xl border border-primary/15 bg-primaryAccent p-3 text-xs font-medium text-primary focus:border-primary/50"
                       rows={3}
                     />
                     <p className="text-xs text-muted">
                       Overrides the agent's default goal for the next run.
                     </p>
                  </div>

                  {/* Instructions Override TextArea */}
                  <div className="w-full space-y-2">
                     <label
                       htmlFor="instructions-override"
                       className="block text-xs font-medium uppercase text-primary"
                     >
                       Instructions Override
                     </label>
                     <TextArea
                       id="instructions-override"
                       placeholder="Enter instructions (one per line) to override agent defaults..."
                       value={instructionsOverride ?? ''} // Use override state, default to empty string
                       onChange={handleInstructionsChange}
                       disabled={!agentId}
                       className="min-h-[100px] max-h-[200px] rounded-xl border border-primary/15 bg-primaryAccent p-3 text-xs font-medium text-primary focus:border-primary/50"
                       rows={5}
                     />
                     <p className="text-xs text-muted">
                       Overrides the agent's default instructions for the next run.
                     </p>
                  </div>

                </motion.div>
                {/* --- END UI CONTROLS SECTION --- */}

                {/* Sessions List Section */}
                <Sessions />
              </>
            )}
          </>
        )}
      </motion.div>
    </motion.aside>
  )
}

export default Sidebar
