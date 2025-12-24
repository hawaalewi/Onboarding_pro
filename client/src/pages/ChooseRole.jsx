import React from "react";
import { useNavigate } from "react-router-dom";

const ChooseRole = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Join Connect Onboard</h1>
      <p className="text-gray-600 mb-8">Choose your account type</p>

      <div className="flex flex-col md:flex-row gap-6">
        <div
          onClick={() => navigate("/register/job_seeker")} // from job-seeker and job_seeker
          className="cursor-pointer bg-white p-8 rounded-xl shadow-lg w-72 hover:shadow-2xl transition-transform transform hover:-translate-y-1"
        >
          <h2 className="text-xl font-semibold mb-4">I am a Job Seeker</h2>
          <p className="text-gray-600">Find onboarding sessions, apply, and manage your profile.</p>
        </div>

        <div
          onClick={() => navigate("/register/organization")}
          className="cursor-pointer bg-white p-8 rounded-xl shadow-lg w-72 hover:shadow-2xl transition-transform transform hover:-translate-y-1"
        >
          <h2 className="text-xl font-semibold mb-4">I am an Organization</h2>
          <p className="text-gray-600">Post onboarding sessions and manage applicants.</p>
        </div>
      </div>
    </div>
  );
};

export default ChooseRole;
