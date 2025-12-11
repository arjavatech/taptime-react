import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { CheckCircle, Mail } from 'lucide-react';
import { useModalClose } from '../../hooks/useModalClose';

const RegistrationSuccessModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  
  const handleGoToLogin = () => {
    navigate('/login');
  };
  
  const handleClose = onClose || handleGoToLogin;
  
  // Handle outside click and ESC key
  useModalClose(isOpen, handleClose, 'registration-success-modal')

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm modal-backdrop" onClick={handleClose} />

      {/* Modal */}
      <Card id="registration-success-modal" className="relative z-10 w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Registration Successful!
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4 pt-2">
          <div className="space-y-3">
            <p className="text-gray-700 text-base">
              Your company registration is successful.
            </p>

            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Mail className="h-5 w-5 text-primary" />
              <p className="text-base">
                Please check your email.
              </p>
            </div>

            <p className="text-gray-600 text-sm">
              Set your password through the link in the email.
            </p>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleGoToLogin}
              className="w-full"
              size="lg"
            >
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationSuccessModal;
