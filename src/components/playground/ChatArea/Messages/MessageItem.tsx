// src/components/playground/ChatArea/Messages/MessageItem.tsx (Updated)

import React, { memo, useState } from 'react'; // Import useState
import Icon from '@/components/ui/icon';
import MarkdownRenderer from '@/components/ui/typography/MarkdownRenderer';
import { usePlaygroundStore } from '@/store';
import type { PlaygroundChatMessage } from '@/types/playground';
import Videos from './Multimedia/Videos';
import Images from './Multimedia/Images';
import Audios from './Multimedia/Audios';
import AgentThinkingLoader from './AgentThinkingLoader';
import { Button } from '@/components/ui/button'; // Import Button
import { toast } from 'sonner'; // Import toast
import { addContentToKnowledgeBaseAPI } from '@/api/playground'; // Import the new API function
import { useQueryState } from 'nuqs'; // Import useQueryState to get agentId

interface MessageProps {
  message: PlaygroundChatMessage;
}

const AgentMessage = ({ message }: MessageProps) => {
  const { streamingErrorMessage, selectedEndpoint } = usePlaygroundStore();
  const [agentId] = useQueryState('agent'); // Get current agentId
  const [isAddingToKB, setIsAddingToKB] = useState(false); // State for loading indicator

  // --- Handler for the "Add to KB" button ---
  const handleAddToKB = async () => {
    if (!agentId || !message.content || isAddingToKB) {
      if (!agentId) toast.error("No agent selected.");
      if (!message.content) toast.error("Cannot add empty message to knowledge base.");
      return;
    }

    setIsAddingToKB(true); // Set loading state
    const loadingToastId = toast.loading("Adding to knowledge base...");

    try {
      const success = await addContentToKnowledgeBaseAPI(
        selectedEndpoint,
        agentId,
        message.content
      );

      toast.dismiss(loadingToastId); // Dismiss loading toast

      if (success) {
        toast.success("Content successfully added to knowledge base!");
      } else {
        // Error toast is handled within the API function now
        // toast.error("Failed to add content to knowledge base.");
      }
    } catch (error) {
      // Catch unexpected errors during the call setup
      toast.dismiss(loadingToastId);
      toast.error("An unexpected error occurred.");
      console.error("Error in handleAddToKB:", error);
    } finally {
      setIsAddingToKB(false); // Reset loading state
    }
  };
  // --- End Handler ---

  let messageContent;
  if (message.streamingError) {
    messageContent = (
      <p className="text-destructive">
        Oops! Something went wrong while streaming.{' '}
        {streamingErrorMessage ? (
          <>{streamingErrorMessage}</>
        ) : (
          'Please try refreshing the page or try again later.'
        )}
      </p>
    );
  } else if (message.content) {
    messageContent = (
      <div className="flex w-full flex-col gap-4">
        {/* Render the Markdown content */}
        <MarkdownRenderer>{message.content}</MarkdownRenderer>
        {/* Render multimedia if present */}
        {message.videos && message.videos.length > 0 && (
          <Videos videos={message.videos} />
        )}
        {message.images && message.images.length > 0 && (
          <Images images={message.images} />
        )}
        {message.audio && message.audio.length > 0 && (
          <Audios audio={message.audio} />
        )}
        {/* --- Add to KB Button --- */}
        {/* Show button only if there's text content and not currently adding */}
        {message.content.trim() && (
          <div className="mt-2 flex justify-end">
            <Button
              variant="ghost" // Use ghost variant for less emphasis
              size="sm" // Smaller size
              onClick={handleAddToKB}
              disabled={isAddingToKB || !agentId} // Disable while adding or if no agent selected
              className="h-auto rounded-md px-2 py-1 text-xs text-muted hover:bg-accent/80 hover:text-primary"
              title="Add this response to the agent's knowledge base"
            >
              <Icon type="plus-icon" size="xs" className="mr-1" /> {/* Use a plus icon */}
              Add to KB
              {isAddingToKB && <span className="ml-1 animate-pulse">...</span>} {/* Loading indicator */}
            </Button>
          </div>
        )}
        {/* --- End Add to KB Button --- */}
      </div>
    );
  } else if (message.response_audio) {
    // Handling for audio responses (unchanged)
    if (!message.response_audio.transcript) {
      messageContent = (
        <div className="mt-2 flex items-start">
          <AgentThinkingLoader />
        </div>
      );
    } else {
      messageContent = (
        <div className="flex w-full flex-col gap-4">
          <MarkdownRenderer>
            {message.response_audio.transcript}
          </MarkdownRenderer>
          {message.response_audio.content && message.response_audio && (
            <Audios audio={[message.response_audio]} />
          )}
        </div>
      );
    }
  } else {
    // Placeholder for agent thinking (unchanged)
    messageContent = (
      <div className="mt-2">
        <AgentThinkingLoader />
      </div>
    );
  }

  return (
    // Main message container (unchanged)
    <div className="flex flex-row items-start gap-4 font-geist">
      <div className="flex-shrink-0">
        <Icon type="agent" size="sm" />
      </div>
      {/* Render the determined message content */}
      {messageContent}
    </div>
  );
};

// UserMessage component remains unchanged
const UserMessage = memo(({ message }: MessageProps) => {
  return (
    <div className="flex items-start pt-4 text-start max-md:break-words">
      <div className="flex flex-row gap-x-3">
        <p className="flex items-center gap-x-2 text-sm font-medium text-muted">
          <Icon type="user" size="sm" />
        </p>
        <div className="text-md rounded-lg py-1 font-geist text-secondary">
          {message.content}
        </div>
      </div>
    </div>
  );
});

AgentMessage.displayName = 'AgentMessage';
UserMessage.displayName = 'UserMessage';
export { AgentMessage, UserMessage };

