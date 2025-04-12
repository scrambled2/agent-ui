// src/api/knowledge.ts - API functions for knowledge management

import { APIRoutes } from './routes'

/**
 * Upload a file to the knowledge base
 */
export const uploadFileToKnowledgeBaseAPI = async (
  endpoint: string,
  agentId: string,
  file: File,
  fileType: 'text' | 'pdf'
): Promise<{ message: string; filename: string }> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('file_type', fileType)

  const response = await fetch(
    APIRoutes.UploadKnowledgeFile(endpoint, agentId),
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Failed to upload file')
  }

  return response.json()
}

/**
 * List files in the knowledge base
 */
export const listKnowledgeFilesAPI = async (
  endpoint: string,
  agentId: string,
  fileType?: 'text' | 'pdf'
): Promise<{
  files: Array<{
    name: string
    path: string
    type: string
    size: number
    modified: string
  }>
}> => {
  const url = new URL(APIRoutes.ListKnowledgeFiles(endpoint, agentId))
  if (fileType) {
    url.searchParams.append('file_type', fileType)
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Failed to list files')
  }

  return response.json()
}

/**
 * Get knowledge base status
 */
export const getKnowledgeStatusAPI = async (
  endpoint: string,
  agentId: string
): Promise<{
  text_files: number
  pdf_files: number
  vector_count: number
  last_updated: string
}> => {
  const response = await fetch(
    APIRoutes.GetKnowledgeStatus(endpoint, agentId),
    {
      method: 'GET',
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Failed to get knowledge status')
  }

  return response.json()
}

/**
 * Add text content to the knowledge base
 */
export const addContentToKnowledgeBaseAPI = async (
  endpoint: string,
  agentId: string,
  content: string
): Promise<{ message: string }> => {
  const response = await fetch(APIRoutes.AddKnowledge(endpoint, agentId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Failed to add content')
  }

  return response.json()
}
