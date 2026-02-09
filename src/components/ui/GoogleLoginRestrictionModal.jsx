import React from "react"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Shield } from "lucide-react"
import { useModalClose } from "../../hooks/useModalClose"

const GoogleLoginRestrictionModal = ({ isOpen, onClose }) => {
  useModalClose(isOpen, onClose, 'google-login-restriction-modal')
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-backdrop" />
      <Card id="google-login-restriction-modal" className="relative w-full max-w-md mx-4 border-0 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl text-orange-600">Access Restricted</CardTitle>
          <CardDescription>
            Owners do not have access to Google login. Please use email and password to sign in.
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

export default GoogleLoginRestrictionModal