'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  User,
  Lock,
  CreditCard,
  Key,
  Bell,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  LogOut,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCreditStore } from '@/stores/credit-store';
import {
  paymentApi,
  type CreditPackageId,
  type PaymentProvider,
} from '@/services/paymentApi';
import { authApi } from '@/services/authApi';
import { socialHubApi, type SocialChannel, type SocialProvider } from '@/services/socialHubApi';
import { notificationApi } from '@/services/notificationApi';

type UserProfile = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

const settingsTabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Lock },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'api', label: 'API Keys', icon: Key },
] as const;

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<(typeof settingsTabs)[number]['id']>(() => {
    const tab = searchParams.get('tab');
    if (tab && settingsTabs.some((item) => item.id === tab)) {
      return tab as (typeof settingsTabs)[number]['id'];
    }
    return 'profile';
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const notifiedRef = useRef<string>('');

  const fetchProfile = useCallback(async () => {
    try {
      const me = await authApi.getProfile();
      setProfile({
        firstName: me?.firstName ?? '',
        lastName: me?.lastName ?? '',
        email: me?.email ?? '',
      });
    } catch (error) {
      console.error('Failed to fetch profile', error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const paymentStatus = searchParams.get('paymentStatus');
    const paymentProvider = searchParams.get('paymentProvider');
    const paymentOrder = searchParams.get('paymentOrder');
    if (!paymentStatus || !paymentProvider) return;

    const notifyKey = `${paymentProvider}:${paymentOrder || ''}:${paymentStatus}`;
    if (notifiedRef.current === notifyKey) return;
    notifiedRef.current = notifyKey;

    if (paymentStatus === 'paid') {
      toast.success(`Thanh toan ${paymentProvider.toUpperCase()} thanh cong`);
    } else if (paymentStatus === 'pending') {
      toast.info(`Giao dich ${paymentProvider.toUpperCase()} dang cho xu ly`);
    } else {
      toast.error(`Thanh toan ${paymentProvider.toUpperCase()} that bai`);
    }
  }, [searchParams]);

  useEffect(() => {
    const paymentOrder = searchParams.get('paymentOrder');
    const paymentProvider = searchParams.get('paymentProvider');
    const paymentStatus = searchParams.get('paymentStatus');
    if (!paymentOrder || !paymentProvider || paymentStatus !== 'pending') return;

    const checkStatus = async () => {
      try {
        const order = await paymentApi.getStatus(paymentOrder);
        if (order.status === 'paid') {
          toast.success(`Thanh toan ${paymentProvider.toUpperCase()} da hoan tat`);
        } else if (order.status === 'failed' || order.status === 'cancelled') {
          toast.error(`Thanh toan ${paymentProvider.toUpperCase()} that bai`);
        }
      } catch {
        // ignore status polling errors on return page
      }
    };

    void checkStatus();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        <div className="flex gap-8">
          <nav className="w-[220px] shrink-0 space-y-1">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 min-w-0">
            {activeTab === 'profile' && (
              <ProfileSettings profile={profile} onProfileRefresh={fetchProfile} />
            )}
            {activeTab === 'account' && <AccountSettings />}
            {activeTab === 'billing' && <BillingSettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'api' && <ApiKeySettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSettings({
  profile,
  onProfileRefresh,
}: {
  profile: UserProfile | null;
  onProfileRefresh: () => Promise<void>;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFirstName(profile?.firstName ?? '');
    setLastName(profile?.lastName ?? '');
    setEmail(profile?.email ?? '');
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await authApi.updateProfile({ firstName, lastName, email });
      toast.success('Profile updated');
      await onProfileRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const initials = useMemo(
    () => `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U',
    [firstName, lastName],
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Manage your public profile information
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-chart-2/30 flex items-center justify-center text-2xl font-bold">
          {initials}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            First Name
          </Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Last Name
          </Label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Email
        </Label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
          type="email"
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function AccountSettings() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [accounts, setAccounts] = useState<SocialChannel[]>([]);
  const [providers, setProviders] = useState<SocialProvider[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);

  const loadChannels = useCallback(async () => {
    setIsLoadingChannels(true);
    try {
      const [channelData, providerData] = await Promise.all([
        socialHubApi.getChannels(),
        socialHubApi.getProviders(),
      ]);
      setAccounts(channelData);
      setProviders(providerData);
    } catch (error) {
      console.error('Failed to load social accounts', error);
      toast.error('Failed to load connected accounts');
    } finally {
      setIsLoadingChannels(false);
    }
  }, []);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  const updatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await authApi.updateProfile({
        oldPassword: currentPassword,
        password: newPassword,
      });
      toast.success('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update password';
      toast.error(message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const connectProvider = async (provider: string) => {
    try {
      const { url } = await socialHubApi.getAuthUrl(provider);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to connect provider', error);
      toast.error('Failed to start provider connection.');
    }
  };

  const disconnectAccount = async (accountId: number) => {
    toast.promise(socialHubApi.disconnectChannel(accountId), {
      loading: 'Disconnecting...',
      success: async () => {
        await loadChannels();
        return 'Disconnected';
      },
      error: 'Failed to disconnect',
    });
  };

  const logoutCurrentSession = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore backend logout error and continue clearing NextAuth session
    }
    await signOut({ callbackUrl: '/sign-in', redirect: true });
  };

  const deleteAccount = async () => {
    const ok = window.confirm('Delete account permanently? This action cannot be undone.');
    if (!ok) return;
    try {
      await authApi.deleteAccount();
      toast.success('Account deleted');
      await signOut({ callbackUrl: '/sign-in', redirect: true });
    } catch (error) {
      console.error('Failed to delete account', error);
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Account</h2>
        <p className="text-sm text-muted-foreground">Manage your account security</p>
      </div>

      <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Lock className="w-4 h-4" /> Change Password
        </h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Current Password</Label>
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">New Password</Label>
            <div className="relative">
              <Input
                type={showNext ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                onClick={() => setShowNext(!showNext)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
        <Button size="sm" onClick={() => void updatePassword()} disabled={isUpdatingPassword}>
          {isUpdatingPassword ? 'Updating...' : 'Update Password'}
        </Button>
      </div>

      <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Connected Social Accounts</h3>
          <Button variant="outline" size="sm" onClick={() => void loadChannels()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        {isLoadingChannels ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          providers.map((provider) => {
            const account = accounts.find((item) => item.platform === provider.identifier);
            const isConnected = !!account;
            return (
              <div key={provider.identifier} className="flex items-center justify-between py-2">
                <div className="inline-flex items-center gap-2">
                  {isConnected ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">
                    {provider.name}
                    {account?.name ? ` (${account.name})` : ''}
                  </span>
                </div>
                {isConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void disconnectAccount(account.id)}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => void connectProvider(provider.identifier)}>
                    Connect
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="p-6 bg-card rounded-2xl border border-destructive/30 space-y-4">
        <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Danger Zone
        </h3>
        <p className="text-xs text-muted-foreground">
          Once deleted, your account cannot be recovered.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => void logoutCurrentSession()}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
          <Button variant="destructive" size="sm" onClick={() => void deleteAccount()}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}

function BillingSettings() {
  const { balance, fetchBalance, isLoading } = useCreditStore();
  const [isPaying, setIsPaying] = useState<CreditPackageId | null>(null);

  useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  const purchase = async (packageId: CreditPackageId, provider: PaymentProvider) => {
    try {
      setIsPaying(packageId);
      const checkout = await paymentApi.checkout({ packageId, provider });
      if (!checkout.paymentUrl) {
        toast.error('Khong tao duoc URL thanh toan');
        return;
      }
      window.location.href = checkout.paymentUrl;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Khoi tao thanh toan that bai';
      toast.error(message);
    } finally {
      setIsPaying(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Billing</h2>
        <p className="text-sm text-muted-foreground">Manage credits and payment methods</p>
      </div>

      <div className="p-6 bg-gradient-to-br from-primary/10 to-chart-2/10 rounded-2xl border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Credit Balance
            </p>
            <p className="text-4xl font-bold">{typeof balance === 'number' ? balance : 0}</p>
            <p className="text-xs text-muted-foreground mt-1">credits remaining</p>
          </div>
          <Button variant="outline" onClick={() => void fetchBalance()} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            id: 'starter' as CreditPackageId,
            name: 'Starter',
            credits: 100,
            price: '99,000 VND',
            popular: false,
          },
          {
            id: 'pro' as CreditPackageId,
            name: 'Pro',
            credits: 500,
            price: '390,000 VND',
            popular: true,
          },
          {
            id: 'enterprise' as CreditPackageId,
            name: 'Enterprise',
            credits: 2000,
            price: '1,290,000 VND',
            popular: false,
          },
        ].map((plan) => (
          <div
            key={plan.name}
            className={cn(
              'p-5 rounded-2xl border bg-card space-y-3 relative',
              plan.popular ? 'border-primary shadow-lg shadow-primary/10' : 'border-border',
            )}
          >
            {plan.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-full">
                Popular
              </span>
            )}
            <h3 className="font-semibold">{plan.name}</h3>
            <p className="text-2xl font-bold">{plan.price}</p>
            <p className="text-xs text-muted-foreground">{plan.credits} credits</p>
            <div className="space-y-2">
              <Button
                variant={plan.popular ? 'default' : 'outline'}
                className="w-full"
                size="sm"
                disabled={isPaying === plan.id}
                onClick={() => void purchase(plan.id, 'vnpay')}
              >
                {isPaying === plan.id ? 'Processing...' : 'Pay with VNPAY'}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPaying === plan.id}
                  onClick={() => void purchase(plan.id, 'momo')}
                >
                  MoMo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPaying === plan.id}
                  onClick={() => void purchase(plan.id, 'zalopay')}
                >
                  ZaloPay
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadUnreadCount = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationApi.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to fetch unread count', error);
      toast.error('Failed to load notification stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUnreadCount();
  }, [loadUnreadCount]);

  const markAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      toast.success('All notifications marked as read');
      await loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
      toast.error('Failed to mark all read');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Notifications</h2>
        <p className="text-sm text-muted-foreground">Actions connected to backend APIs</p>
      </div>

      <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Unread Notifications</p>
            <p className="text-xs text-muted-foreground">
              Current unread count from server
            </p>
          </div>
          <p className="text-2xl font-bold">{unreadCount ?? '-'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadUnreadCount()} disabled={isLoading}>
            Refresh
          </Button>
          <Button onClick={() => void markAllRead()} disabled={isLoading}>
            Mark All as Read
          </Button>
        </div>
      </div>
    </div>
  );
}

function ApiKeySettings() {
  const [showTokenPreview, setShowTokenPreview] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">API Keys</h2>
        <p className="text-sm text-muted-foreground">
          This project does not expose dedicated API-key CRUD endpoints yet.
        </p>
      </div>

      <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Backend Integration Status</p>
            <p className="text-xs text-muted-foreground">
              API key management is pending server implementation
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.info('Server endpoint not available yet.')}>
            <Plus className="w-4 h-4 mr-2" />
            Generate New Key
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Input
            readOnly
            value={
              showTokenPreview
                ? 'server-endpoint-required'
                : '****************************************'
            }
            className="font-mono text-xs"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTokenPreview(!showTokenPreview)}
          >
            {showTokenPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
