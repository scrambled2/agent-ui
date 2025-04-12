// src/components/playground/ChatArea/Messages/Messages.tsx
// Remove ScrollToBottom component usage to resolve TS error.

import type { PlaygroundChatMessage, ToolCall } from '@/types/playground'
import { AgentMessage, UserMessage } from './MessageItem'
import Tooltip from '@/components/ui/tooltip'
import { memo } from 'react'
import {
  type ToolCallProps,
  type ReasoningStepProps,
  type ReasoningProps,
  type ReasoningSteps,
  type ReferenceData,
  type Reference
} from '@/types/playground'
import React, { type FC, useEffect, useRef } from 'react'
import ChatBlankState from './ChatBlankState'
import Icon from '@/components/ui/icon'
import { AnimatePresence, motion } from 'framer-motion';
import { usePlaygroundStore } from '@/store';
// --- FIX: Comment out or remove ScrollToBottom import ---
// import ScrollToBottom from '@/components/ui/ScrollToBottom';
// --- END FIX ---

// Props for the main Messages component
interface MessageListProps {
  // messages prop is now fetched from the store within the component
}

// Props for the AgentMessageWrapper - Requires isLastMessage
interface MessageWrapperProps {
  message: PlaygroundChatMessage
  isLastMessage: boolean
}

// Props for the References component
interface ReferenceProps {
  references: ReferenceData[]
}

// Props for the ReferenceItem component
interface ReferenceItemProps {
  reference: Reference
}

// Component to render a single reference item
const ReferenceItem: FC<ReferenceItemProps> = ({ reference }) => (
  <div className="relative flex h-[63px] w-[190px] cursor-default flex-col justify-between overflow-hidden rounded-md bg-background-secondary p-3 transition-colors hover:bg-background-secondary/80">
    <p className="text-sm font-medium text-primary">{reference.name}</p>
    <p className="truncate text-xs text-primary/40">{reference.content}</p>
  </div>
)
ReferenceItem.displayName = 'ReferenceItem';

