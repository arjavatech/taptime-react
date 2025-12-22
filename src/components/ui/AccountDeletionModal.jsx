import React from "react"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { AlertTriangle } from "lucide-react"
import { useModalClose } from "../../hooks/useModalClose"

const AccountDeletionModal = ({ isOpen, onClose, accountType = "Account" }) => {
  useModalClose(isOpen, onClose, 'account-deletion-modal')
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-backdrop" />
      <Card id="account-deletion-modal" className="relative w-full max-w-md mx-4 border-0 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-600">Account Deleted</CardTitle>
          <CardDescription>
            Your {accountType} account has been deleted. You will be logged out automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onClose}
            className="w-full bg-[#02066F] hover:bg-[#030974] text-white"
          >
            OK
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default AccountDeletionModal