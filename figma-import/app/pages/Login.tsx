import { useState } from 'react';
import { WarmButton } from '@/app/components/WarmButton';
import { WarmCard } from '@/app/components/WarmCard';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';

type ViewState = 'input' | 'loading' | 'success' | 'error';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [viewState, setViewState] = useState<ViewState>('input');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setViewState('error');
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setViewState('loading');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate success
    setViewState('success');
    
    // Auto redirect after success
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  const handleSocialLogin = (provider: 'google' | 'facebook' | 'apple') => {
    toast.success(`Redirecting to ${provider} login...`);
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Mail className="h-7 w-7 text-[#2D2721]" />
            </div>
            <span className="text-2xl font-bold text-[#2D2721]">GiftHub</span>
          </div>
        </div>

        <WarmCard padding="lg">
          {viewState === 'input' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[#2D2721] mb-2">
                  Welcome back
                </h1>
                <p className="text-[#6B5744]">
                  Sign in to your account
                </p>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-[12px] border-2 border-[rgba(139,115,85,0.2)] bg-white hover:bg-[#FFFBF5] hover:border-[#FFC857] transition-all font-medium text-[#2D2721]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                  className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-[12px] border-2 border-[rgba(139,115,85,0.2)] bg-white hover:bg-[#FFFBF5] hover:border-[#FFC857] transition-all font-medium text-[#2D2721]"
                >
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continue with Facebook
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('apple')}
                  className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-[12px] border-2 border-[rgba(139,115,85,0.2)] bg-white hover:bg-[#FFFBF5] hover:border-[#FFC857] transition-all font-medium text-[#2D2721]"
                >
                  <svg className="w-5 h-5" fill="#000000" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continue with Apple
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[rgba(139,115,85,0.2)]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-[#8B7355]">Or continue with email</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#2D2721] font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white focus:border-[#FFC857] focus:ring-[#FFC857] h-12"
                  required
                />
              </div>

              <WarmButton type="submit" size="lg" fullWidth>
                Send Magic Link
              </WarmButton>

              <p className="text-xs text-center text-[#8B7355]">
                We'll email you a secure link to sign in. No password needed!
              </p>
            </form>
          )}

          {viewState === 'loading' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Mail className="h-8 w-8 text-[#2D2721]" />
              </div>
              <h2 className="text-xl font-semibold text-[#2D2721] mb-2">
                Sending magic link...
              </h2>
              <p className="text-[#6B5744]">
                Please wait a moment
              </p>
            </div>
          )}

          {viewState === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[#9DB5A5] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-[#2D2721] mb-2">
                Check your email!
              </h2>
              <p className="text-[#6B5744] mb-6">
                We've sent a magic link to
                <br />
                <span className="font-medium text-[#2D2721]">{email}</span>
              </p>
              <div className="bg-[#FFF9ED] rounded-[12px] p-4 border border-[rgba(139,115,85,0.1)]">
                <p className="text-sm text-[#6B5744]">
                  Can't find it? Check your spam folder or{' '}
                  <button
                    onClick={() => setViewState('input')}
                    className="text-[#FFC857] font-medium hover:underline"
                  >
                    try again
                  </button>
                </p>
              </div>
            </div>
          )}

          {viewState === 'error' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#FEE2E2] flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-[#DC2626]" />
                </div>
                <h2 className="text-xl font-semibold text-[#2D2721] mb-2">
                  Something went wrong
                </h2>
                <p className="text-[#DC2626] mb-6">
                  {errorMessage}
                </p>
              </div>

              <WarmButton
                size="lg"
                fullWidth
                onClick={() => setViewState('input')}
              >
                Try Again
              </WarmButton>
            </div>
          )}
        </WarmCard>

        {/* Back to home */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-[#6B5744] hover:text-[#2D2721] mx-auto mt-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>
      </div>
    </div>
  );
}