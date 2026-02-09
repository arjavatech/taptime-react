import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Loader2, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import tabTimeLogo from "../assets/images/tap-time-logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        if (error === "You are not a user") {
          setError("You are not a user");
        } else {
          setError("Failed to send reset email. Please try again.");
        }
      } else {
        setMessage("Check your email for password reset instructions.");
      }
    } catch (err) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header Navigation */}
      <Header />

      <div className="min-h-screen flex flex-col lg:flex-row pt-16 sm:pt-20 lg:pt-0">
        {/* Left side - Brand section (hidden on mobile and tablet) */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-1/2 bg-[#D9E9FB] flex-col justify-center items-center p-6 lg:p-8 xl:p-12 lg:pt-24 xl:pt-32">
          <div className="w-full max-w-lg flex flex-col items-center text-center space-y-6 lg:space-y-8">
            {/* Brand Logo */}
            <img
              src={tabTimeLogo}
              alt="Tap-Time Logo"
              className="w-32 lg:w-40 xl:w-48 2xl:w-56 mx-auto"
            />
            <div className="space-y-3 lg:space-y-4">
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-800">
                Employee Time Tracking
              </h1>
              <p className="text-base lg:text-lg text-gray-700 leading-relaxed px-4">
                One tap solution for simplifying and streamlining employee time
                logging and reporting.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 lg:gap-6 xl:gap-8 text-gray-600 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Fast</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Reliable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Reset Password form */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20 min-h-[calc(100vh-4rem)] lg:min-h-screen">
          <div className="w-full max-w-sm sm:max-w-md">
            {/* Logo (visible on mobile and tablet only) */}
            <div className="text-center mb-6 sm:mb-8 lg:hidden">
              <img src={tabTimeLogo} alt="TabTime Logo" className="mx-auto h-16 sm:h-20 w-auto" />
            </div>

            <Card className="border-0 shadow-lg sm:shadow-2xl bg-gradient-to-br from-white via-gray-50/50 to-white backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    Reset Password
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="email" className="text-sm sm:text-base">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^a-zA-Z0-9@._-]/g, '');
                          setEmail(value);
                          setError("");
                        }}
                        onKeyPress={(e) => {
                          const allowedChars = /[a-zA-Z0-9@._-]/;
                          if (!allowedChars.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {message && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-green-600">{message}</p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-[#01005a] hover:bg-[#01005a]/90 h-10 sm:h-11 text-sm sm:text-base" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link 
                    to="/login" 
                    className="inline-flex items-center text-xs sm:text-sm text-primary hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Login
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;