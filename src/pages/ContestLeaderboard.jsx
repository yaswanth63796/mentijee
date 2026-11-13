import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy, Medal, Users, Award, Clock, ArrowLeft,
  Wifi, WifiOff, RefreshCw, AlertCircle, Sparkles, CheckCircle2
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import Navbar from '../components/Navbar';
import { getContestLeaderboard } from '../api/contestApi';

const ContestLeaderboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING'); // CONNECTING, CONNECTED, DISCONNECTED, RECONNECTING
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [highlightRanks, setHighlightRanks] = useState({});

  const sessionId = sessionStorage.getItem(`contest_${id}_session`) || '';
  const stompClientRef = useRef(null);

  // 1. Initial REST fetch
  const fetchLeaderboard = async () => {
    try {
      const data = await getContestLeaderboard(id, sessionId);
      setLeaderboard(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch initial leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [id]);

  // 2. WebSocket STOMP subscription
  useEffect(() => {
    const client = new Client({
      brokerURL: `ws://localhost:8081/ws`,
      reconnectDelay: 4000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setConnectionStatus('CONNECTED');
        client.subscribe(`/topic/contest/${id}/leaderboard`, (message) => {
          if (message.body) {
            try {
              const updatedData = JSON.parse(message.body);
              setLeaderboard((prev) => {
                const changes = {};
                if (prev?.top10) {
                  updatedData.top10?.forEach((item) => {
                    changes[item.participantName] = true;
                  });
                }
                setHighlightRanks(changes);
                setTimeout(() => setHighlightRanks({}), 2500);
                return updatedData;
              });
              setLastUpdated(new Date());
            } catch (e) {
              console.error('Failed to parse leaderboard message', e);
            }
          }
        });
      },
      onDisconnect: () => {
        setConnectionStatus('DISCONNECTED');
      },
      onStompError: () => {
        setConnectionStatus('RECONNECTING');
      },
      onWebSocketClose: () => {
        setConnectionStatus('RECONNECTING');
      },
    });

    try {
      client.activate();
      stompClientRef.current = client;
    } catch (e) {
      setConnectionStatus('DISCONNECTED');
    }

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [id]);

  const getRankBadge = (rank) => {
    if (rank === 1) return <div className="podium-badge rank-1"><Medal size={16} /> 1st</div>;
    if (rank === 2) return <div className="podium-badge rank-2"><Medal size={16} /> 2nd</div>;
    if (rank === 3) return <div className="podium-badge rank-3"><Medal size={16} /> 3rd</div>;
    return <div className="podium-badge rank-other">#{rank}</div>;
  };

  const top3 = leaderboard?.top10 ? leaderboard.top10.slice(0, 3) : [];

  return (
    <div className="menti-page-wrapper">
      <Navbar />

      <main className="menti-content-container">
        {/* Navigation & Controls Bar */}
        <div className="menti-back-bar">
          <button className="menti-back-btn" onClick={() => navigate('/contests')}>
            <ArrowLeft size={16} /> Back to Contests
          </button>
          <div className="menti-bar-actions">
            <button className="menti-btn menti-btn-outline" onClick={fetchLeaderboard}>
              <RefreshCw size={15} /> Refresh Leaderboard
            </button>
          </div>
        </div>

        {/* Hero Header */}
        <section className="menti-leaderboard-hero">
          <div className="lb-hero-content">
            <div className="menti-header-badge">
              <Trophy size={15} />
              <span>OFFICIAL COMPETITIVE LEADERBOARD</span>
            </div>
            <h1 className="menti-header-title">
              {leaderboard?.contestTitle || 'Live Contest Leaderboard'}
            </h1>
            <p className="menti-header-desc">
              National rankings computed in real time: Total Marks &gt; Correct Answers &gt; Accuracy &gt; Completion Time.
            </p>
          </div>

          {/* WebSocket Status Indicator */}
          <div className="lb-connection-status">
            {connectionStatus === 'CONNECTED' ? (
              <div className="status-indicator-box online">
                <span className="live-pulse" />
                <Wifi size={16} />
                <span>WebSocket Live Stream Active</span>
              </div>
            ) : connectionStatus === 'RECONNECTING' ? (
              <div className="status-indicator-box reconnect">
                <RefreshCw size={15} className="menti-spinning" />
                <span>Reconnecting to Live Stream...</span>
              </div>
            ) : (
              <div className="status-indicator-box offline">
                <WifiOff size={16} />
                <span>WebSocket Offline (Auto-Polling)</span>
              </div>
            )}
            {lastUpdated && (
              <span className="last-sync-text">
                Last updated at {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </section>

        {/* Summary Metric Counters */}
        {leaderboard && (
          <div className="menti-highlights-row" style={{ marginBottom: '2rem' }}>
            <div className="menti-highlight-card">
              <Users size={20} className="menti-highlight-icon" />
              <div>
                <div className="menti-highlight-val">{leaderboard.totalParticipants || 0}</div>
                <div className="menti-highlight-sub">Total Aspirants</div>
              </div>
            </div>
            <div className="menti-highlight-card">
              <Award size={20} className="menti-highlight-icon" />
              <div>
                <div className="menti-highlight-val">{leaderboard.highestScore || 0} / 60</div>
                <div className="menti-highlight-sub">Highest Score</div>
              </div>
            </div>
            <div className="menti-highlight-card">
              <Clock size={20} className="menti-highlight-icon" />
              <div>
                <div className="menti-highlight-val">
                  {typeof leaderboard.averageScore === 'number' ? leaderboard.averageScore.toFixed(1) : 0} / 60
                </div>
                <div className="menti-highlight-sub">Average Score</div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="menti-alert menti-alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* TOP 3 PODIUM SECTION */}
        {top3.length > 0 && (
          <section className="podium-section">
            <h2 className="menti-section-title">Top 3 National Performers</h2>
            <div className="podium-grid">
              {top3.map((entry) => (
                <div key={entry.rank} className={`podium-card podium-rank-${entry.rank}`}>
                  <div className="podium-medal-badge">
                    {getRankBadge(entry.rank)}
                  </div>
                  <div className="podium-avatar">
                    {entry.participantName.charAt(0).toUpperCase()}
                  </div>
                  <div className="podium-name">{entry.participantName}</div>
                  <div className="podium-score">
                    <strong>{entry.totalScore}</strong> / 60 Marks
                  </div>
                  <div className="podium-meta-row">
                    <span>{entry.accuracyPercent}% Accuracy</span>
                    <span>·</span>
                    <span>{Math.floor(entry.completionTimeSecs / 60)}m {entry.completionTimeSecs % 60}s</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FULL LEADERBOARD TABLE */}
        <section className="leaderboard-table-container">
          <div className="lb-table-header">
            <h2 className="menti-section-title" style={{ margin: 0 }}>
              Complete Leaderboard Standings
            </h2>
          </div>

          {loading ? (
            <div className="menti-loading-state" style={{ minHeight: '30vh' }}>
              <div className="menti-spinner" />
              <p>Fetching rankings from server...</p>
            </div>
          ) : !leaderboard?.top10 || leaderboard.top10.length === 0 ? (
            <div className="menti-empty-state">
              <Trophy size={48} className="menti-empty-icon" />
              <h3 className="menti-empty-title">No Submissions Recorded Yet</h3>
              <p className="menti-empty-desc">
                Be the first contestant to submit their test and lead the All-India leaderboard!
              </p>
            </div>
          ) : (
            <div className="menti-table-card">
              <table className="menti-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '85px' }}>Rank</th>
                    <th>Aspirant</th>
                    <th>Score / 60</th>
                    <th>Correct</th>
                    <th>Accuracy</th>
                    <th>Completion Time</th>
                    <th>Submission Time</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.top10.map((entry) => {
                    const isSelf = entry.isCurrentParticipant;
                    const isRankChanged = Boolean(highlightRanks[entry.participantName]);

                    return (
                      <tr
                        key={entry.participantName + entry.rank}
                        className={`${isSelf ? 'row-self' : ''} ${isRankChanged ? 'row-rank-updated' : ''}`}
                      >
                        <td>{getRankBadge(entry.rank)}</td>
                        <td>
                          <div className="table-user-cell">
                            <div className="user-avatar-tiny">
                              {entry.participantName.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-name-box">
                              <strong>{entry.participantName}</strong>
                              {isSelf && <span className="you-pill">YOU</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="table-score-val">{entry.totalScore}</span>
                        </td>
                        <td>{entry.totalCorrect} / 15</td>
                        <td>
                          <span className={`table-acc-pill ${entry.accuracyPercent >= 80 ? 'high' : ''}`}>
                            {entry.accuracyPercent}%
                          </span>
                        </td>
                        <td>
                          {Math.floor(entry.completionTimeSecs / 60)}m {entry.completionTimeSecs % 60}s
                        </td>
                        <td className="table-time-cell">
                          {entry.submittedAt
                            ? new Date(entry.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Current Participant Pinned Rank Card (if outside Top 10) */}
          {leaderboard?.currentUserEntry && leaderboard.currentUserEntry.rank > 10 && (
            <div className="pinned-standing-card">
              <div className="pinned-badge-chip">YOUR ALL-INDIA STANDING</div>
              <div className="pinned-content-row">
                <div className="pinned-rank-large">
                  Rank #{leaderboard.currentUserEntry.rank}
                </div>
                <div className="pinned-user-info">
                  <div className="pinned-name">{leaderboard.currentUserEntry.participantName}</div>
                  <div className="pinned-exam">JEE Challenge Submission</div>
                </div>
                <div className="pinned-metric">
                  <span className="p-lbl">Score</span>
                  <span className="p-val">{leaderboard.currentUserEntry.totalScore} / 60</span>
                </div>
                <div className="pinned-metric">
                  <span className="p-lbl">Accuracy</span>
                  <span className="p-val">{leaderboard.currentUserEntry.accuracyPercent}%</span>
                </div>
                <div className="pinned-metric">
                  <span className="p-lbl">Time</span>
                  <span className="p-val">
                    {Math.floor(leaderboard.currentUserEntry.completionTimeSecs / 60)}m {leaderboard.currentUserEntry.completionTimeSecs % 60}s
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ContestLeaderboard;
