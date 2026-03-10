'use client'

import { useCallback, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { VisitorType, ConcernType, Attachment } from '@/types/concern'

let socket: Socket | null = null

interface ConcernSubmissionData {
  fullName: string
  visitorType: VisitorType
  organization: string
  contactNumber: string
  email: string
  concernType: ConcernType
  concernDetails: string
  additionalNotes: string
  attachments: Attachment[]
}

export function useVisitorSocket() {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Connect when the hook is first used
    if (!socketRef.current) {
      socketRef.current = io('/', {
        path: '/',
        query: { XTransformPort: '3003' },
        transports: ['websocket', 'polling'],
      })
      socket = socketRef.current
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
    }
  }, [])

  const submitConcern = useCallback(async (data: ConcernSubmissionData): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        // Try to reconnect
        socketRef.current = io('/', {
          path: '/',
          query: { XTransformPort: '3003' },
          transports: ['websocket', 'polling'],
        })
        socket = socketRef.current
      }

      const currentSocket = socketRef.current

      // Wait for connection if not connected
      if (!currentSocket.connected) {
        currentSocket.once('connect', () => {
          currentSocket.emit('submit-concern', data)
          resolve()
        })
        currentSocket.once('connect_error', (error) => {
          reject(error)
        })
      } else {
        currentSocket.emit('submit-concern', data)
        resolve()
      }
    })
  }, [])

  return { submitConcern }
}
