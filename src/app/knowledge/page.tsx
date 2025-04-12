'use client'
import { useState, useEffect } from 'react'
import { usePlaygroundStore } from '@/store'
import { useQueryState } from 'nuqs'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  uploadFileToKnowledgeBaseAPI,
  listKnowledgeFilesAPI,
  getKnowledgeStatusAPI
} from '@/api/knowledge'
import Sidebar from '@/components/playground/Sidebar/Sidebar'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatBytes } from '@/lib/formatUtils'

// File type interface
interface KnowledgeFile {
  name: string
  path: string
  type: string
  size: number
  modified: string
}

// Status interface
interface KnowledgeStatus {
  text_files: number
  pdf_files: number
  vector_count: number
  last_updated: string
}

export default function KnowledgePage() {
  // Get agent ID from URL
  const [agentId] = useQueryState('agent')

  // Get endpoint from store
  const selectedEndpoint = usePlaygroundStore((state) => state.selectedEndpoint)

  // State for files and status
  const [files, setFiles] = useState<KnowledgeFile[]>([])
  const [status, setStatus] = useState<KnowledgeStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('text')

  // Load files and status on mount
  useEffect(() => {
    if (agentId) {
      loadFilesAndStatus()
    }
  }, [agentId, selectedEndpoint, activeTab])

  // Function to load files and status
  const loadFilesAndStatus = async () => {
    if (!agentId) return

    setIsLoading(true)
    try {
      // Load files
      const fileType = activeTab === 'all' ? undefined : activeTab as 'text' | 'pdf'
      const filesResponse = await listKnowledgeFilesAPI(selectedEndpoint, agentId, fileType)
      setFiles(filesResponse.files)

      // Load status
      const statusResponse = await getKnowledgeStatusAPI(selectedEndpoint, agentId)
      setStatus(statusResponse)
    } catch (error) {
      console.error('Error loading knowledge data:', error)
      toast.error('Failed to load knowledge data')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!agentId || !event.target.files || event.target.files.length === 0) return

    const file = event.target.files[0]
    const fileType = activeTab as 'text' | 'pdf'

    // Validate file type
    if (fileType === 'text' && !file.name.endsWith('.txt')) {
      toast.error('Please select a .txt file for text uploads')
      return
    }

    if (fileType === 'pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Please select a .pdf file for PDF uploads')
      return
    }

    setIsUploading(true)
    try {
      await uploadFileToKnowledgeBaseAPI(selectedEndpoint, agentId, file, fileType)
      toast.success(`File ${file.name} uploaded successfully`)
      loadFilesAndStatus() // Reload files and status
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload file')
    } finally {
      setIsUploading(false)
      // Clear the file input
      event.target.value = ''
    }
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
          <h1 className="text-2xl font-bold text-primary">Knowledge Management</h1>
          <Link href="/" passHref>
            <Button variant="outline" size="sm" className="gap-2">
              <Icon type="agent" size="xs" />
              Back to Chat
            </Button>
          </Link>
        </div>

        {/* Status Card */}
        <div className="mb-6 rounded-xl bg-primaryAccent p-4 shadow-md">
          <h2 className="mb-2 text-lg font-semibold text-primary">Knowledge Base Status</h2>
          {status ? (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted">Text Files</p>
                <p className="text-xl font-medium text-primary">{status.text_files}</p>
              </div>
              <div>
                <p className="text-sm text-muted">PDF Files</p>
                <p className="text-xl font-medium text-primary">{status.pdf_files}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Vector Embeddings</p>
                <p className="text-xl font-medium text-primary">{status.vector_count}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted">Loading status...</p>
          )}
        </div>

        {/* Tabs for file types */}
        <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="text">Text Files</TabsTrigger>
            <TabsTrigger value="pdf">PDF Files</TabsTrigger>
            <TabsTrigger value="all">All Files</TabsTrigger>
          </TabsList>

          {/* Text Files Tab */}
          <TabsContent value="text" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">Text Files</h2>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="text-file-upload"
                  accept=".txt"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <label htmlFor="text-file-upload">
                  <Button
                    variant="default"
                    size="sm"
                    className="cursor-pointer"
                    disabled={isUploading}
                    asChild
                  >
                    <span>{isUploading ? 'Uploading...' : 'Upload Text File'}</span>
                  </Button>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadFilesAndStatus}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </div>
            </div>

            {/* File List */}
            <div className="rounded-xl border border-primary/15 bg-primaryAccent">
              {isLoading ? (
                <div className="p-4 text-center text-muted">Loading files...</div>
              ) : files.filter(f => f.type === 'text').length === 0 ? (
                <div className="p-4 text-center text-muted">No text files found</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary/15 text-left">
                      <th className="p-3 text-xs font-medium uppercase text-primary">Name</th>
                      <th className="p-3 text-xs font-medium uppercase text-primary">Size</th>
                      <th className="p-3 text-xs font-medium uppercase text-primary">Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files
                      .filter(file => file.type === 'text')
                      .map((file, index) => (
                        <tr key={index} className="border-b border-primary/10 text-left last:border-0">
                          <td className="p-3 text-sm text-primary">{file.name}</td>
                          <td className="p-3 text-sm text-muted">{formatBytes(file.size)}</td>
                          <td className="p-3 text-sm text-muted">
                            {new Date(file.modified).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* PDF Files Tab */}
          <TabsContent value="pdf" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">PDF Files</h2>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="pdf-file-upload"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <label htmlFor="pdf-file-upload">
                  <Button
                    variant="default"
                    size="sm"
                    className="cursor-pointer"
                    disabled={isUploading}
                    asChild
                  >
                    <span>{isUploading ? 'Uploading...' : 'Upload PDF File'}</span>
                  </Button>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadFilesAndStatus}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </div>
            </div>

            {/* File List */}
            <div className="rounded-xl border border-primary/15 bg-primaryAccent">
              {isLoading ? (
                <div className="p-4 text-center text-muted">Loading files...</div>
              ) : files.filter(f => f.type === 'pdf').length === 0 ? (
                <div className="p-4 text-center text-muted">No PDF files found</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary/15 text-left">
                      <th className="p-3 text-xs font-medium uppercase text-primary">Name</th>
                      <th className="p-3 text-xs font-medium uppercase text-primary">Size</th>
                      <th className="p-3 text-xs font-medium uppercase text-primary">Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files
                      .filter(file => file.type === 'pdf')
                      .map((file, index) => (
                        <tr key={index} className="border-b border-primary/10 text-left last:border-0">
                          <td className="p-3 text-sm text-primary">{file.name}</td>
                          <td className="p-3 text-sm text-muted">{formatBytes(file.size)}</td>
                          <td className="p-3 text-sm text-muted">
                            {new Date(file.modified).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* All Files Tab */}
          <TabsContent value="all" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">All Files</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={loadFilesAndStatus}
                disabled={isLoading}
              >
                Refresh
              </Button>
            </div>

            {/* File List */}
            <div className="rounded-xl border border-primary/15 bg-primaryAccent">
              {isLoading ? (
                <div className="p-4 text-center text-muted">Loading files...</div>
              ) : files.length === 0 ? (
                <div className="p-4 text-center text-muted">No files found</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary/15 text-left">
                      <th className="p-3 text-xs font-medium uppercase text-primary">Name</th>
                      <th className="p-3 text-xs font-medium uppercase text-primary">Type</th>
                      <th className="p-3 text-xs font-medium uppercase text-primary">Size</th>
                      <th className="p-3 text-xs font-medium uppercase text-primary">Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file, index) => (
                      <tr key={index} className="border-b border-primary/10 text-left last:border-0">
                        <td className="p-3 text-sm text-primary">{file.name}</td>
                        <td className="p-3 text-sm text-muted uppercase">{file.type}</td>
                        <td className="p-3 text-sm text-muted">{formatBytes(file.size)}</td>
                        <td className="p-3 text-sm text-muted">
                          {new Date(file.modified).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