// Component to render a list of references grouped by query
const References: FC<ReferenceProps> = ({ references }) => (
  <div className="flex flex-col gap-4">
    {references.map((referenceData, index) => (
      <div
        key={`${referenceData.query || 'ref-data'}-${index}`}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap gap-3">
          {referenceData.references.map((reference, refIndex) => (
            <ReferenceItem
              key={`${reference.name}-${reference.meta_data?.chunk ?? 'chunk'}-${refIndex}`}
              reference={reference}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
)
References.displayName = 'References';


// Component to render a single reasoning step
const Reasoning: FC<ReasoningStepProps> = ({ index, stepTitle }) => (
  <div className="flex items-center gap-2 text-secondary">
    <div className="flex h-[20px] items-center rounded-md bg-background-secondary p-2">
      <p className="text-xs">STEP {index + 1}</p>
    </div>
    <p className="text-xs">{stepTitle}</p>
  </div>
)
Reasoning.displayName = 'Reasoning';

// Component to render a list of reasoning steps
const Reasonings: FC<ReasoningProps> = ({ reasoning }) => (
  <div className="flex flex-col items-start justify-center gap-2">
    {Array.isArray(reasoning) && reasoning.map((step: ReasoningSteps, index: number) => (
      <Reasoning
        key={`${step.title}-${step.action}-${index}`}
        stepTitle={step.title}
        index={index}
      />
    ))}
  </div>
)
Reasonings.displayName = 'Reasonings';

// Component to render a single tool call chip
const ToolComponent = memo(({ tools }: ToolCallProps) => (
  <div className="cursor-default rounded-full bg-accent px-2 py-1.5 text-xs">
    <p className="font-dmmono uppercase text-primary/80">{tools.tool_name ?? 'Unknown Tool'}</p> {/* Fallback for name */}
  </div>
))
ToolComponent.displayName = 'ToolComponent';

// Wrapper component for Agent messages, handling reasoning, references, and tool calls
const AgentMessageWrapperInternal = ({ message, isLastMessage }: MessageWrapperProps) => {
  const hasReasoning = message.extra_data?.reasoning_steps && message.extra_data.reasoning_steps.length > 0;
  const hasReferences = message.extra_data?.references && message.extra_data.references.length > 0;
  const hasToolCalls = message.tool_calls && message.tool_calls.length > 0;
  const hasExtraSections = hasReasoning || hasReferences || hasToolCalls;

  return (
    <div className={`flex flex-col ${hasExtraSections ? 'gap-y-6' : 'gap-y-0'}`}>
      {/* Reasoning Section */}
      {hasReasoning && (
        <div className="flex items-start gap-4">
          <Tooltip delayDuration={0} content={<p className="text-accent">Reasoning</p>} side="top">
            <Icon type="reasoning" size="sm" />
          </Tooltip>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase text-primary">Reasoning</p>
            <Reasonings reasoning={message.extra_data!.reasoning_steps!} />
          </div>
        </div>
      )}
      {/* References Section */}
      {hasReferences && (
        <div className="flex items-start gap-4">
          <Tooltip delayDuration={0} content={<p className="text-accent">References</p>} side="top">
            <Icon type="references" size="sm" />
          </Tooltip>
          <div className="flex flex-col gap-3">
            <References references={message.extra_data!.references!} />
          </div>
        </div>
      )}
      {/* Tool Calls Section */}
      {hasToolCalls && (
        <div className="flex items-start gap-3">
          <Tooltip delayDuration={0} content={<p className="text-accent">Tool Calls</p>} side="top">
             <div className="rounded-lg bg-background-secondary p-1">
               <Icon type="hammer" size="sm" color="secondary" />
             </div>
          </Tooltip>
          <div className="flex flex-wrap items-center gap-2">
            {Array.isArray(message.tool_calls) && message.tool_calls.map((toolCall: ToolCall, toolIndex: number) => {
               const toolKey = toolCall.tool_call_id
                 || `${toolCall.tool_name ?? `tool-${toolIndex}`}-${toolCall.created_at ?? `ts-${toolIndex}`}-${toolIndex}`;
               return (
                 <ToolComponent
                    key={toolKey}
                    tools={toolCall}
                 />
               );
            })}
          </div>
        </div>
      )}
      {/* Main Agent Message Content */}
      <AgentMessage message={message} />
    </div>
  )
}
// Memoize the internal wrapper
const AgentMessageWrapper = memo(AgentMessageWrapperInternal);
AgentMessageWrapper.displayName = 'AgentMessageWrapper';

// Memoize UserMessage if not already done in its own file
const UserMessageWrapper = memo(UserMessage);
UserMessageWrapper.displayName = 'UserMessageWrapper';


// Main component to render the list of messages
const Messages = () => {
  const messages = usePlaygroundStore((state) => state.messages);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll-to-bottom effect
  useEffect(() => {
    // Basic scrollIntoView without the helper component
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter messages before mapping
  const validMessages = messages.filter((msg, index) => {
    const hasRole = msg && typeof msg.role === 'string' && msg.role.length > 0;
    const hasTimestamp = msg && typeof msg.created_at === 'number';
    const isValid = hasRole && hasTimestamp;
    if (!isValid) {
        console.warn(`Invalid message object at index ${index}:`, msg);
    }
    return isValid;
  });

  // Handle the case where there are no valid messages
  if (validMessages.length === 0) {
    return messages.length === 0 ? <ChatBlankState /> : <p className='text-center text-muted text-sm'>No valid messages to display.</p>;
  }

  // Render the list of *valid* messages
  return (
    <div className="relative h-full w-full overflow-y-auto">
      {/* --- FIX: Comment out or remove ScrollToBottom usage --- */}
      {/* <ScrollToBottom /> */}
      {/* --- END FIX --- */}
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-y-4 px-4 pb-10 pt-4">
        <AnimatePresence initial={false}>
          {validMessages.map((message, index) => {
            const MessageComponent =
              message.role === 'user' ? UserMessageWrapper : AgentMessageWrapper;

            // Robust key generation
            const key = `${message.role}-${message.created_at}-${index}`;

            const isLastMessage = index === validMessages.length - 1;

            return (
              <MessageComponent
                key={key}
                message={message}
                isLastMessage={isLastMessage} // Restored this prop
              />
            );
          })}
        </AnimatePresence>
        {/* Dummy div to help scroll to bottom */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default Messages;
