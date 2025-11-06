import React from 'react';

const FeaturesSection = () => {
  const features = [
    {
      image: "/web_Image/Mask group.png",
      title: "Facial Recognition",
      description: "Snap photo to log hours instantly."
    },
    {
      image: "/web_Image/Mask group-1.png",
      title: "Clock In/Out",
      description: "Seamless one-tap login and logout solution with employee identifications."
    },
    {
      image: "/web_Image/Mask group-2.png",
      title: "Timesheet Reports",
      description: "Provides employee time reports at your preferred frequency."
    },
    {
      image: "/web_Image/Mask group-3.png",
      title: "Admin Dashboard",
      description: "Employee onboarding system for Admins."
    },
    {
      image: "/web_Image/Mask group-4.png",
      title: "Export Options",
      description: "Delivers time reports in multiple formats like CSV and PDF for detailed analysis."
    }
  ];

  return (
    <div className="row mt-5" id="whatWeProvide">
      {/* Left Image Section */}
      <div className="col-md-6 col-sm-12">
        <div className="sec-col d-flex justify-content-center align-items-center">
          <img 
            src="/web_Image/main image.jpeg" 
            alt="Main Image" 
            className="img-fluid sec-img h-100"
          />
        </div>
      </div>

      {/* Right Content Section */}
      <div className="col-md-6 col-sm-12">
        {features.map((feature, index) => (
          <div key={index} className="feature-section">
            <div className="row align-items-center">
              <div className="col-2 d-flex justify-content-center">
                <img 
                  src={feature.image} 
                  alt={feature.title} 
                  className="inside-col-img-sty"
                />
              </div>
              <div className="col-10">
                <h4 className="text-left">{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturesSection;