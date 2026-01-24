import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, Users, BarChart3, Zap, Shield, Clock,
  ArrowRight, HelpCircle, CheckCircle
} from 'lucide-react';
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

const Pricing = () => {
  const navigate = useNavigate();

  // Pricing data
  const pricingPlan = {
    name: "TapTime Per-Employee Plan",
    price: 1,
    trial: 14,
    description: "Simple, transparent pricing that grows with your team"
  };

  // Features list
  const features = [
    { icon: Users, title: "Unlimited Employees", description: "Add as many employees as you need" },
    { icon: Clock, title: "Time Tracking", description: "One-tap clock in/out system" },
    { icon: BarChart3, title: "Detailed Reports", description: "Comprehensive timesheet reports" },
    { icon: Zap, title: "Real-time Updates", description: "Instant sync across all devices" },
    { icon: Shield, title: "Secure & Compliant", description: "Enterprise-grade security" },
    { icon: CheckCircle, title: "All Features Included", description: "No hidden costs or upgrades" }
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
    },
    {
      question: "What's the difference between Free Trial and Subscribe Now?",
      answer: "Both options give you full access to all features at $1 per employee per month. With the Free Trial, you get 14 days free before billing starts. With Subscribe Now, billing starts immediately. Choose the option that works best for you!"
    }
  ];

  const [openFaqIndex, setOpenFaqIndex] = React.useState(null);

  return (
    <>
      <Header />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Zap className="w-4 h-4 mr-1.5" />
                Simple, Transparent Pricing
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Pricing That Grows
                <span className="text-primary block">With Your Team</span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8">
                Just $1 per employee per month. No hidden fees, no complicated tiers.
                Choose your preferred option: Start with a 14-day free trial or subscribe directly.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="text-base sm:text-lg px-6 py-6 sm:px-8"
                  onClick={() => navigate('/register?trial=true')}
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base sm:text-lg px-6 py-6 sm:px-8 border-2"
                  onClick={() => navigate('/register?trial=false')}
                >
                  Subscribe Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Card Section */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary shadow-2xl hover:shadow-3xl transition-shadow">
              <CardHeader className="text-center bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-lg py-8">
                <CardTitle className="text-2xl sm:text-3xl font-bold mb-2">
                  {pricingPlan.name}
                </CardTitle>
                <CardDescription className="text-primary-foreground/90 text-base sm:text-lg">
                  {pricingPlan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="py-8 sm:py-12">
                {/* Price Display */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-5xl sm:text-6xl font-bold text-gray-900">
                      ${pricingPlan.price}
                    </span>
                    <span className="text-xl sm:text-2xl text-gray-600 ml-2">
                      /employee/month
                    </span>
                  </div>
                  <p className="text-base sm:text-lg text-green-600 font-semibold">
                    {pricingPlan.trial}-day free trial included
                  </p>
                </div>

                {/* Features List */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                    Everything Included:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {planFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Example */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-8">
                  <h4 className="font-semibold text-gray-900 mb-3">Pricing Examples:</h4>
                  <div className="space-y-2 text-sm sm:text-base">
                    <div className="flex justify-between">
                      <span className="text-gray-700">10 employees</span>
                      <span className="font-semibold text-gray-900">$10/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">25 employees</span>
                      <span className="font-semibold text-gray-900">$25/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">50 employees</span>
                      <span className="font-semibold text-gray-900">$50/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">100 employees</span>
                      <span className="font-semibold text-gray-900">$100/month</span>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full text-base sm:text-lg py-6"
                    onClick={() => navigate('/register?trial=true')}
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full text-base sm:text-lg py-6 border-2"
                    onClick={() => navigate('/register?trial=false')}
                  >
                    Subscribe Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Both options: $1 per employee per month
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Grid Section */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Everything You Need
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                All features included in one simple plan. No upgrades, no hidden costs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="border-0 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                Have questions? We've got answers.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card
                  key={index}
                  className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                >
                  <CardHeader className="py-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 pr-4">
                        {faq.question}
                      </CardTitle>
                      <HelpCircle className={`w-5 h-5 text-primary flex-shrink-0 transition-transform ${
                        openFaqIndex === index ? 'rotate-180' : ''
                      }`} />
                    </div>
                    {openFaqIndex === index && (
                      <CardDescription className="text-sm sm:text-base text-gray-700 mt-3">
                        {faq.answer}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-primary/80">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-8">
              Join hundreds of companies already using TapTime to track employee time.
              Start your 14-day free trial today.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-base sm:text-lg px-8 py-6"
              onClick={() => navigate('/register')}
            >
              Start Free Trial Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-white/80 mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
};

export default Pricing;
