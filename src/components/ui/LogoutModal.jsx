import React, { useState } from "react"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { LogOut, AlertTriangle } from "lucide-react"
import { useModalClose } from "../../hooks/useModalClose"

const LogoutModal = ({ isOpen, onClose, onConfirm, userName = "User" }) => {
  const [isLoading, setIsLoading] = useState(false)
  
  // Handle outside click and ESC key
  useModalClose(isOpen, onClose, 'logout-modal')
  
  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsLoading(true)
    await onConfirm()
    setIsLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-backdrop" onClick={onClose} />
      <Card id="logout-modal" className="relative w-full max-w-md mx-4 border-0 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-[#02066F]" />
          </div>
          <CardTitle className="text-xl">Confirm Sign Out</CardTitle>
          <CardDescription>
            Are you sure you want to sign out, {userName}?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-[#02066F] hover:bg-[#030974] text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LogoutModal