import React, { useState, useEffect, useCallback } from 'react';
import { subscriptionApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import wsService from '../../services/websocket';
import { IoDiamond, IoCheckmarkCircle, IoClose, IoRocket, IoTime, IoInfinite } from 'react-icons/io5';

const SubscriptionPage = () => {
  const { isPro, refreshUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [error, setError] = useState('');

  const fetchSub = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subscriptionApi.getStatus();
      setSubscription(res.data.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSub();
  }, [fetchSub]);

  // Listen for subscription updates via WS
  useEffect(() => {
    const unsub = wsService.on('subscription_updated', () => {
      fetchSub();
      refreshUser();
    });
    return unsub;
  }, [fetchSub, refreshUser]);

  const handleUpgrade = async () => {
    setError('');
    setUpgrading(true);
    try {
      const res = await subscriptionApi.createOrder();
      const orderData = res.data.data;
      // Open Razorpay checkout
      if (window.Razorpay) {
        const rzp = new window.Razorpay({
          key: orderData.razorpay_key_id,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Dressly Pro',
          description: 'Monthly Pro Subscription',
          order_id: orderData.razorpay_order_id,
          handler: async (response) => {
            try {
              await subscriptionApi.verifyPayment({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
              await fetchSub();
              await refreshUser();
            } catch (err) {
              setError('Payment verification failed');
            }
          },
          theme: { color: '#6C63FF' },
        });
        rzp.open();
      } else {
        setError('Payment gateway not loaded. Please refresh the page.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    }
    setUpgrading(false);
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await subscriptionApi.cancel();
      await fetchSub();
      await refreshUser();
      setShowCancel(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel subscription');
    }
    setCancelling(false);
  };

  const daysRemaining = subscription?.expires_at
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / 86400000))
    : null;

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        <IoDiamond style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary-light)' }} />
        Subscription
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
        Manage your Dressly plan and billing.
      </p>

      {/* Current plan card */}
      <div style={{
        padding: 28,
        borderRadius: 'var(--radius-lg)',
        border: `2px solid ${isPro ? 'var(--primary-light)' : 'var(--border-color)'}`,
        background: isPro ? 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(255,107,157,0.05))' : 'var(--card-bg)',
        marginBottom: 32,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <span style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1, color: isPro ? 'var(--primary-light)' : 'var(--text-muted)' }}>
              Current Plan
            </span>
            <h3 style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 700, marginTop: 4 }}>
              {isPro ? 'Pro' : 'Free'}
            </h3>
          </div>
          {isPro && daysRemaining !== null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 14 }}>
                <IoTime /> {daysRemaining} days remaining
              </div>
              {subscription?.expires_at && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Expires: {new Date(subscription.expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ padding: 14, background: 'var(--input-bg)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>AI Generations</span>
            <p style={{ fontWeight: 600, marginTop: 2 }}>{isPro ? <><IoInfinite style={{ verticalAlign: 'middle' }} /> Unlimited</> : '5 / day'}</p>
          </div>
          <div style={{ padding: 14, background: 'var(--input-bg)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Wardrobe Items</span>
            <p style={{ fontWeight: 600, marginTop: 2 }}>{isPro ? <><IoInfinite style={{ verticalAlign: 'middle' }} /> Unlimited</> : '20 max'}</p>
          </div>
          <div style={{ padding: 14, background: 'var(--input-bg)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Priority Support</span>
            <p style={{ fontWeight: 600, marginTop: 2 }}>{isPro ? '✓ Included' : '✗ Not included'}</p>
          </div>
        </div>
      </div>

      {/* Pricing comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
        {/* Free */}
        <div className="pricing-card" style={{ padding: 24 }}>
          <h4 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 4 }}>Free</h4>
          <p style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>₹0 <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>forever</span></p>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: 14, lineHeight: 2 }}>
            <li><IoCheckmarkCircle style={{ color: 'var(--accent)', verticalAlign: 'middle', marginRight: 6 }} /> 5 AI generations/day</li>
            <li><IoCheckmarkCircle style={{ color: 'var(--accent)', verticalAlign: 'middle', marginRight: 6 }} /> 20 wardrobe items</li>
            <li><IoCheckmarkCircle style={{ color: 'var(--accent)', verticalAlign: 'middle', marginRight: 6 }} /> Basic recommendations</li>
            <li><IoClose style={{ color: 'var(--text-muted)', verticalAlign: 'middle', marginRight: 6 }} /> No priority support</li>
          </ul>
        </div>
        {/* Pro */}
        <div className="pricing-card featured" style={{ padding: 24 }}>
          <h4 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 4 }}>Pro</h4>
          <p style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>₹199 <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>/month</span></p>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: 14, lineHeight: 2 }}>
            <li><IoCheckmarkCircle style={{ color: 'var(--accent)', verticalAlign: 'middle', marginRight: 6 }} /> Unlimited AI generations</li>
            <li><IoCheckmarkCircle style={{ color: 'var(--accent)', verticalAlign: 'middle', marginRight: 6 }} /> Unlimited wardrobe items</li>
            <li><IoCheckmarkCircle style={{ color: 'var(--accent)', verticalAlign: 'middle', marginRight: 6 }} /> Advanced AI models</li>
            <li><IoCheckmarkCircle style={{ color: 'var(--accent)', verticalAlign: 'middle', marginRight: 6 }} /> Priority support</li>
          </ul>
          {!isPro && (
            <button className="btn btn-primary btn-large" style={{ width: '100%', marginTop: 12 }} onClick={handleUpgrade} disabled={upgrading}>
              <IoRocket style={{ marginRight: 6 }} /> {upgrading ? 'Processing...' : 'Upgrade to Pro'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Cancel subscription */}
      {isPro && (
        <div style={{ padding: 20, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--card-bg)' }}>
          {!showCancel ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Need to cancel your subscription?</p>
              <button className="btn btn-outline" style={{ fontSize: 13 }} onClick={() => setShowCancel(true)}>
                Cancel Subscription
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Are you sure? You'll lose access to Pro features at the end of your billing period.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ background: 'var(--error)', color: '#fff' }} onClick={handleCancel} disabled={cancelling}>
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
                <button className="btn btn-outline" onClick={() => setShowCancel(false)}>
                  Keep Pro
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
