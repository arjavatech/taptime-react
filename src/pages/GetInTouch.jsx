import React, { useState } from "react"
import Header from "../components/layout/Header"
import Footer from "../components/layout/Footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'

const GetInTouch = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    message: ""
  })
  const [loading, setLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState("")
  const [submitError, setSubmitError] = useState("")

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Auto-capitalize first character for text fields (exclude email)
    let processedValue = value
    const emailFields = ['email']

    if (!emailFields.includes(name) && processedValue.length > 0) {
      processedValue = processedValue.charAt(0).toUpperCase() + processedValue.slice(1)
    }

    setFormData({
      ...formData,
      [name]: processedValue
    })
  }

  const handlePhoneChange = (phone) => {
    setFormData({
      ...formData,
      phone: phone
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitSuccess("")
    setSubmitError("")
    setLoading(true)

    try {
      // Simulate form submission - you can add actual API call here
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log("Form submitted:", formData)

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        message: ""
      })

      setSubmitSuccess("Message sent successfully!")
      setTimeout(() => setSubmitSuccess(""), 3000)
    } catch (error) {
      console.error("Error submitting form:", error)
      setSubmitError("Failed to send message. Please try again.")
      setTimeout(() => setSubmitError(""), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />


      {/* Contact Section */}
      <section className="pt-24 pb-12 sm:pb-16 lg:pb-20 px-3 sm:px-6 lg:px-8 flex-grow bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-3 sm:mb-4 lg:mb-6 px-2">
              Get in Touch
            </h2>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed">
              Ready to transform your time tracking? Contact us today and discover how our solution can streamline your workforce management.
            </p>
          </div>

          <Card className="border-0 shadow-xl max-w-4xl mx-auto">
            <CardHeader className="bg-primary text-primary-foreground rounded-t-xl p-4 sm:p-6 lg:p-8">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl">Send us a message</CardTitle>
              <CardDescription className="text-primary-foreground/80 text-sm sm:text-base">
                We'll get back to you within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="firstName" className="text-xs sm:text-sm font-medium">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                      className="text-sm sm:text-base h-9 sm:h-10 lg:h-11"
                      required
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="lastName" className="text-xs sm:text-sm font-medium">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                      className="text-sm sm:text-base h-9 sm:h-10 lg:h-11"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="email" className="text-xs sm:text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      className="text-sm sm:text-base h-9 sm:h-10 lg:h-11"
                      required
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="phone" className="text-xs sm:text-sm font-medium">Phone</Label>
                    <PhoneInput
                      defaultCountry="us"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      disableDialCodePrefill={false}
                      forceDialCode={true}
                      inputClassName="w-full"
                      style={{
                        '--react-international-phone-border-radius': '0.375rem',
                        '--react-international-phone-border-color': '#e5e7eb',
                        '--react-international-phone-background-color': '#ffffff',
                        '--react-international-phone-text-color': '#000000',
                        '--react-international-phone-selected-dropdown-item-background-color': '#f3f4f6',
                        '--react-international-phone-height': '2.75rem',
                        '--react-international-phone-font-size': '0.875rem'
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="company" className="text-xs sm:text-sm font-medium">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Your company name"
                    className="text-sm sm:text-base h-9 sm:h-10 lg:h-11"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="message" className="text-xs sm:text-sm font-medium">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={window.innerWidth < 640 ? 3 : 4}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us about your requirements..."
                    className="text-sm sm:text-base min-h-[80px] sm:min-h-[100px] resize-none"
                    required
                  />
                </div>

                {submitSuccess && (
                  <div className="p-2 sm:p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-green-600">{submitSuccess}</p>
                  </div>
                )}
                {submitError && (
                  <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-red-600">{submitError}</p>
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full h-10 sm:h-11 lg:h-12 text-sm sm:text-base" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      <span className="text-sm sm:text-base">Sending...</span>
                    </>
                  ) : (
                    <span className="text-sm sm:text-base">Send Message</span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default GetInTouch
