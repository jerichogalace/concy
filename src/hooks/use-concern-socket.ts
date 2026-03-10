'use client'

import { useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useConcernStore } from '@/store/concern-store'
import { Concern, ConcernStatus } from '@/types/concern'

let socket: Socket | null = null
const newConcernCallbacks = new Set<(concern: Concern) => void>()

export function useConcernSocket() {
  const { setConcerns, addConcern, removeConcern, updateStatus } = useConcernStore()
  const callbacksRef = useRef(newConcernCallbacks)

  const connect = useCallback(() => {
    if (!socket) {
      socket = io('/', {
        path: '/',
        query: { XTransformPort: '3003' },
        transports: ['websocket', 'polling'],
      })

      socket.on('connect', () => {
        console.log('Connected to concern service')
        // Request initial data
        socket?.emit('get-counts')
      })

      socket.on('initial-concerns', (data: { concerns: Concern[] }) => {
        // Convert date strings back to Date objects
        const concerns = data.concerns.map(c => ({
          ...c,
          createdAt: new Date(c.createdAt)
        }))
        setConcerns(concerns)
      })

      socket.on('new-concern', (data: { concern: Concern }) => {
        const concern = {
          ...data.concern,
          createdAt: new Date(data.concern.createdAt)
        }
        addConcern(concern)
        // Notify all registered callbacks
        callbacksRef.current.forEach(callback => callback(concern))
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Concern Submitted', {
            body: `${data.concern.fullName}: ${data.concern.concernType}`,
          })
        }
      })

      socket.on('concern-deleted', (data: { id: string }) => {
        removeConcern(data.id)
      })

      socket.on('status-updated', (data: { id: string; status: ConcernStatus }) => {
        updateStatus(data.id, data.status)
      })

      socket.on('counts', (data: { todayCount: number; unreadCount: number; pendingCount: number; completedCount: number }) => {
        // The store will calculate these, but we can use todayCount for display
        console.log('Counts received:', data)
      })

      socket.on('disconnect', () => {
        console.log('Disconnected from concern service')
      })
    }
    return socket
  }, [setConcerns, addConcern, removeConcern, updateStatus])

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }, [])

  const deleteConcern = useCallback((id: string) => {
    if (socket) {
      socket.emit('delete-concern', { id })
    }
  }, [])

  const updateConcernStatus = useCallback((id: string, status: ConcernStatus) => {
    if (socket) {
      socket.emit('update-status', { id, status })
    }
  }, [])

  const markAsPending = useCallback((id: string) => {
    if (socket) {
      socket.emit('mark-pending', { id })
    }
  }, [])

  const getCounts = useCallback(() => {
    if (socket) {
      socket.emit('get-counts')
    }
  }, [])

  const onNewConcern = useCallback((callback: (concern: Concern) => void) => {
    callbacksRef.current.add(callback)
    return () => {
      callbacksRef.current.delete(callback)
    }
  }, [])

  return { connect, disconnect, deleteConcern, updateConcernStatus, markAsPending, getCounts, onNewConcern }
}
