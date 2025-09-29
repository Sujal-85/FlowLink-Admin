import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/flowlink-logo-black.png';

const SignupPage = () => {
  const [password, setPassword] = useState('');
  const [passwordConditions, setPasswordConditions] = useState({
    length: false,
    number: false,
    specialChar: false,
  });

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    setPasswordConditions({
      length: newPassword.length >= 8,
      number: /\d/.test(newPassword),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  };
  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-100 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <img src={logo} alt="FlowLink Logo" className="w-18 h-12 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
          <p className="text-sm text-gray-500">Join FlowLink and start connecting</p>
        </div>
        <form className="space-y-6">
          <div>
            <label htmlFor="fullname" className="block mb-2 text-sm font-medium text-left text-gray-700">Full Name</label>
            <input type="text" id="fullname" placeholder="Enter your full name" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-left text-gray-700">Email Address</label>
            <input type="email" id="email" placeholder="Enter your email" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label htmlFor="phone" className="block mb-2 text-sm font-medium text-left text-gray-700">Phone Number</label>
            <input type="tel" id="phone" placeholder="Enter your phone number" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label htmlFor="role" className="block mb-2 text-sm font-medium text-left text-gray-700">Role</label>
            <select id="role" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Select your role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
                    <div className="relative">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-left text-gray-700">Password</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Create a password" 
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={password}
              onChange={handlePasswordChange}
            />
            <i className="absolute fas fa-eye" style={{ top: '38px', right: '10px' }}></i>
            <div className="mt-2 space-y-1">
              <p className={`text-xs flex items-center ${passwordConditions.length ? 'text-green-500' : 'text-gray-500'}`}>
                {passwordConditions.length ? '✓' : '•'} <span className="ml-2">Minimum 8 characters</span>
              </p>
              <p className={`text-xs flex items-center ${passwordConditions.number ? 'text-green-500' : 'text-gray-500'}`}>
                {passwordConditions.number ? '✓' : '•'} <span className="ml-2">At least 1 number</span>
              </p>
              <p className={`text-xs flex items-center ${passwordConditions.specialChar ? 'text-green-500' : 'text-gray-500'}`}>
                {passwordConditions.specialChar ? '✓' : '•'} <span className="ml-2">At least 1 special character</span>
              </p>
            </div>
          </div>
          <div>
            <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-left text-gray-700">Confirm Password</label>
            <input type="password" id="confirm-password" placeholder="Confirm your password" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="terms" className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
            <label htmlFor="terms" className="block ml-2 text-sm text-gray-900">I agree to the Terms of Service and Privacy Policy</label>
          </div>
          <button type="submit" className="w-full py-2 text-white bg-black rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
            Create Account
          </button>
        </form>
        <p className="text-sm text-center text-gray-600">Already have an account? <Link to="/login" className="font-medium text-green-600 hover:underline">Sign in here</Link></p>
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-sm text-gray-500">Or continue with</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>
                        <div className="flex space-x-4">
          <button className="flex items-center justify-center w-full py-2 border rounded-lg hover:bg-gray-50">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" className="w-5 h-5 mr-2" />
            Google
          </button>
          <button className="flex items-center justify-center w-full py-2 border rounded-lg hover:bg-gray-50">
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft Logo" className="w-5 h-5 mr-2" />
            Microsoft
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
