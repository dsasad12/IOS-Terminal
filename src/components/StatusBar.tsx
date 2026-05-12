import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSizes } from '../theme/colors';

interface Props {
  cwd: string;
  user: string;
  hostname: string;
  isRunning?: boolean;
}

export const HackStatusBar: React.FC<Props> = ({ cwd, user, hostname, isRunning }) => {
  const [time, setTime] = useState('');
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTime(`${h}:${m}:${s}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setBlink(b => !b), 600);
    return () => clearInterval(timer);
  }, []);

  const displayPath = cwd === '/home/root' ? '~' :
    cwd.startsWith('/home/root/') ? '~' + cwd.slice(10) : cwd;

  return (
    <View style={styles.bar}>
      {/* Left: connection status */}
      <View style={styles.section}>
        <View style={[styles.dot, isRunning ? styles.dotRunning : styles.dotIdle]} />
        <Text style={styles.label}>
          {isRunning ? 'EXEC' : 'IDLE'}
        </Text>
      </View>

      {/* Center: user@host:path */}
      <View style={styles.centerSection}>
        <Text style={styles.user}>{user}</Text>
        <Text style={styles.separator}>@</Text>
        <Text style={styles.host}>{hostname}</Text>
        <Text style={styles.separator}>:</Text>
        <Text style={styles.path} numberOfLines={1}>{displayPath}</Text>
      </View>

      {/* Right: time */}
      <View style={styles.section}>
        <Text style={[styles.time, !blink && styles.timeDim]}>{time}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundTertiary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  centerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  dotIdle: {
    backgroundColor: Colors.textMuted,
  },
  dotRunning: {
    backgroundColor: Colors.hackGreen,
  },
  label: {
    fontFamily: FontFamily.mono,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  user: {
    fontFamily: FontFamily.mono,
    fontSize: FontSizes.xs,
    color: Colors.promptUser,
  },
  separator: {
    fontFamily: FontFamily.mono,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  host: {
    fontFamily: FontFamily.mono,
    fontSize: FontSizes.xs,
    color: Colors.promptUser,
  },
  path: {
    fontFamily: FontFamily.mono,
    fontSize: FontSizes.xs,
    color: Colors.promptPath,
    flexShrink: 1,
  },
  time: {
    fontFamily: FontFamily.mono,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    minWidth: 60,
    letterSpacing: 1,
  },
  timeDim: {
    color: Colors.textDim,
  },
});
