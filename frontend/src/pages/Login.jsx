import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const { user, login, googleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    // Check frontend env first, otherwise fetch backend config
    const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (envClientId && envClientId.trim()) {
      setGoogleClientId(envClientId.trim());
    } else {
      api.get('/auth/config')
        .then((res) => {
          if (res.data?.googleClientId) {
            setGoogleClientId(res.data.googleClientId.trim());
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!googleClientId) return;

    // Load Google Identity Services script if not present
    const scriptId = 'google-gsi-script';
    let script = document.getElementById(scriptId);

    const initializeGsi = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        });
        const btnContainer = document.getElementById('googleSignInBtn');
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
          });
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGsi;
      document.body.appendChild(script);
    } else if (window.google?.accounts?.id) {
      initializeGsi();
    }
  }, [googleClientId]);

  const getErrorMessage = (err, defaultMsg) => {
    if (!err) return defaultMsg;
    const data = err.response?.data;
    if (typeof data === 'string') {
      if (data.includes('<!DOCTYPE html>') || data.includes('<html')) {
        return 'Backend server API endpoint not found (404). Please verify VITE_API_BASE_URL environment variable in Vercel settings.';
      }
      return data;
    }
    if (data && typeof data === 'object') {
      if (typeof data.error === 'string') return data.error;
      if (typeof data.message === 'string') return data.message;
      if (data.error && typeof data.error === 'object' && typeof data.error.message === 'string') {
        return data.error.message;
      }
    }
    if (typeof err.message === 'string') return err.message;
    return defaultMsg;
  };

  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) return;
    setLoading(true);
    try {
      await googleLogin({ credential: response.credential });
      toast.success('Successfully signed in with Google!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Google login error:', err);
      toast.error(getErrorMessage(err, 'Google login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Successfully signed in!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      toast.error(getErrorMessage(err, 'Invalid email or password'));
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

            <h1 className="text-4xl sm:text-5xl font-light tracking-tight mb-4 font-serif">
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

            {/* Render Google Login Option only if googleClientId is configured */}
            {googleClientId ? (
              <>
                <div className="my-8 flex items-center">
                  <div className="flex-1 border-t border-neutral-300"></div>
                  <span className="px-3 text-xs text-neutral-500 uppercase tracking-wide">Or</span>
                  <div className="flex-1 border-t border-neutral-300"></div>
                </div>

                <div id="googleSignInBtn" className="w-full flex justify-center min-h-[44px]"></div>
              </>
            ) : null}
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