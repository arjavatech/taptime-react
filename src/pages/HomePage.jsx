import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import Header from "../components/layout/Header"
import Footer from "../components/layout/Footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import {
  Clock,
  Users,
  BarChart3,
  Shield,
  Download,
  CheckCircle,
  ArrowRight,
  Zap
} from "lucide-react"

const HomePage = () => {
  const navigate = useNavigate();
  const { session, user } = useAuth();

  // Handle OAuth callback redirect
  useEffect(() => {
    // If user just completed OAuth authentication (has session but no backend data)
    // redirect to login page where the proper OAuth callback handler exists
    if (session && user && !localStorage.getItem('companyID')) {
      console.log('OAuth callback detected on HomePage, redirecting to /login');
      navigate('/login', { replace: true });
    }
  }, [session, user, navigate]);

  const features = [
    {
      icon: Clock,
      title: "Facial Recognition",
      description: "Instantly record work hours with a quick photo—powered by secure, advanced AI.",
      color: "bg-blue-50 text-blue-600"
    },
    {
      icon: Users,
      title: "One Tap Clock In/Out",
      description: "Fast, seamless log-in and log-out with built-in employee identification.",
      color: "bg-green-50 text-green-600"
    },
    {
      icon: BarChart3,
      title: "Timesheet Reports",
      description: "Provides employee time reports at your preferred frequency with detailed analytics.",
      color: "bg-purple-50 text-purple-600"
    },
    {
      icon: Shield,
      title: "Admin Dashboard",
      description: "Comprehensive employee onboarding system for Admins with full control.",
      color: "bg-orange-50 text-orange-600"
    },
    {
      icon: Download,
      title: "Export Options",
      description: "Delivers time reports in multiple formats like CSV and PDF for easy sharing.",
      color: "bg-red-50 text-red-600"
    },
    {
      icon: CheckCircle,
      title: "Validation",
      description: "Admin features to update and validate time entries with approval workflows.",
      color: "bg-teal-50 text-teal-600"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-23 pb-16 px-4 sm:px-6 lg:px-8  ">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Revolutionary Time Tracking Solution
            </div>
            
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight px-2">
              Employee Time Tracking
              <span className="text-primary block">Made Effortless</span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4">
              A simple, one-tap system to track employee hours with accuracy and ease. Streamline your workforce management and transform the way your team operates.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-4">
              <Button size="lg" className="text-base sm:text-lg px-6 py-4 sm:px-8 sm:py-6" onClick={() => navigate('/register')}>
                Get Started Free
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="text-base sm:text-lg px-6 py-4 sm:px-8 sm:py-6">
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
          
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 px-2">
              Powerful Features for Modern Workplaces
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Streamline your workforce management with our comprehensive time tracking solution
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 mx-2 sm:mx-0">
                  <CardHeader className="p-4 sm:p-6">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${feature.color} flex items-center justify-center mb-3 sm:mb-4`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <CardDescription className="text-sm sm:text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default HomePage