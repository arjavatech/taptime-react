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
      <section className="pt-23 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Revolutionary Time Tracking Solution
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Employee Time Tracking
              <span className="text-primary block">Made Effortless</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              A simple, one-tap system to track employee hours with accuracy and ease. Streamline your workforce management and transform the way your team operates.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">{stat.number}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div> */}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Powerful Features for Modern Workplaces
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline your workforce management with our comprehensive time tracking solution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
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