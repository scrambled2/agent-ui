'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePlaygroundStore } from '@/store'
import { useQueryState } from 'nuqs'
import { toast } from 'sonner'
import Link from 'next/link'
import Sidebar from '@/components/playground/Sidebar/Sidebar'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import {
  listDocumentsAPI,
  deleteDocumentAPI,
  Document
} from '@/api/documents'

export default function DocumentListPage() {
  // Get agent ID from URL
  const [agentId] = useQueryState('agent')

  // Get endpoint from store
  const selectedEndpoint = usePlaygroundStore((state) => state.selectedEndpoint)

  // Router for navigation
  const router = useRouter()

  // State
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Load documents on mount
  useEffect(() => {
    if (agentId) {
      loadDocuments()
    }
  }, [agentId, selectedEndpoint])

  // Function to load documents
  const loadDocuments = async () => {
    if (!agentId) return

    setIsLoading(true)
    try {
      const response = await listDocumentsAPI(selectedEndpoint, agentId)
      setDocuments(response.documents)
    } catch (error) {
      console.error('Error loading documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }

  // Function to delete a document
  const deleteDocument = async (documentId: string) => {
    if (!agentId) return

    setIsDeleting(documentId)
    try {
      await deleteDocumentAPI(selectedEndpoint, agentId, documentId)
      toast.success('Document deleted successfully')

      // Remove the document from the list
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    } finally {
      setIsDeleting(null)
    }
  }

  // Function to create a new document
  const createNewDocument = () => {
    router.push(`/editor?agent=${agentId}`)
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Render loading state
  if (!agentId) {
    return (
      <div className="flex h-screen bg-background/80">
        <Sidebar />
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-primary">Please select an agent first</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background/80">
      <Sidebar />
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Documents</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={createNewDocument}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Icon type="plus-icon" size="xs" className="mr-1" />
              New Document
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDocuments}
              disabled={isLoading}
            >
              <Icon type="refresh" size="xs" className="mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Documents List */}
        <div className="rounded-xl border border-primary/15 bg-primaryAccent">
          {isLoading ? (
            <div className="p-4 text-center text-muted">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="p-4 text-center text-muted">
              <p>No documents found</p>
              <Button
                variant="link"
                onClick={createNewDocument}
                className="mt-2"
              >
                Create your first document
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/15 text-left">
                  <th className="p-3 text-xs font-medium uppercase text-primary">Title</th>
                  <th className="p-3 text-xs font-medium uppercase text-primary">Created</th>
                  <th className="p-3 text-xs font-medium uppercase text-primary">Updated</th>
                  <th className="p-3 text-xs font-medium uppercase text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-primary/10 text-left last:border-0">
                    <td className="p-3 text-sm text-primary">{doc.title}</td>
                    <td className="p-3 text-sm text-muted">
                      {doc.created_at ? formatDate(doc.created_at) : 'N/A'}
                    </td>
                    <td className="p-3 text-sm text-muted">
                      {doc.updated_at ? formatDate(doc.updated_at) : 'N/A'}
                    </td>
                    <td className="p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Link href={`/editor?agent=${agentId}&document=${doc.id}`} passHref>
                          <Button variant="ghost" size="sm">
                            <Icon type="edit" size="xs" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDocument(doc.id!)}
                          disabled={isDeleting === doc.id}
                        >
                          <Icon type="trash" size="xs" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
