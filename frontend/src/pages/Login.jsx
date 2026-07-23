import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Successfully signed in!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const errMsg = err.response?.data?.error || 'Invalid email or password';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-white text-neutral-950 flex items-center justify-center">
      <div className="w-full h-screen flex">
        {/* Left Column - Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16">
          <div className="max-w-md">
            {/* Logo / Branding */}
            <div className="mb-16">
              <div className="text-6xl font-bold tracking-tight">
                <span className="text-blue-600"></span> Lab Resource Sharing Platform
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl font-light tracking-tight mb-4  font-serif">
              Access what<br />you need
            </h1>
            <p className="text-neutral-600 text-lg mb-12 font-light">
              Share resources. Scale discovery.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded px-4 py-3 text-sm text-neutral-950 placeholder-neutral-500 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded px-4 py-3 text-sm text-neutral-950 placeholder-neutral-500 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-950 text-white py-3 rounded text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50 transition-colors mt-8"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* <div className="my-8 flex items-center">
              <div className="flex-1 border-t border-neutral-300"></div>
              <span className="px-3 text-xs text-neutral-500 uppercase tracking-wide">Or</span>
              <div className="flex-1 border-t border-neutral-300"></div>
            </div> */}

            {/* <button className="w-full border border-neutral-300 text-neutral-950 py-3 rounded text-sm font-medium hover:border-neutral-400 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button> */}
          </div>
        </div>

        {/* Right Column - Hero Image (hidden on mobile) */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden items-center justify-center">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" viewBox="0 0 400 600">
              <defs>
                <pattern id="dots" x="40" y="40" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="2" fill="#e5e7eb" />
                </pattern>
              </defs>
              <rect width="400" height="600" fill="url(#dots)" />
            </svg>
          </div>

          {/* Centered content */}
          <div className="relative z-10 text-center px-8">
            <div className="inline-block mb-8">
              <div className="text-9xl font-light">🔬</div>
            </div>
            <h2 className="text-3xl font-light tracking-tight mb-4 font-serif text-neutral-950">
              Where research thrives
            </h2>
            <p className="text-neutral-600 max-w-xs">
              Connect across departments. Share equipment. Accelerate discovery together.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12">
              <div>
                <div className="text-2xl font-semibold text-blue-600">100+</div>
                <div className="text-xs text-neutral-600 mt-1">Resources</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-blue-600">10+</div>
                <div className="text-xs text-neutral-600 mt-1">Institutions</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-blue-600">1000+</div>
                <div className="text-xs text-neutral-600 mt-1">Users</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}