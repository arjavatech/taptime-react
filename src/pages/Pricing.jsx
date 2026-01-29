import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, Users, BarChart3, Zap, Shield, Clock,
  ArrowRight, ChevronDown, CheckCircle, Download
} from 'lucide-react';
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

const Pricing = () => {
  const navigate = useNavigate();

  // Features list matching HomePage style
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
  ];

  // Plan features
  const planFeatures = [
    "14-day free trial",
    "Unlimited devices",
    "Real-time employee tracking",
    "Detailed timesheet reports",
    "Multiple employment types",
    "GPS location tracking",
    "Weekly/daily reports",
    "Email notifications",
    "Mobile & web access",
    "Priority support"
  ];

  // FAQ data
  const faqs = [
    {
      question: "How does the pricing work?",
      answer: "We charge $1 per active employee per month. You only pay for employees who are actively using the system. No hidden fees."
    },
    {
      question: "What happens after the free trial?",
      answer: "After 14 days, you'll be charged $1 per employee per month. You can cancel anytime before the trial ends with no charges."
    },
    {
      question: "Can I add or remove employees?",
      answer: "Yes! Your billing automatically adjusts based on your active employee count. Add or remove employees anytime."
    },
    {
      question: "Is there a setup fee?",
      answer: "No setup fees, no contracts, no hidden costs. Just $1 per employee per month."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit and debit cards through our secure Stripe payment system."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel your subscription anytime. No long-term commitments required."
    }
  ];

  const [openFaqIndex, setOpenFaqIndex] = React.useState(null);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-23 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Simple, Transparent Pricing
            </div>
            
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight px-2">
              Pricing That Grows
              <span className="text-primary block">With Your Team</span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4">
              Just $1 per employee per month. No hidden fees, no complicated tiers.
              Choose your preferred option: Start with a 14-day free trial or subscribe directly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-4">
              <Button size="lg" className="text-base sm:text-lg px-6 py-4 sm:px-8 sm:py-6" onClick={() => navigate('/register?trial=true')}>
                Start Free Trial
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="text-base sm:text-lg px-6 py-4 sm:px-8 sm:py-6" onClick={() => navigate('/register?trial=false')}>
                Subscribe Now
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Card Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 mx-2 sm:mx-0">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              {/* Price Display */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
                    $1
                  </span>
                  <span className="text-lg sm:text-xl lg:text-2xl text-muted-foreground ml-2">
                    /employee/month
                  </span>
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-primary font-semibold">
                  14-day free trial included
                </p>
              </div>

              {/* Features List */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 text-center">
                  Everything Included:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {planFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-sm sm:text-base">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Examples */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                <h4 className="font-semibold text-foreground mb-3">Pricing Examples:</h4>
                <div className="space-y-2 text-sm sm:text-base">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">10 employees</span>
                    <span className="font-semibold text-foreground">$10/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">25 employees</span>
                    <span className="font-semibold text-foreground">$25/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">50 employees</span>
                    <span className="font-semibold text-foreground">$50/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">100 employees</span>
                    <span className="font-semibold text-foreground">$100/month</span>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full text-base sm:text-lg py-4 sm:py-6"
                  onClick={() => navigate('/register?trial=true')}
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-base sm:text-lg py-4 sm:py-6"
                  onClick={() => navigate('/register?trial=false')}
                >
                  Subscribe Now
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  Both options: $1 per employee per month
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 px-2">
              Powerful Features for Modern Workplaces
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              All features included in one simple plan. No upgrades, no hidden costs.
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

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 px-2">
              Frequently Asked Questions
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground px-4">
              Have questions? We've got answers.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4 mx-2 sm:mx-0">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base sm:text-lg font-semibold text-foreground pr-4 leading-relaxed">
                      {faq.question}
                    </CardTitle>
                    <ChevronDown className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${
                      openFaqIndex === index ? 'rotate-180' : ''
                    }`} />
                  </div>
                  {openFaqIndex === index && (
                    <CardDescription className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
                      {faq.answer}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
