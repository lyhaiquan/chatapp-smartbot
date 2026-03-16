/**
 * OfficePage.jsx — The /office route.
 *
 * Strategy: Embed the real SkyOffice app (running on port 3000) in an iframe.
 * - Username from AuthContext is passed via postMessage → iframe → SkyOffice LoginDialog
 * - The iframe fills the full viewport below a thin nav bar
 * - "Back to Chat" navigates home without disrupting Socket.io
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// URL of the SkyOffice client — injected via VITE env var or defaults to port 3000
const SKYOFFICE_URL = import.meta.env.VITE_SKYOFFICE_URL || 'http://localhost:3000';

export default function OfficePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const iframeRef = useRef(null);

    const displayName =
        user?.name ||
        user?.username ||
        user?.email?.split('@')[0] ||
        'Anonymous';

    // Send username to SkyOffice iframe via postMessage once it has loaded
    const handleIframeLoad = () => {
        if (!iframeRef.current) return;
        iframeRef.current.contentWindow?.postMessage(
            { type: 'SKYOFFICE_SET_NAME', name: displayName },
            '*'
        );
    };

    // Re-post if iframe was already loaded before the effect fires
    useEffect(() => {
        const interval = setInterval(() => {
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage(
                    { type: 'SKYOFFICE_SET_NAME', name: displayName },
                    '*'
                );
            }
        }, 1500);
        // Stop after 10s — by then SkyOffice will have received it
        const stop = setTimeout(() => clearInterval(interval), 10_000);
        return () => { clearInterval(interval); clearTimeout(stop); };
    }, [displayName]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                backgroundColor: '#111827',
                fontFamily: 'Inter, system-ui, sans-serif',
                overflow: 'hidden',
            }}
        >
            {/* ── Nav bar ─────────────────────────────────── */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 16px',
                    backgroundColor: '#1F2937',
                    borderBottom: '1px solid #374151',
                    flexShrink: 0,
                    gap: 12,
                }}
            >
                {/* Back button */}
                <button
                    onClick={() => navigate('/')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        backgroundColor: '#374151',
                        color: '#E5E7EB',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4B5563')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#374151')}
                >
                    ← Quay lại Chat
                </button>

                {/* Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' }}>
                    <span style={{ fontSize: 20 }}>🏢</span>
                    <span style={{ color: '#E5E7EB', fontWeight: 600, fontSize: 15 }}>
                        SkyOffice — Virtual Office
                    </span>
                </div>

                {/* Username badge */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '5px 12px',
                        backgroundColor: '#374151',
                        borderRadius: 20,
                        color: '#A5B4FC',
                        fontSize: 13,
                        fontWeight: 500,
                    }}
                >
                    <span style={{ fontSize: 16 }}>🧑‍💻</span>
                    {displayName}
                </div>
            </div>

            {/* ── SkyOffice iframe ──────────────────────── */}
            <iframe
                ref={iframeRef}
                src={SKYOFFICE_URL}
                onLoad={handleIframeLoad}
                title="SkyOffice Virtual Office"
                allow="camera; microphone; display-capture"
                style={{
                    flex: 1,
                    border: 'none',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#111827',
                }}
            />
        </div>
    );
}
