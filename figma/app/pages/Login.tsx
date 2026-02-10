import { useMemo, useState } from 'react';
import { WarmButton } from '@app/components/WarmButton';
import { WarmCard } from '@app/components/WarmCard';
import { useLocation, useNavigate } from '@/lib/router-shim';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Store, ShieldCheck, UserRound, Gift } from 'lucide-react';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { toast } from 'sonner';
import { useAuth, type AuthenticatedRole } from '@app/contexts/AuthContext';

type ViewState = 'input' | 'loading' | 'success' | 'error';

type LinkedAccount = {
  email: string;
  role: AuthenticatedRole;
  label: string;
};

const linkedAccounts: LinkedAccount[] = [
  { email: 'maria@gifthub.eu', role: 'user', label: 'Tavakasutaja konto' },
  { email: 'store@gifthub.eu', role: 'merchant', label: 'Ettevotja konto' },
  { email: 'admin@gifthub.eu', role: 'admin', label: 'Super admin konto' },
];

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAs } = useAuth();
  const [email, setEmail] = useState('');
  const [viewState, setViewState] = useState<ViewState>('input');
  const [errorMessage, setErrorMessage] = useState('');
  const [resolvedRole, setResolvedRole] = useState<AuthenticatedRole | null>(null);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const roleFromQuery = searchParams.get('role');
  const defaultRole: AuthenticatedRole =
    roleFromQuery === 'admin' || roleFromQuery === 'merchant' || roleFromQuery === 'user'
      ? roleFromQuery
      : 'user';
  const [selectedRole, setSelectedRole] = useState<AuthenticatedRole>(defaultRole);
  const nextPathFromQuery = searchParams.get('next');
  const safeNextPath = nextPathFromQuery?.startsWith('/') ? nextPathFromQuery : null;
  const normalizedEmail = email.trim().toLowerCase();

  const roleOptions: Array<{
    role: AuthenticatedRole;
    title: string;
    description: string;
    icon: typeof UserRound;
  }> = [
    {
      role: 'user',
      title: 'Tavakasutaja',
      description: 'Ostmine, rentimine, kinkekaardid, kampaaniad',
      icon: UserRound,
    },
    {
      role: 'merchant',
      title: 'Ettevotja',
      description: 'Vautserid, rent, tellimused, analyytika',
      icon: Store,
    },
    {
      role: 'admin',
      title: 'Super Admin',
      description: 'Kasutajad, ettevotjad, teenused, muugid',
      icon: ShieldCheck,
    },
  ];

  const matchedAccount = useMemo(
    () => linkedAccounts.find((account) => account.email.toLowerCase() === normalizedEmail) ?? null,
    [normalizedEmail]
  );
  const effectiveRole = matchedAccount?.role ?? selectedRole;

  const resolvePostLoginRoute = (role: AuthenticatedRole) => {
    if (safeNextPath) {
      return safeNextPath;
    }
    if (role === 'admin') {
      return '/admin-dashboard';
    }
    if (role === 'merchant') {
      return '/dashboard';
    }
    return '/user-dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setViewState('error');
      setErrorMessage('Sisesta korrektne e-posti aadress.');
      return;
    }

    setViewState('loading');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    const nextRole = matchedAccount?.role ?? selectedRole;
    loginAs(nextRole);
    setResolvedRole(nextRole);
    setViewState('success');
    
    // Auto redirect after success
    setTimeout(() => {
      navigate(resolvePostLoginRoute(nextRole));
    }, 2000);
  };

  const handleSocialLogin = (provider: 'google' | 'facebook' | 'apple') => {
    toast.success(`Suunan sind ${provider} sisselogimisse...`);
    const nextRole = matchedAccount?.role ?? selectedRole;
    loginAs(nextRole);
    setResolvedRole(nextRole);
    setTimeout(() => {
      navigate(resolvePostLoginRoute(nextRole));
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4] py-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <WarmCard
            gradient
            className="hidden lg:flex border border-[#E7DCC7] shadow-warm-lg p-8 xl:p-10 flex-col justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
                  <Gift className="h-7 w-7 text-[#2D2721]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#2D2721] leading-tight">GiftHub</div>
                  <div className="text-sm text-[#6B5744]">Turvaline sissepaas sinu kontole</div>
                </div>
              </div>

              <h1 className="text-[34px] leading-[1.1] font-bold text-[#2D2721] mb-3">
                Logi sisse ja jatka sealt, kus pooleli jaid
              </h1>
              <p className="text-[#6B5744] mb-8">
                E-postiga seotud konto suunatakse automaatselt oigesse toolauale: kasutaja, ettevotja voi super admin.
              </p>

              <div className="space-y-3">
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div
                      key={option.role}
                      className="flex items-center gap-3 rounded-[14px] border border-[#E7DCC7] bg-white/85 px-4 py-3"
                    >
                      <span className="w-10 h-10 rounded-xl bg-[#FFF3D6] border border-[#F2D08D] grid place-items-center">
                        <Icon className="w-5 h-5 text-[#2D2721]" />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-[#2D2721]">{option.title}</div>
                        <div className="text-xs text-[#6B5744]">{option.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[14px] border border-[#D9CBB4] bg-white/80 px-4 py-3 text-sm text-[#4D3F31]">
              Testkontod: {linkedAccounts.map((account) => account.email).join(' | ')}
            </div>
          </WarmCard>

          <div className="w-full">
            <div className="text-center mb-5 lg:hidden">
              <div className="inline-flex items-center gap-2 mb-2">
                <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
                  <Gift className="h-6 w-6 text-[#2D2721]" />
                </div>
                <span className="text-2xl font-bold text-[#2D2721]">GiftHub</span>
              </div>
              <p className="text-sm text-[#6B5744]">Logi sisse oma e-posti aadressiga</p>
            </div>

            <WarmCard padding="lg" className="shadow-warm-lg border border-[rgba(139,115,85,0.16)] bg-white/95">
              {viewState === 'input' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-[28px] leading-tight font-bold text-[#2D2721] mb-2">Tere tulemast tagasi</h2>
                    <p className="text-[#6B5744]">Vali konto tuup voi sisesta e-post ning me suuname sind oigesse vaatesse.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[#2D2721] font-semibold">Konto tuup</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {roleOptions.map((option) => {
                        const Icon = option.icon;
                        const active = effectiveRole === option.role;
                        return (
                          <button
                            key={option.role}
                            type="button"
                            onClick={() => setSelectedRole(option.role)}
                            className={`w-full rounded-[14px] border px-3 py-3 text-left transition-all ${
                              active
                                ? 'border-[#F2C76A] bg-[#FFF5DF] shadow-sm'
                                : 'border-[rgba(139,115,85,0.24)] bg-white hover:border-[#D9CBB4]'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`w-10 h-10 rounded-xl grid place-items-center border ${
                                  active
                                    ? 'bg-[#FFC857] border-[#F2C76A] text-[#2D2721]'
                                    : 'bg-[#FAF7F2] border-[#E7DCC7] text-[#3B2F24]'
                                }`}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-[#2D2721] text-sm leading-tight">{option.title}</div>
                                <div className="text-xs text-[#6B5744] mt-1 leading-snug">{option.description}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {matchedAccount && (
                      <div className="rounded-[12px] border border-[#9DB5A5]/50 bg-[#E8F5EC] px-3 py-2 text-sm text-[#2D2721]">
                        E-postiga seotud konto: <span className="font-semibold">{matchedAccount.label}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#2D2721] font-semibold">
                      E-post
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#6B5744]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="nimi@firma.ee"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-[12px] border-[rgba(139,115,85,0.22)] bg-white focus:border-[#FFC857] focus:ring-[#FFC857] h-12 pl-10"
                        required
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {linkedAccounts.map((account) => (
                        <button
                          key={account.email}
                          type="button"
                          onClick={() => {
                            setEmail(account.email);
                            setSelectedRole(account.role);
                          }}
                          className="text-xs rounded-full border border-[rgba(139,115,85,0.22)] bg-[#FFFBF5] px-2.5 py-1 text-[#4D3F31] hover:bg-[#FAF7F2] font-medium"
                        >
                          {account.email}
                        </button>
                      ))}
                    </div>
                  </div>

                  <WarmButton type="submit" size="lg" fullWidth className="text-base">
                    Saada sisselogimislink
                  </WarmButton>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[rgba(139,115,85,0.2)]" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-[#8B7355]">voi kasuta kiiret sisselogimist</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSocialLogin('google')}
                      className="w-full flex items-center justify-center gap-2 h-11 px-3 rounded-[12px] border-2 border-[rgba(139,115,85,0.2)] bg-white hover:bg-[#FFFBF5] hover:border-[#FFC857] transition-all font-semibold text-[#2D2721] shadow-sm text-sm"
                    >
                      <span className="w-7 h-7 rounded-full bg-[#FAF7F2] border border-[#E7DCC7] grid place-items-center">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      </span>
                      Google
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialLogin('facebook')}
                      className="w-full flex items-center justify-center gap-2 h-11 px-3 rounded-[12px] border-2 border-[rgba(139,115,85,0.2)] bg-white hover:bg-[#FFFBF5] hover:border-[#FFC857] transition-all font-semibold text-[#2D2721] shadow-sm text-sm"
                    >
                      <span className="w-7 h-7 rounded-full bg-[#FAF7F2] border border-[#E7DCC7] grid place-items-center">
                        <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </span>
                      Facebook
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialLogin('apple')}
                      className="w-full flex items-center justify-center gap-2 h-11 px-3 rounded-[12px] border-2 border-[rgba(139,115,85,0.2)] bg-white hover:bg-[#FFFBF5] hover:border-[#FFC857] transition-all font-semibold text-[#2D2721] shadow-sm text-sm"
                    >
                      <span className="w-7 h-7 rounded-full bg-[#FAF7F2] border border-[#E7DCC7] grid place-items-center">
                        <svg className="w-4 h-4" fill="#111827" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                        </svg>
                      </span>
                      Apple
                    </button>
                  </div>

                  <p className="text-xs text-center text-[#8B7355]">
                    Sisselogimine toimub ilma paroolita. Saadame turvalise lingi sinu e-postile.
                  </p>
                </form>
              )}

              {viewState === 'loading' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Mail className="h-8 w-8 text-[#2D2721]" />
                  </div>
                  <h2 className="text-xl font-semibold text-[#2D2721] mb-2">Saadan sisselogimislinki...</h2>
                  <p className="text-[#6B5744]">Palun oota hetk.</p>
                </div>
              )}

              {viewState === 'success' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-[#9DB5A5] flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-[#2D2721] mb-2">Link on saadetud</h2>
                  <p className="text-[#6B5744] mb-6">
                    Saatsime sisselogimislingi aadressile
                    <br />
                    <span className="font-medium text-[#2D2721]">{email}</span>
                  </p>
                  <p className="text-sm text-[#8B7355] mb-4">Valmistame ette: {roleOptions.find((option) => option.role === (resolvedRole ?? selectedRole))?.title}</p>
                  <div className="bg-[#FFF9ED] rounded-[12px] p-4 border border-[rgba(139,115,85,0.1)]">
                    <p className="text-sm text-[#6B5744]">
                      Kui kirja ei nae, kontrolli rampsposti voi{' '}
                      <button onClick={() => setViewState('input')} className="text-[#C28B00] font-semibold hover:underline">
                        proovi uuesti
                      </button>
                      .
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
                    <h2 className="text-xl font-semibold text-[#2D2721] mb-2">Tekkis viga</h2>
                    <p className="text-[#DC2626] mb-6">{errorMessage}</p>
                  </div>

                  <WarmButton size="lg" fullWidth onClick={() => setViewState('input')}>
                    Proovi uuesti
                  </WarmButton>
                </div>
              )}
            </WarmCard>

            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm text-[#6B5744] hover:text-[#2D2721] mx-auto mt-5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Tagasi avalehele
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
