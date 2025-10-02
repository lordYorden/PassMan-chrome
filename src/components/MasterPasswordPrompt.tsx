import { useState } from 'react';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

interface MasterPasswordPromptProps {
  isSetup: boolean; // true if setting up for first time, false if unlocking
  onSubmit: (password: string) => void;
  error?: string;
}

function MasterPasswordPrompt({ isSetup, onSubmit, error }: MasterPasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSetup) {
      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      if (password.length < 8) {
        alert('Master password must be at least 8 characters long');
        return;
      }
    }
    
    onSubmit(password);
  };

  return (
    <div className="p-6 bg-white">
      <div className="flex items-center justify-center mb-4">
        <div className="bg-sky-100 p-3 rounded-full">
          <FaLock className="text-sky-700 text-2xl" />
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-center mb-2">
        {isSetup ? 'Create Master Password' : 'Unlock PassMan'}
      </h2>
      
      <p className="text-sm text-gray-600 text-center mb-4">
        {isSetup
          ? 'This password will encrypt all your saved passwords. Make it strong and memorable!'
          : 'Enter your master password to access your saved passwords'}
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isSetup ? 'Master Password' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 pr-10"
                placeholder="Enter master password"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {isSetup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 pr-10"
                  placeholder="Confirm master password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          )}

          {isSetup && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
              <strong>⚠️ Important:</strong> There is no way to recover your passwords if you forget this master password. Write it down and keep it safe!
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-800 transition mt-4"
          >
          {isSetup ? 'Create & Encrypt' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}

export default MasterPasswordPrompt;
