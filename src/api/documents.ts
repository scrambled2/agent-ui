// src/api/documents.ts - API functions for document management

import { APIRoutes } from './routes'

// Document interface
export interface Document {
  id?: string
  title: string
  content: string
  created_at?: string
  updated_at?: string
}

/**
 * List all documents
 */
export const listDocumentsAPI = async (
  endpoint: string,
  agentId: string
): Promise<{ documents: Document[] }> => {
  const response = await fetch(
    APIRoutes.ListDocuments(endpoint, agentId),
    {
      method: 'GET',
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Failed to list documents')
  }

  return response.json()
}

/**
 * Get a specific document
 */
export const getDocumentAPI = async (
  endpoint: string,
  agentId: string,
  documentId: string
): Promise<Document> => {
  const response = await fetch(
    APIRoutes.GetDocument(endpoint, agentId, documentId),
    {
      method: 'GET',
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Failed to get document')
  }

  return response.json()
}

/**
 * Create a new document
 */
export const createDocumentAPI = async (
  endpoint: string,
  agentId: string,
  document: { title: string; content: string }
): Promise<Document> => {
  const response = await fetch(
    APIRoutes.CreateDocument(endpoint, agentId),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(document),
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Failed to create document')
  }

  return response.json()
}

/**
 * Update an existing document
 */
export const updateDocumentAPI = async (
  endpoint: string,
  agentId: string,
  documentId: string,
  document: { title: string; content: string }
): Promise<Document> => {
  const response = await fetch(
    APIRoutes.UpdateDocument(endpoint, agentId, documentId),
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(document),
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Failed to update document')
  }

  return response.json()
}

/**
 * Delete a document
 */
export const deleteDocumentAPI = async (
  endpoint: string,
  agentId: string,
  documentId: string
): Promise<{ message: string }> => {
  const response = await fetch(
    APIRoutes.DeleteDocument(endpoint, agentId, documentId),
    {
      method: 'DELETE',
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Failed to delete document')
  }

  return response.json()
}
