'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { usePlaygroundStore } from '@/store'
import { useQueryState } from 'nuqs'
import { toast } from 'sonner'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import Sidebar from '@/components/playground/Sidebar/Sidebar'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TextArea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  getDocumentAPI,
  createDocumentAPI,
  updateDocumentAPI,
  Document as DocumentType
} from '@/api/documents'

// Use the Document type from the API

export default function DocumentEditorPage() {
  // Get agent ID from URL
  const [agentId] = useQueryState('agent')
  const [documentId] = useQueryState('document')

  // Get endpoint from store
  const selectedEndpoint = usePlaygroundStore((state) => state.selectedEndpoint)

  // Document state
  const [document, setDocument] = useState<DocumentType>({
    title: '',
    content: ''
  })

  // Router for navigation
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('edit')

  // Refs for autofocus
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Load document if ID is provided
  useEffect(() => {
    if (documentId) {
      loadDocument(documentId)
    } else if (titleInputRef.current) {
      // Focus title input for new documents
      titleInputRef.current.focus()
    }
  }, [documentId, selectedEndpoint])

  // Function to load a document
  const loadDocument = async (id: string) => {
    setIsLoading(true)
    try {
      if (!agentId) {
        toast.error('No agent selected')
        return
      }

      const response = await getDocumentAPI(selectedEndpoint, agentId, id)
      setDocument(response)
    } catch (error) {
      console.error('Error loading document:', error)
      toast.error('Failed to load document')
    } finally {
      setIsLoading(false)
    }
  }

  // Function to save a document
  const saveDocument = async () => {
    if (!document.title.trim()) {
      toast.error('Please enter a title for the document')
      return
    }

    if (!document.content.trim()) {
      toast.error('Please enter some content for the document')
      return
    }

    if (!agentId) {
      toast.error('No agent selected')
      return
    }

    setIsSaving(true)
    try {
      let response: DocumentType

      if (document.id) {
        // Update existing document
        response = await updateDocumentAPI(
          selectedEndpoint,
          agentId,
          document.id,
          {
            title: document.title,
            content: document.content
          }
        )
        toast.success('Document updated successfully')
      } else {
        // Create new document
        response = await createDocumentAPI(
          selectedEndpoint,
          agentId,
          {
            title: document.title,
            content: document.content
          }
        )
        toast.success('Document created successfully')

        // Redirect to the edit page with the new ID
        router.push(`/editor?agent=${agentId}&document=${response.id}`)
      }

      // Update the document state with the response
      setDocument(response)
    } catch (error) {
      console.error('Error saving document:', error)
      toast.error('Failed to save document')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocument(prev => ({ ...prev, title: e.target.value }))
  }

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDocument(prev => ({ ...prev, content: e.target.value }))
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
          <h1 className="text-2xl font-bold text-primary">Document Editor</h1>
          <div className="flex items-center gap-2">
            <Link href={`/editor/list?agent=${agentId}`} passHref>
              <Button variant="outline" size="sm">
                <Icon type="references" size="xs" className="mr-1" />
                All Documents
              </Button>
            </Link>
            <Button
              variant="default"
              size="sm"
              onClick={() => setDocument({ title: '', content: '' })}
              disabled={isLoading || isSaving}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Icon type="plus-icon" size="xs" className="mr-1" />
              New Document
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={saveDocument}
              disabled={isLoading || isSaving}
            >
              <Icon type="save" size="xs" className="mr-1" />
              {isSaving ? 'Saving...' : 'Save Document'}
            </Button>
          </div>
        </div>

        {/* Document Title */}
        <div className="mb-4">
          <Input
            ref={titleInputRef}
            placeholder="Document Title"
            value={document.title}
            onChange={handleTitleChange}
            disabled={isLoading}
            className="text-lg font-semibold"
          />
        </div>

        {/* Edit/Preview Tabs */}
        <Tabs defaultValue="edit" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mb-4 self-start">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Edit Tab */}
          <TabsContent value="edit" className="flex-1 flex flex-col">
            <TextArea
              placeholder="# Start writing your document here..."
              value={document.content}
              onChange={handleContentChange}
              disabled={isLoading}
              className="flex-1 min-h-[calc(100vh-250px)] font-mono text-sm rounded-xl border border-primary/15 bg-primaryAccent p-4 text-primary focus:border-primary/50 resize-none"
            />
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="flex-1">
            <div className="prose prose-sm max-w-none min-h-[calc(100vh-250px)] overflow-auto rounded-xl border border-primary/15 bg-primaryAccent p-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                className="prose-headings:text-primary prose-a:text-blue-500 prose-strong:text-primary prose-code:text-green-500 prose-pre:bg-gray-800 prose-pre:text-gray-100"
              >
                {document.content}
              </ReactMarkdown>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
