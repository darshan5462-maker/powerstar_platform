import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import AuthCard from './AuthCard'
import { Role } from '@/store/authStore'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
  initialRole?: Role
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  initialRole = 'customer'
}: AuthModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md my-8"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-white dark:bg-navy-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center shadow-lg border border-slate-200 dark:border-navy-700 transition-all hover:scale-105"
            aria-label="Close Auth Dialog"
          >
            <X className="w-4 h-4" />
          </button>

          <AuthCard
            initialMode={initialMode}
            initialRole={initialRole}
            isModal={true}
            onSuccess={onClose}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
