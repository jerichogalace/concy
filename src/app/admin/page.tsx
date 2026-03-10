'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Building2, 
  LogOut, 
  Search, 
  Calendar,
  Trash2,
  Eye,
  BellRing,
  X,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Lock,
  CheckCircle2,
  Clock,
  Inbox,
  CheckCircle,
  CalendarDays,
  Loader2,
  UserCircle,
  Image as ImageIcon,
  Paperclip,
  ExternalLink,
  Download,
  Link2,
  Settings,
  KeyRound,
  MailCheck,
  ArrowLeft
} from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { useConcernStore } from '@/store/concern-store'
import { useConcernSocket } from '@/hooks/use-concern-socket'
import { Concern, ConcernType, ConcernStatus, VisitorType, Attachment, AttachmentType } from '@/types/concern'
import { format } from 'date-fns'
import Link from 'next/link'

const concernTypeColors: Record<ConcernType, string> = {
  'Inquiry': 'bg-blue-100 text-blue-800',
  'Complaint': 'bg-red-100 text-red-800',
  'Request': 'bg-green-100 text-green-800',
  'Follow-up': 'bg-yellow-100 text-yellow-800',
  'Other': 'bg-gray-100 text-gray-800',
}

const statusColors: Record<ConcernStatus, string> = {
  'Unread': 'bg-amber-100 text-amber-800 border-amber-300',
  'Pending': 'bg-sky-100 text-sky-800 border-sky-300',
  'Completed': 'bg-emerald-100 text-emerald-800 border-emerald-300',
}

const visitorTypeColors: Record<VisitorType, string> = {
  'PCIEERD Employee': 'bg-purple-100 text-purple-800 border-purple-200',
  'DOST Employee (Other Unit)': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Executive / Management': 'bg-amber-100 text-amber-800 border-amber-200',
  'Government Agency': 'bg-teal-100 text-teal-800 border-teal-200',
  'Private Organization / Company': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Researcher / Partner Institution': 'bg-lime-100 text-lime-800 border-lime-200',
  'Student / Intern': 'bg-pink-100 text-pink-800 border-pink-200',
  'Contractor / Supplier': 'bg-orange-100 text-orange-800 border-orange-200',
  'Visitor / Walk-in Client': 'bg-sky-100 text-sky-800 border-sky-200',
  'Other': 'bg-gray-100 text-gray-800 border-gray-200',
}

