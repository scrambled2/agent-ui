// src/hooks/useAIStreamHandler.tsx (Send Goal/Instructions + Fixes)

import { useCallback } from 'react'
import { APIRoutes } from '@/api/routes'
import useChatActions from '@/hooks/useChatActions'
import { usePlaygroundStore } from '../store'
import { RunEvent, type RunResponse, type ToolCall, type SessionEntry } from '@/types/playground'
import { constructEndpointUrl } from '@/lib/constructEndpointUrl'
import useAIResponseStream from './useAIResponseStream'
import { useQueryState } from 'nuqs'
import { truncateText } from '@/lib/utils'
import { toast } from 'sonner'

const useAIChatStreamHandler = () => {
  // Get state setters and values from Zustand store
  const setMessages = usePlaygroundStore((state) => state.setMessages)
  const { addMessage, focusChatInput } = useChatActions()
  // Get agentId from URL query parameter
  const [agentId] = useQueryState('agent')
  const [sessionId, setSessionId] = useQueryState('session')
  const {
    selectedEndpoint,
    setStreamingErrorMessage,
    setIsStreaming,
    setSessionsData,
    hasStorage,
    numDocumentsToRetrieve,
    selectedModelOverride,
    numHistoryToInclude,
    // Get Goal/Instruction State
    goalOverride,
    instructionsOverride
  } = usePlaygroundStore()

  const { streamResponse } = useAIResponseStream()

  // Callback to update the last agent message with an error state
  const updateMessagesWithErrorState = useCallback(() => {
     setMessages((prevMessages) => {
      const newMessages = [...prevMessages]
      const lastMessage = newMessages[newMessages.length - 1]
      if (lastMessage && lastMessage.role === 'agent') {
        lastMessage.streamingError = true
      }
      return newMessages
    })
  }, [setMessages])

  // Main function to handle sending the user input and processing the streamed response
  const handleStreamResponse = useCallback(
    async (input: string | FormData) => {

      // Check if agentId is valid before proceeding
      if (!agentId) {
        toast.error('Please select an agent before sending a message.');
        setIsStreaming(false); // Ensure streaming state is reset if it was somehow set
        return; // Stop execution if no agent is selected
      }

      setIsStreaming(true); // Set streaming state to true *after* validation

      const formData = input instanceof FormData ? input : new FormData()
      if (typeof input === 'string') {
        formData.append('message', input)
      }

      // Add parameters to FormData
      formData.append('num_documents', numDocumentsToRetrieve.toString())
      if (selectedModelOverride) {
        formData.append('model_id', selectedModelOverride)
      }
      formData.append('num_history_to_include', numHistoryToInclude.toString())
      // Add goal and instructions overrides (send even if empty string, but not if null)
      if (goalOverride !== null) {
          formData.append('goal', goalOverride);
      }
      if (instructionsOverride !== null) {
          formData.append('instructions', instructionsOverride);
      }

      // Optimistic UI Updates
       setMessages((prevMessages) => {
        if (prevMessages.length >= 2) {
          const lastMessage = prevMessages[prevMessages.length - 1]
          const secondLastMessage = prevMessages[prevMessages.length - 2]
          if (
            lastMessage.role === 'agent' &&
            lastMessage.streamingError &&
            secondLastMessage.role === 'user'
          ) {
            return prevMessages.slice(0, -2)
          }
        }
        return prevMessages
      })

      addMessage({
        role: 'user',
        content: formData.get('message') as string,
        created_at: Math.floor(Date.now() / 1000)
      })

      addMessage({
        role: 'agent',
        content: '',
        tool_calls: [],
        streamingError: false,
        created_at: Math.floor(Date.now() / 1000) + 1
      })


      let lastContent = ''
      let newSessionId = sessionId // Initialize with current sessionId

      try {
        const endpointUrl = constructEndpointUrl(selectedEndpoint)
        // Use non-null assertion for agentId as we checked it above
        const playgroundRunUrl = APIRoutes.AgentRun(endpointUrl, agentId!);

        formData.append('stream', 'true')
        formData.append('session_id', sessionId ?? '') // Send current session ID

        // Call the streamResponse hook
        await streamResponse({
          apiUrl: playgroundRunUrl,
          requestBody: formData,
          onChunk: (chunk: RunResponse) => {
            // Update newSessionId if received in a chunk
            if (chunk.session_id && chunk.session_id !== sessionId) {
              newSessionId = chunk.session_id;
            }

            // ... (rest of onChunk logic remains the same) ...
             if (chunk.event === RunEvent.RunResponse) {
              setMessages((prevMessages) => {
                const newMessages = [...prevMessages]
                const lastMessage = newMessages[newMessages.length - 1]

                if (lastMessage && lastMessage.role === 'agent') {
                  if (typeof chunk.content === 'string') {
                    const uniqueContent = chunk.content.replace(lastContent, '')
                    lastMessage.content += uniqueContent
                    lastContent = chunk.content
                  }
                  const toolCalls: ToolCall[] = [...(chunk.tools ?? [])]
                  if (toolCalls.length > 0) {
                    lastMessage.tool_calls = toolCalls
                  }
                  if (chunk.extra_data?.reasoning_steps) {
                    lastMessage.extra_data = {
                      ...lastMessage.extra_data,
                      reasoning_steps: chunk.extra_data.reasoning_steps
                    }
                  }
                  if (chunk.extra_data?.references) {
                    lastMessage.extra_data = {
                      ...lastMessage.extra_data,
                      references: chunk.extra_data.references
                    }
                  }
                  if (chunk.images) lastMessage.images = chunk.images
                  if (chunk.videos) lastMessage.videos = chunk.videos
                  if (chunk.audio) lastMessage.audio = chunk.audio
                  lastMessage.created_at = chunk.created_at ?? lastMessage.created_at
                } else if (
                  chunk.response_audio?.transcript &&
                  typeof chunk.response_audio?.transcript === 'string'
                ) {
                  const transcript = chunk.response_audio.transcript
                  if (lastMessage && lastMessage.role === 'agent') {
                     lastMessage.response_audio = {
                       ...lastMessage.response_audio,
                       transcript: (lastMessage.response_audio?.transcript || '') + transcript
                     }
                  }
                }
                return newMessages
              })
            } else if (chunk.event === RunEvent.RunError) {
              updateMessagesWithErrorState()
              const errorContent = chunk.content as string
              setStreamingErrorMessage(errorContent)
              toast.error(`Agent Error: ${errorContent}`)
            } else if (chunk.event === RunEvent.RunCompleted) {
              setMessages((prevMessages) => {
                const newMessages = prevMessages.map((message, index) => {
                  if (index === prevMessages.length - 1 && message.role === 'agent') {
                    let updatedContent: string
                    if (typeof chunk.content === 'string') {
                      updatedContent = chunk.content
                    } else {
                      try {
                        updatedContent = JSON.stringify(chunk.content)
                      } catch {
                        updatedContent = 'Error parsing final response content'
                      }
                    }
                    return {
                      ...message,
                      content: updatedContent,
                      tool_calls: chunk.tools && chunk.tools.length > 0 ? [...chunk.tools] : message.tool_calls,
                      images: chunk.images ?? message.images,
                      videos: chunk.videos ?? message.videos,
                      audio: chunk.audio ?? message.audio,
                      response_audio: chunk.response_audio ?? message.response_audio,
                      created_at: chunk.created_at ?? message.created_at,
                      extra_data: {
                        reasoning_steps: chunk.extra_data?.reasoning_steps ?? message.extra_data?.reasoning_steps,
                        references: chunk.extra_data?.references ?? message.extra_data?.references
                      }
                    }
                  }
                  return message
                })
                return newMessages
              })
            }
            // Update URL query param if session ID changes mid-stream
            if (chunk.session_id && chunk.session_id !== sessionId && chunk.session_id === newSessionId) {
               setSessionId(chunk.session_id);
            }
          },
          onError: (error) => {
            updateMessagesWithErrorState()
            setStreamingErrorMessage(error.message)
            toast.error(`Stream Error: ${error.message}`)
          },
          onComplete: () => {
            // Add placeholder session only if a *new* session was created and agent has storage
            if (newSessionId && newSessionId !== sessionId && hasStorage) {
              setSessionId(newSessionId); // Update URL query param definitively here

              setSessionsData((prevSessionsData) => {
                const existingIds = new Set(prevSessionsData?.map(s => s.session_id));
                // Only add if the ID is not already in the list
                if (!existingIds.has(newSessionId!)) {
                    const messageContent = formData.get('message') as string | null;
                    const title = messageContent ? truncateText(messageContent, 30) : `Session ${newSessionId!.substring(0, 8)}`;
                    const placeHolderSessionData: SessionEntry = {
                        session_id: newSessionId!, // Use non-null assertion
                        title: title,
                        created_at: Math.floor(Date.now() / 1000)
                    };
                    return [placeHolderSessionData, ...(prevSessionsData ?? [])];
                }
                return prevSessionsData;
              });
            }
          }
        })
      } catch (error) {
        updateMessagesWithErrorState()
        setStreamingErrorMessage(
          error instanceof Error ? error.message : String(error)
        )
        toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        focusChatInput()
        setIsStreaming(false)
      }
    },
    [ // Ensure all dependencies are listed
      agentId,
      sessionId,
      setSessionId,
      goalOverride,
      instructionsOverride,
      numHistoryToInclude,
      numDocumentsToRetrieve,
      selectedModelOverride,
      setIsStreaming,
      setMessages,
      addMessage,
      focusChatInput,
      selectedEndpoint,
      streamResponse,
      updateMessagesWithErrorState,
      setStreamingErrorMessage,
      setSessionsData,
      hasStorage
    ]
  )

  return { handleStreamResponse }
}

export default useAIChatStreamHandler
