import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, User, Upload, CheckCircle, Clock, Loader2, ArrowRight, ArrowLeft } from "lucide-react";

export default function RegisterNew() {
  const [registrationType, setRegistrationType] = useState("business");
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  // Business registration form
  const [businessFormData, setBusinessFormData] = useState({
    business_name: "",
    business_type: "retail",
    owner_name: "",
    email: "",
    phone_number: "",
    registration_number: "",
    tax_pin: "",
    location: "",
    monthly_revenue: "",
    registration_certificate_url: "",
    kra_pin_certificate_url: "",
    id_document_url: ""
  });

  // Individual registration form
  const [individualFormData, setIndividualFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    id_number: "",
    date_of_birth: "",
    country: "Kenya",
    city: "",
    id_document_url: ""
  });

  const handleFileUpload = async (field, file, formType) => {
    if (!file) return;
    
    try {
      setError("");
      // Upload file to backend and get URL
      const response = await apiClient.uploadDocument(file);
      
      if (formType === 'business') {
        setBusinessFormData({ ...businessFormData, [field]: response.url });
      } else {
        setIndividualFormData({ ...individualFormData, [field]: response.url });
      }
    } catch (err) {
      setError(`Failed to upload ${field}: ${err.message}`);
      console.error('File upload error:', err);
    }
  };

  const handleBusinessSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await apiClient.registerBusiness({
        ...businessFormData,
        monthly_revenue: parseFloat(businessFormData.monthly_revenue) || 0
      });
      
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit registration. Please check all fields and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIndividualSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/users/individual-registration/', individualFormData);
      
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit registration. Please check all fields and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    const email = registrationType === 'business' ? businessFormData.email : individualFormData.email;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        <Card className="w-full max-w-2xl border-none shadow-2xl backdrop-blur-sm bg-white/95 relative z-10">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-blue-600 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
            <p className="text-gray-600 text-lg mb-6">
              Thank you for applying to FinanceGrowth Co-Pilot. Our team is reviewing your application.
            </p>
            <Alert className="bg-blue-50 border-blue-200 text-left mb-6">
              <AlertDescription className="text-blue-800">
                <strong>What's Next?</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>We'll review your application within 24-48 hours</li>
                  <li>You'll receive an email with your login credentials once approved</li>
                  <li>You can check your status using your email: <strong>{email}</strong></li>
                  {registrationType === 'individual' && (
                    <li>Once approved, you'll be assigned to a business and can start working</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')}
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Go to Login
              </Button>
              <Button 
                onClick={() => navigate(`/registration-status/${encodeURIComponent(email)}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Check Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-3xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Join FinanceGrowth</h1>
          <p className="text-blue-100 text-lg">Start managing your business finances today</p>
        </div>

        <Card className="border-none shadow-2xl backdrop-blur-sm bg-white/95">
          <CardHeader>
            <Tabs value={registrationType} onValueChange={setRegistrationType} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="business" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Business Registration
                </TabsTrigger>
                <TabsTrigger value="individual" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Individual Registration
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          {registrationType === "business" ? (
            <form onSubmit={handleBusinessSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <div className={`flex-1 h-2 rounded ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  <div className={`flex-1 h-2 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  <div className={`flex-1 h-2 rounded ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                </div>
                <p className="text-sm text-gray-500">Step {step} of 3</p>

                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-900">Business Information</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="business_name">Business Name</Label>
                        <Input
                          id="business_name"
                          value={businessFormData.business_name}
                          onChange={(e) => setBusinessFormData({ ...businessFormData, business_name: e.target.value })}
                          required
                          placeholder="e.g., Mama Njeri Supplies"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="business_type">Business Type</Label>
                        <Select
                          value={businessFormData.business_type}
                          onValueChange={(value) => setBusinessFormData({ ...businessFormData, business_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="wholesale">Wholesale</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="agriculture">Agriculture</SelectItem>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={businessFormData.location}
                          onChange={(e) => setBusinessFormData({ ...businessFormData, location: e.target.value })}
                          required
                          placeholder="e.g., Nairobi, Westlands"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="registration_number">Registration Number</Label>
                        <Input
                          id="registration_number"
                          value={businessFormData.registration_number}
                          onChange={(e) => setBusinessFormData({ ...businessFormData, registration_number: e.target.value })}
                          required
                          placeholder="e.g., PVT-ABC123XYZ"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tax_pin">KRA PIN</Label>
                        <Input
                          id="tax_pin"
                          value={businessFormData.tax_pin}
                          onChange={(e) => setBusinessFormData({ ...businessFormData, tax_pin: e.target.value })}
                          required
                          placeholder="e.g., A001234567B"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="monthly_revenue">Estimated Monthly Revenue (KES)</Label>
                        <Input
                          id="monthly_revenue"
                          type="number"
                          value={businessFormData.monthly_revenue}
                          onChange={(e) => setBusinessFormData({ ...businessFormData, monthly_revenue: e.target.value })}
                          required
                          placeholder="e.g., 500000"
                        />
                      </div>
                    </div>

                    <Button 
                      type="button" 
                      onClick={() => setStep(2)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Next: Owner Information <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-900">Owner Information</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="owner_name">Full Name</Label>
                        <Input
                          id="owner_name"
                          value={businessFormData.owner_name}
                          onChange={(e) => setBusinessFormData({ ...businessFormData, owner_name: e.target.value })}
                          required
                          placeholder="e.g., John Kamau Mwangi"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={businessFormData.email}
                          onChange={(e) => setBusinessFormData({ ...businessFormData, email: e.target.value })}
                          required
                          placeholder="your@email.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                          id="phone_number"
                          value={businessFormData.phone_number}
                          onChange={(e) => setBusinessFormData({ ...businessFormData, phone_number: e.target.value })}
                          required
                          placeholder="+254712345678"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="flex-1"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setStep(3)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Next: Documents <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-900">Required Documents</h3>
                    
                    <div className="space-y-4">
                      {[
                        { key: 'registration_certificate_url', label: 'Business Registration Certificate', field: 'registration_certificate_url' },
                        { key: 'kra_pin_certificate_url', label: 'KRA PIN Certificate', field: 'kra_pin_certificate_url' },
                        { key: 'id_document_url', label: 'National ID / Passport', field: 'id_document_url' }
                      ].map((doc) => (
                        <div key={doc.key} className="space-y-2">
                          <Label htmlFor={doc.key}>{doc.label}</Label>
                          <div className="flex items-center gap-3">
                            <Input
                              id={doc.key}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  handleFileUpload(doc.field, file, 'business');
                                }
                              }}
                              required={!businessFormData[doc.field]}
                            />
                            {businessFormData[doc.field] && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setStep(2)}
                        className="flex-1"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                          </>
                        ) : (
                          <>
                            Submit Application <CheckCircle className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </form>
          ) : (
            <form onSubmit={handleIndividualSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <h3 className="font-semibold text-lg text-gray-900">Personal Information</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={individualFormData.full_name}
                      onChange={(e) => setIndividualFormData({ ...individualFormData, full_name: e.target.value })}
                      required
                      placeholder="e.g., Jane Wanjiku Mwangi"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ind_email">Email Address</Label>
                    <Input
                      id="ind_email"
                      type="email"
                      value={individualFormData.email}
                      onChange={(e) => setIndividualFormData({ ...individualFormData, email: e.target.value })}
                      required
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ind_phone">Phone Number</Label>
                    <Input
                      id="ind_phone"
                      value={individualFormData.phone_number}
                      onChange={(e) => setIndividualFormData({ ...individualFormData, phone_number: e.target.value })}
                      required
                      placeholder="+254712345678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="id_number">ID Number</Label>
                    <Input
                      id="id_number"
                      value={individualFormData.id_number}
                      onChange={(e) => setIndividualFormData({ ...individualFormData, id_number: e.target.value })}
                      required
                      placeholder="e.g., 12345678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={individualFormData.date_of_birth}
                      onChange={(e) => setIndividualFormData({ ...individualFormData, date_of_birth: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={individualFormData.city}
                      onChange={(e) => setIndividualFormData({ ...individualFormData, city: e.target.value })}
                      required
                      placeholder="e.g., Nairobi"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={individualFormData.country}
                      onChange={(e) => setIndividualFormData({ ...individualFormData, country: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="ind_id_document">ID Document (Optional)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="ind_id_document"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleFileUpload('id_document_url', file, 'individual');
                          }
                        }}
                      />
                      {individualFormData.id_document_url && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800 text-sm">
                    After approval, you'll be assigned to a business by our admin team and receive your login credentials via email.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application <CheckCircle className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </form>
          )}
        </Card>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <p className="text-white text-sm">
            Already have an account?{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto text-white underline hover:text-blue-200"
              onClick={() => navigate('/login')}
            >
              Sign in here
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