// Attachment type colors
const attachmentTypeColors: Record<AttachmentType, string> = {
  'image': 'bg-purple-100 text-purple-800 border-purple-200',
  'file': 'bg-blue-100 text-blue-800 border-blue-200',
  'link': 'bg-green-100 text-green-800 border-green-200',
}

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Image Viewer Dialog Component
function ImageViewerDialog({ 
  isOpen, 
  onClose, 
  imageUrl, 
  imageName 
}: { 
  isOpen: boolean
  onClose: () => void
  imageUrl: string | null
  imageName: string 
}) {
  const handleDownload = () => {
    if (!imageUrl) return
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = imageName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!imageUrl) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-base truncate flex-1">{imageName}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center">
          <img
            src={imageUrl}
            alt={imageName}
            className="max-w-full max-h-[70vh] object-contain rounded shadow-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Mobile Card Component for each concern
function ConcernMobileCard({ 
  concern, 
  isNew, 
  onViewDetails, 
  onMarkCompleted, 
  onDelete,
  onImageView
}: { 
  concern: Concern
  isNew: boolean
  onViewDetails: (concern: Concern) => void
  onMarkCompleted: (id: string) => void
  onDelete: (id: string) => void
  onImageView: (url: string, name: string) => void
}) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <Card className={`${isNew ? 'bg-green-50 animate-in fade-in duration-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge 
                variant="outline"
                className={`${statusColors[concern.status]} font-medium text-xs`}
              >
                {concern.status === 'Unread' && <Clock className="h-3 w-3 mr-1" />}
                {concern.status === 'Pending' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                {concern.status === 'Completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {concern.status}
              </Badge>
              <Badge className={`${concernTypeColors[concern.concernType]} text-xs`}>
                {concern.concernType}
              </Badge>
            </div>
            <p className="font-medium text-base truncate">{concern.fullName}</p>
          </div>
        </div>
        
        <div className="space-y-1 text-sm text-gray-600 mb-3">
          <p className="text-xs">{concern.dateSubmitted} • {concern.timeSubmitted}</p>
          {concern.organization && (
            <p className="truncate text-xs">{concern.organization}</p>
          )}
        </div>

        <div className="flex gap-2">
          {/* View Details Dialog */}
          <Dialog open={detailsOpen} onOpenChange={(open) => setDetailsOpen(open)}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 h-10 text-sm touch-manipulation"
                onClick={() => onViewDetails(concern)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
              <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
                <DialogTitle className="text-lg">Concern Details</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline"
                    className={`${statusColors[concern.status]} font-medium`}
                  >
                    {concern.status === 'Unread' && <Clock className="h-3 w-3 mr-1" />}
                    {concern.status === 'Pending' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {concern.status === 'Completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {concern.status}
                  </Badge>
                </div>
                
                {/* Info Grid */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Full Name</Label>
                    <p className="font-medium text-sm break-words">{concern.fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide flex items-center gap-1">
                      <UserCircle className="h-3 w-3" />
                      Visitor Type
                    </Label>
                    <Badge className={`${visitorTypeColors[concern.visitorType]} text-xs`} variant="outline">
                      {concern.visitorType}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Organization</Label>
                    <p className="font-medium text-sm break-words">{concern.organization || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Contact Number</Label>
                    <p className="font-medium text-sm break-words">{concern.contactNumber || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Email</Label>
                    <p className="font-medium text-sm break-all">{concern.email || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Concern Type</Label>
                    <Badge className={concernTypeColors[concern.concernType]}>
                      {concern.concernType}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Date & Time Submitted</Label>
                    <p className="font-medium text-sm">{concern.dateSubmitted} at {concern.timeSubmitted}</p>
                  </div>
                </div>
                
                {/* Concern Details */}
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs uppercase tracking-wide flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Concern Details
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-md border max-h-60 overflow-y-auto space-y-3">
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {concern.concernDetails}
                    </p>
                    
                    {/* Attachments inside concern details */}
                    {concern.attachments && concern.attachments.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          Attachments ({concern.attachments.length})
                        </p>
                        <div className="space-y-2">
                          {concern.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className={`flex items-center gap-2 p-2 rounded border bg-white ${attachmentTypeColors[attachment.type]}`}
                            >
                              {attachment.type === 'image' && (
                                <div 
                                  className="w-12 h-12 rounded overflow-hidden bg-gray-100 shrink-0 cursor-pointer hover:ring-2 hover:ring-purple-400"
                                  onClick={() => onImageView(attachment.url, attachment.name)}
                                >
                                  <img
                                    src={attachment.url}
                                    alt={attachment.name || 'Attachment image'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              {attachment.type === 'file' && (
                                <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                              )}
                              {attachment.type === 'link' && (
                                <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center shrink-0">
                                  <Link2 className="h-4 w-4 text-green-600" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{attachment.name}</p>
                                {attachment.size && (
                                  <p className="text-[10px] opacity-70">{formatFileSize(attachment.size)}</p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 shrink-0"
                                onClick={() => {
                                  if (attachment.type === 'link') {
                                    window.open(attachment.url, '_blank')
                                  } else if (attachment.type === 'image') {
                                    onImageView(attachment.url, attachment.name)
                                  } else {
                                    const link = document.createElement('a')
                                    link.href = attachment.url
                                    link.download = attachment.name
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                  }
                                }}
                              >
                                {attachment.type === 'link' ? (
                                  <ExternalLink className="h-3 w-3" />
                                ) : attachment.type === 'image' ? (
                                  <Eye className="h-3 w-3" />
                                ) : (
                                  <Download className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Additional Notes */}
                {concern.additionalNotes && (
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Additional Notes
                    </Label>
                    <div className="p-3 bg-gray-50 rounded-md border max-h-40 overflow-y-auto">
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {concern.additionalNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons Footer */}
              {(concern.status === 'Unread' || concern.status === 'Pending') && (
                <div className="px-4 py-3 border-t bg-gray-50 shrink-0">
                  <Button
                    onClick={() => {
                      onMarkCompleted(concern.id)
                      setDetailsOpen(false)
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 touch-manipulation"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Mark Completed Button */}
          {(concern.status === 'Unread' || concern.status === 'Pending') && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 text-emerald-600 border-emerald-200 hover:bg-emerald-50 touch-manipulation"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-lg">Mark as Completed</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    Mark concern from <strong>{concern.fullName}</strong> as completed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onMarkCompleted(concern.id)}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                  >
                    Mark Completed
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline"
                size="sm"
                className="h-10 px-3 text-red-500 border-red-200 hover:bg-red-50 touch-manipulation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[90vw]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg">Delete Concern</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  Delete concern from <strong>{concern.fullName}</strong>? This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(concern.id)}
                  className="w-full sm:w-auto bg-red-500 hover:bg-red-600"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedConcern, setSelectedConcern] = useState<Concern | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  const [newConcernData, setNewConcernData] = useState<Concern | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null)
  
  // Password change states
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [changePasswordStep, setChangePasswordStep] = useState<'email' | 'verify' | 'success'>('email')
  const [adminEmail, setAdminEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false)
  const [passwordChangeError, setPasswordChangeError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const { isAuthenticated, login, logout, setPassword: setStorePassword } = useAdminStore()
  const { concerns, todayCount, totalCount, unreadCount, pendingCount, completedCount, statusFilter, setStatusFilter, updateStatus } = useConcernStore()
  const { connect, disconnect, deleteConcern, updateConcernStatus, markAsPending, getCounts, onNewConcern } = useConcernSocket()

  // Handle image view
  const handleImageView = useCallback((url: string, name: string) => {
    setViewingImage({ url, name })
    setImageViewerOpen(true)
  }, [])

  // Send verification code
  const handleSendVerificationCode = async () => {
    setPasswordChangeError('')
    
    if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      setPasswordChangeError('Please enter a valid email address')
      return
    }
    
    setPasswordChangeLoading(true)
    
    try {
      const response = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setChangePasswordStep('verify')
        setResendCooldown(60)
        
        // Start cooldown timer
        const timer = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        
        // In development, show the code
        if (data.devCode) {
          console.log('Dev verification code:', data.devCode)
          alert(`Verification code: ${data.devCode}`)
        }
      } else {
        setPasswordChangeError(data.message || 'Failed to send verification code')
      }
    } catch (err) {
      setPasswordChangeError('An error occurred. Please try again.')
    } finally {
      setPasswordChangeLoading(false)
    }
  }

  // Change password
  const handleChangePassword = async () => {
    setPasswordChangeError('')
    
    if (!verificationCode || verificationCode.length !== 6) {
      setPasswordChangeError('Please enter the 6-digit verification code')
      return
    }
    
    if (!newPassword || newPassword.length < 8) {
      setPasswordChangeError('Password must be at least 8 characters')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordChangeError('Passwords do not match')
      return
    }
    
    setPasswordChangeLoading(true)
    
    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          verificationCode,
          newPassword
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStorePassword(newPassword)
        setChangePasswordStep('success')
      } else {
        setPasswordChangeError(data.message || 'Failed to change password')
      }
    } catch (err) {
      setPasswordChangeError('An error occurred. Please try again.')
    } finally {
      setPasswordChangeLoading(false)
    }
  }

  // Reset password change dialog
  const resetPasswordChange = () => {
    setChangePasswordStep('email')
    setAdminEmail('')
    setVerificationCode('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordChangeError('')
    setResendCooldown(0)
  }

  // Handle new concern notification
  const handleNewConcern = useCallback((concern: Concern) => {
    setNewConcernData(concern)
    setShowNotification(true)
    const timer = setTimeout(() => {
      setShowNotification(false)
      setNewConcernData(null)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      connect()
      getCounts()
      
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }

      // Register callback for new concerns
      const unsubscribe = onNewConcern(handleNewConcern)

      return () => {
        disconnect()
        unsubscribe()
      }
    }
  }, [isAuthenticated, connect, disconnect, getCounts, onNewConcern, handleNewConcern])

  // Handle viewing concern details - mark as pending if unread
  const handleViewDetails = useCallback((concern: Concern) => {
    setSelectedConcern(concern)
    setDetailsOpen(true)
    // If the concern is unread, mark it as pending
    if (concern.status === 'Unread') {
      markAsPending(concern.id)
      updateStatus(concern.id, 'Pending')
    }
  }, [markAsPending, updateStatus])

  // Filter concerns based on search, date, and status
  const filteredConcerns = useMemo(() => {
    return concerns.filter(concern => {
      const matchesSearch = searchQuery === '' || 
        concern.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.concernDetails.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.concernType.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesDate = selectedDate === '' || 
        concern.dateSubmitted === format(new Date(selectedDate), 'MM/dd/yyyy')

      const matchesStatus = statusFilter === 'All' || concern.status === statusFilter

      return matchesSearch && matchesDate && matchesStatus
    })
  }, [concerns, searchQuery, selectedDate, statusFilter])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    await new Promise(resolve => setTimeout(resolve, 500))

    const success = login(password)
    if (!success) {
      setError('Invalid password. Please try again.')
    }
    setIsLoading(false)
  }

  const handleLogout = () => {
    logout()
    setPassword('')
    setError('')
  }

  const handleDelete = (id: string) => {
    deleteConcern(id)
  }

  const handleMarkCompleted = (id: string) => {
    updateConcernStatus(id, 'Completed')
    updateStatus(id, 'Completed')
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedDate('')
    setStatusFilter('All')
  }

  // Handle card click for quick filtering
  const handleCardClick = (filter: ConcernStatus | 'Today' | 'All') => {
    if (filter === 'Today') {
      setStatusFilter('All')
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
    } else if (filter === 'All') {
      setStatusFilter('All')
      setSelectedDate('')
    } else {
      setStatusFilter(filter)
      setSelectedDate('')
    }
  }

  // Check if concern is new (highlight effect)
  const isNewConcern = (concern: Concern) => {
    return newConcernData?.id === concern.id
  }

  // Login View
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col safe-area-inset">
        <header className="bg-sky-700 text-white py-3 sm:py-4 px-4 shadow-lg sticky top-0">
          <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
            <Building2 className="h-5 w-5 sm:h-8 sm:w-8 shrink-0" />
            <div>
              <h1 className="text-base sm:text-xl font-bold">DOST - PCIEERD (EUSTDD)</h1>
              <p className="text-[10px] sm:text-sm text-sky-100">Admin Portal</p>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 pb-safe">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center px-4 sm:px-6">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-sky-100 p-3">
                  <Lock className="h-8 w-8 text-sky-700" />
                </div>
              </div>
              <CardTitle className="text-xl">Admin Login</CardTitle>
              <CardDescription className="text-sm">
                Enter your password to access the admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-base rounded-lg"
                    autoFocus
                  />
                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base bg-sky-700 hover:bg-sky-800 rounded-lg touch-manipulation"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
              
              {/* Back to Form Link */}
              <div className="text-center mt-4">
                <Link href="/" className="text-sm text-sky-700 hover:text-sky-800 underline flex items-center justify-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Visitor Form
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>

        <footer className="bg-gray-100 border-t py-3 sm:py-4 px-4 text-center text-[10px] sm:text-xs text-gray-500 pb-safe">
          <p>© {new Date().getFullYear()} DOST - PCIEERD (EUSTDD). All rights reserved.</p>
        </footer>
      </div>
    )
  }

  // Dashboard View
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col safe-area-inset">
      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-16 left-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300 sm:left-auto sm:right-4 sm:max-w-sm">
          <Card className="border-green-200 bg-green-50 shadow-lg">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <BellRing className="h-5 w-5 text-green-600 animate-pulse shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-green-800 text-sm">New Concern Received!</p>
                <p className="text-xs text-green-600 truncate">Check the dashboard for details</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNotification(false)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <header className="bg-sky-700 text-white py-2 sm:py-3 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Building2 className="h-5 w-5 sm:h-7 sm:w-7 shrink-0" />
            <div>
              <h1 className="text-sm sm:text-lg font-bold leading-tight">DOST - PCIEERD (EUSTDD)</h1>
              <p className="text-[10px] sm:text-xs text-sky-100">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Settings Button */}
            <Dialog open={settingsOpen} onOpenChange={(open) => {
              setSettingsOpen(open)
              if (!open) resetPasswordChange()
            }}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-transparent border-white text-white hover:bg-white/10 h-9 touch-manipulation"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-sky-700" />
                    Change Password
                  </DialogTitle>
                </DialogHeader>
                
                {/* Step 1: Enter Email */}
                {changePasswordStep === 'email' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Admin Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="Enter your email address"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="h-11"
                      />
                      <p className="text-xs text-gray-500">
                        A 6-digit verification code will be sent to this email.
                      </p>
                    </div>
                    
                    {passwordChangeError && (
                      <p className="text-sm text-red-500">{passwordChangeError}</p>
                    )}
                    
                    <Button
                      onClick={handleSendVerificationCode}
                      disabled={passwordChangeLoading}
                      className="w-full h-11 bg-sky-700 hover:bg-sky-800"
                    >
                      {passwordChangeLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Verification Code
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Step 2: Verify Code & New Password */}
                {changePasswordStep === 'verify' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                      <MailCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Code sent!</p>
                        <p className="text-xs text-green-600">Check your email: {adminEmail}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="verification-code">Verification Code</Label>
                      <Input
                        id="verification-code"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="h-11 text-center text-lg tracking-widest"
                        maxLength={6}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password (min 8 characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    
                    {passwordChangeError && (
                      <p className="text-sm text-red-500">{passwordChangeError}</p>
                    )}
                    
                    <Button
                      onClick={handleChangePassword}
                      disabled={passwordChangeLoading}
                      className="w-full h-11 bg-sky-700 hover:bg-sky-800"
                    >
                      {passwordChangeLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleSendVerificationCode}
                      disabled={resendCooldown > 0 || passwordChangeLoading}
                      className="w-full h-11"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </Button>
                  </div>
                )}
                
                {/* Step 3: Success */}
                {changePasswordStep === 'success' && (
                  <div className="text-center py-6">
                    <div className="flex justify-center mb-4">
                      <div className="rounded-full bg-green-100 p-3">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-green-700 mb-2">Password Changed!</h3>
                    <p className="text-sm text-gray-600 mb-4">Your password has been successfully updated.</p>
                    <Button
                      onClick={() => setSettingsOpen(false)}
                      className="bg-sky-700 hover:bg-sky-800"
                    >
                      Done
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="bg-transparent border-white text-white hover:bg-white/10 h-9 touch-manipulation"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCardClick('Today')}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Today</p>
                    <p className="text-lg sm:text-2xl font-bold text-sky-700">{todayCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCardClick('All')}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Total</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-700">{totalCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCardClick('Unread')}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Unread</p>
                    <p className="text-lg sm:text-2xl font-bold text-amber-700">{unreadCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCardClick('Pending')}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Pending</p>
                    <p className="text-lg sm:text-2xl font-bold text-sky-700">{pendingCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow col-span-2 sm:col-span-1"
              onClick={() => handleCardClick('Completed')}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Completed</p>
                    <p className="text-lg sm:text-2xl font-bold text-emerald-700">{completedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, organization, details..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
                
                {/* Date Filter */}
                <div className="relative sm:w-44">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
                
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ConcernStatus | 'All')}>
                  <SelectTrigger className="h-10 sm:w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Unread">Unread</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Clear Filters */}
                {(searchQuery || selectedDate || statusFilter !== 'All') && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Concerns List - Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {filteredConcerns.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No concerns found</p>
                </CardContent>
              </Card>
            ) : (
              filteredConcerns.map((concern) => (
                <ConcernMobileCard
                  key={concern.id}
                  concern={concern}
                  isNew={isNewConcern(concern)}
                  onViewDetails={handleViewDetails}
                  onMarkCompleted={handleMarkCompleted}
                  onDelete={handleDelete}
                  onImageView={handleImageView}
                />
              ))
            )}
          </div>

          {/* Concerns List - Desktop Table */}
          <Card className="hidden sm:block">
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-380px)]">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead className="w-[180px]">Name</TableHead>
                      <TableHead className="w-[150px]">Visitor Type</TableHead>
                      <TableHead className="w-[100px]">Concern Type</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[120px]">Date</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConcerns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No concerns found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredConcerns.map((concern) => (
                        <TableRow 
                          key={concern.id}
                          className={isNewConcern(concern) ? 'bg-green-50 animate-in fade-in duration-500' : ''}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{concern.fullName}</p>
                              {concern.organization && (
                                <p className="text-xs text-gray-500 truncate max-w-[180px]">{concern.organization}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${visitorTypeColors[concern.visitorType]} text-xs`} variant="outline">
                              {concern.visitorType.length > 20 ? concern.visitorType.substring(0, 20) + '...' : concern.visitorType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${concernTypeColors[concern.concernType]} text-xs`}>
                              {concern.concernType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={`${statusColors[concern.status]} text-xs`}
                            >
                              {concern.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{concern.dateSubmitted}</p>
                              <p className="text-xs text-gray-500">{concern.timeSubmitted}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {/* View Details */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleViewDetails(concern)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Concern Details</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label className="text-xs text-gray-500">Name</Label>
                                        <p className="font-medium text-sm">{concern.fullName}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">Visitor Type</Label>
                                        <p className="text-sm">{concern.visitorType}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">Organization</Label>
                                        <p className="text-sm">{concern.organization || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">Contact</Label>
                                        <p className="text-sm">{concern.contactNumber || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">Email</Label>
                                        <p className="text-sm break-all">{concern.email || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">Concern Type</Label>
                                        <Badge className={concernTypeColors[concern.concernType]}>
                                          {concern.concernType}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-500">Concern Details</Label>
                                      <div className="p-3 bg-gray-50 rounded-md border mt-1 max-h-40 overflow-y-auto">
                                        <p className="text-sm whitespace-pre-wrap">{concern.concernDetails}</p>
                                      </div>
                                    </div>
                                    {concern.attachments && concern.attachments.length > 0 && (
                                      <div>
                                        <Label className="text-xs text-gray-500 flex items-center gap-1">
                                          <Paperclip className="h-3 w-3" />
                                          Attachments ({concern.attachments.length})
                                        </Label>
                                        <div className="space-y-2 mt-2">
                                          {concern.attachments.map((attachment) => (
                                            <div
                                              key={attachment.id}
                                              className={`flex items-center gap-2 p-2 rounded border ${attachmentTypeColors[attachment.type]}`}
                                            >
                                              {attachment.type === 'image' && (
                                                <div 
                                                  className="w-10 h-10 rounded overflow-hidden bg-gray-100 shrink-0 cursor-pointer"
                                                  onClick={() => handleImageView(attachment.url, attachment.name)}
                                                >
                                                  <img src={attachment.url} alt={attachment.name} className="w-full h-full object-cover" />
                                                </div>
                                              )}
                                              {attachment.type === 'file' && <FileText className="h-5 w-5 text-blue-600" />}
                                              {attachment.type === 'link' && <Link2 className="h-5 w-5 text-green-600" />}
                                              <span className="text-xs flex-1 truncate">{attachment.name}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {concern.additionalNotes && (
                                      <div>
                                        <Label className="text-xs text-gray-500">Additional Notes</Label>
                                        <div className="p-3 bg-gray-50 rounded-md border mt-1">
                                          <p className="text-sm whitespace-pre-wrap">{concern.additionalNotes}</p>
                                        </div>
                                      </div>
                                    )}
                                    {(concern.status === 'Unread' || concern.status === 'Pending') && (
                                      <Button
                                        onClick={() => handleMarkCompleted(concern.id)}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Mark as Completed
                                      </Button>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              {/* Mark Completed */}
                              {(concern.status === 'Unread' || concern.status === 'Pending') && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Mark as Completed?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Mark concern from {concern.fullName} as completed?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleMarkCompleted(concern.id)}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                      >
                                        Mark Completed
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                              
                              {/* Delete */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Concern?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Delete concern from {concern.fullName}? This cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(concern.id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={viewingImage?.url || null}
        imageName={viewingImage?.name || ''}
      />

      {/* Footer */}
      <footer className="bg-gray-100 border-t py-3 sm:py-4 px-4 text-center text-[10px] sm:text-xs text-gray-500">
        <p>© {new Date().getFullYear()} DOST - PCIEERD (EUSTDD). All rights reserved.</p>
      </footer>
    </div>
  )
}
