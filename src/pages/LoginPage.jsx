import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import auth from '../services/auth';
import logo from '../assets/flowlink-logo-black.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const history = useHistory();

  const login = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await auth.loginWithEmail(email, password);
      history.push('/home');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  const loginGoogle = async () => {
    setError('');
    try {
      await auth.loginWithGoogle();
      history.push('/home');
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  const loginMicrosoft = async () => {
    setError('');
    try {
      await auth.loginWithMicrosoft();
      history.push('/home');
    } catch (err) {
      setError(err.message || 'Microsoft sign-in failed');
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 ">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md mt-12 mb-4">
        <div className="text-center">
          <img src={logo} alt="FlowLink Logo" className="w-18 h-12 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-800">FlowLink</h1>
          <p className="text-sm text-gray-500">Supply Chain Management Platform</p>
        </div>
                <div className="text-center">
          <h2 className="text-3xl font-bold">Welcome Back</h2>
          <p className="text-gray-500">Sign in to your account</p>
        </div>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <form onSubmit={login} className="space-y-6">
          <div className="relative">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-left text-gray-700">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-left text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <i className="absolute fas fa-eye" style={{ top: '38px', right: '10px' }}></i>
          </div>
          <div className="text-right">
            <a href="#" className="text-sm text-gray-600 hover:underline">Forgot Password?</a>
          </div>
          <button type="submit" className="w-full py-2 text-white bg-black rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
            Sign In
          </button>
        </form>
        <p className="text-sm text-center text-gray-600">Don't have an account? <Link to="/signup" className="font-medium text-green-600 hover:underline">Sign Up</Link></p>
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-sm text-gray-500">Or continue with</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>
                        <div className="flex space-x-4">
          <button onClick={loginGoogle} className="flex items-center justify-center w-full py-2 border rounded-lg hover:bg-gray-50">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" className="w-5 h-5 mr-2" />
            Google
          </button>
          <button onClick={loginMicrosoft} className="flex items-center justify-center w-full py-2 border rounded-lg hover:bg-gray-50">
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft Logo" className="w-5 h-5 mr-2" />
            Microsoft
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
