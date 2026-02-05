import React, { useState } from 'react';
import { Button } from './ui/button';
import AddCompanyModal from './ui/AddCompanyModal';

const AddCompanyTest = () => {
  const [showModal, setShowModal] = useState(false);

  const handleSuccess = () => {
    console.log('Company added successfully!');
    // Here you would typically refresh the company list or navigate
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Add Company Modal Test</h2>
      <p className="text-gray-600 mb-4">
        Click the button below to test the Add Company modal with all the company input fields from the registration page.
      </p>
      
      <Button onClick={() => setShowModal(true)}>
        Open Add Company Modal
      </Button>

      <AddCompanyModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default AddCompanyTest;