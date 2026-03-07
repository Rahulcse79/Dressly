import React, { useState, useEffect, useCallback } from 'react';
import { aiApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import wsService from '../../services/websocket';
import { IoSparkles, IoFlash, IoTime, IoCheckmarkCircle } from 'react-icons/io5';

const AIGeneratePage = () => {
  const { isPro } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [occasion, setOccasion] = useState('');
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');

  const occasions = ['casual', 'formal', 'party', 'wedding', 'interview', 'date', 'gym', 'travel'];

  const fetchData = useCallback(async () => {
    try {
      const [quotaRes, genRes] = await Promise.all([
        aiApi.getQuota(),
        aiApi.listGenerations(1, 10),
      ]);
      setQuota(quotaRes.data.data);
      setGenerations(genRes.data.data.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for WebSocket AI progress/completion
  useEffect(() => {
    const unsubProgress = wsService.on('ai_progress', (data) => {
      setProgress(data);
    });
    const unsubComplete = wsService.on('ai_complete', (data) => {
      setProgress(null);
      setLoading(false);
      fetchData();
    });
    return () => {
      unsubProgress();
      unsubComplete();
    };
  }, [fetchData]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || prompt.length < 10) {
      setError('Prompt must be at least 10 characters');
      return;
    }
    setError('');
    setLoading(true);
    setProgress({ status: 'pending', progress: 0, message: 'Starting...' });
    try {
      await aiApi.generate(prompt, occasion || undefined, undefined);
      setPrompt('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed');
      setProgress(null);
      setLoading(false);
    }
  };

  const quotaPercent = quota ? Math.min(100, (quota.used_today / Math.max(1, quota.daily_limit)) * 100) : 0;

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        <IoSparkles style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary-light)' }} />
        AI Outfit Generator
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
        Describe your style or occasion and let Gemini AI create the perfect outfit.
      </p>

      {/* Quota bar */}
      {quota && (
        <div className="quota-bar">
          <IoFlash style={{ color: 'var(--primary-light)' }} />
          <span>{quota.used_today} / {quota.is_pro ? '∞' : quota.daily_limit} generations today</span>
          {!isPro && (
            <div className="quota-bar-fill">
              <div className="quota-bar-fill-inner" style={{ width: `${quotaPercent}%` }} />
            </div>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{quota.remaining} remaining</span>
        </div>
      )}

      {/* Generation form */}
      <div className="ai-generate-form">
        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <label>Prompt *</label>
            <textarea
              placeholder="E.g., Create a smart casual outfit for a weekend brunch using my navy blazer and white sneakers. Consider warm weather and a relaxed vibe..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
              minLength={10}
              maxLength={1000}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Min 10 characters</span>
              <span style={{ fontSize: 11, color: prompt.length > 900 ? 'var(--warning)' : 'var(--text-muted)' }}>{prompt.length}/1000</span>
            </div>
          </div>

          <div className="form-group">
            <label>Occasion (optional)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {occasions.map((o) => (
                <button
                  key={o}
                  type="button"
                  className={`btn ${occasion === o ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '6px 14px', fontSize: 12, textTransform: 'capitalize' }}
                  onClick={() => setOccasion(occasion === o ? '' : o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading || (quota && !quota.is_pro && quota.remaining <= 0)}
          >
            {loading ? (
              <>Generating{progress ? ` (${progress.progress}%)` : '...'}</>
            ) : (
              <><IoSparkles style={{ marginRight: 6 }} /> Generate Outfit</>
            )}
          </button>
        </form>

        {/* Real-time progress */}
        {progress && (
          <div style={{ marginTop: 16, padding: 16, background: 'var(--tag-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--tag-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div className="quota-bar-fill" style={{ flex: 1 }}>
                <div className="quota-bar-fill-inner" style={{ width: `${progress.progress}%`, transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-light)' }}>{progress.progress}%</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{progress.message || 'Processing...'}</p>
          </div>
        )}
      </div>

      {/* Previous generations */}
      <div style={{ marginTop: 48 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
          Recent Generations
        </h3>
        {generations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✨</div>
            <h3>No generations yet</h3>
            <p>Create your first AI outfit above!</p>
          </div>
        ) : (
          generations.map((gen) => (
            <div className="generation-card" key={gen.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span className={`gen-status ${gen.status?.toLowerCase()}`}>
                    {gen.status === 'completed' && <IoCheckmarkCircle />}
                    {gen.status}
                  </span>
                  {gen.occasion && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {gen.occasion}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  <IoTime />
                  {new Date(gen.created_at).toLocaleDateString()}
                </div>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>{gen.prompt_text}</p>
              {gen.style_score && (
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  <span>Style Score: <strong style={{ color: 'var(--accent)' }}>{Math.round(gen.style_score)}%</strong></span>
                  {gen.latency_ms && <span style={{ color: 'var(--text-muted)' }}>{gen.latency_ms}ms</span>}
                </div>
              )}
              {gen.ai_feedback && (
                <p style={{ marginTop: 10, padding: 12, background: 'var(--input-bg)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {gen.ai_feedback}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AIGeneratePage;
