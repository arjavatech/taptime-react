import React from "react"
import Header from "../components/layout/Header"
import Footer from "../components/layout/Footer"

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>
          <div className="prose max-w-none">
            <p className="text-muted-foreground mb-6">
              This Privacy Policy describes how TapTime collects, uses, and protects your information.
            </p>
            <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>
            <p className="mb-4">We collect information you provide directly to us, such as when you create an account or contact us.</p>
            <h2 className="text-xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to provide, maintain, and improve our services.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default PrivacyPolicyPage