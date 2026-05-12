import React, { useState, useEffect } from 'react';

interface Props {
  user: string;
  host: string;
  path: string;
  isRunning: boolean;
}

export const StatusBar: React.FC<Props> = ({ user, host, path, isRunning }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const h = String(n.getHours()).padStart(2, '0');
      const m = String(n.getMinutes()).padStart(2, '0');
      const s = String(n.getSeconds()).padStart(2, '0');
      setTime(`${h}:${m}:${s}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const displayPath = path === '/home/root' ? '~' :
    path.startsWith('/home/root/') ? '~' + path.slice(10) : path;

  return (
    <div className="status-bar">
      <div className="status-left">
        <div className={`status-dot ${isRunning ? 'running' : ''}`} />
        <span className={`status-label ${isRunning ? 'running' : ''}`}>
          {isRunning ? 'EXEC' : 'IDLE'}
        </span>
      </div>
      <div className="status-center">
        <span className="status-user">{user}</span>
        <span className="status-at">@</span>
        <span className="status-host">{host}</span>
        <span className="status-sep">:</span>
        <span className="status-path">{displayPath}</span>
      </div>
      <div className="status-right">{time}</div>
    </div>
  );
};
