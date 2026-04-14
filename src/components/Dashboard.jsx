import React from 'react';
import { Row, Col, Card, Progress, Typography, Button, Tooltip, Skeleton, Tag } from 'antd';
import {
  CoffeeOutlined,
  ExperimentOutlined,
  DesktopOutlined,
  ReloadOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatElapsed(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── ReminderCard ─────────────────────────────────────────────────────────────

function ReminderCard({
  icon,
  label,
  description,
  color,
  percent,
  countdown,
  enabled,
  stopped,
  onReset,
}) {
  const isRunning = enabled && !stopped;

  let statusTag;
  if (!enabled) {
    statusTag = (
      <Tag color="default" style={{ fontSize: 12, fontWeight: 500, border: 'none', borderRadius: 6 }}>
        OFF
      </Tag>
    );
  } else if (stopped) {
    statusTag = (
      <Tag
        icon={<PauseCircleOutlined />}
        style={{
          fontSize: 12,
          fontWeight: 500,
          border: 'none',
          borderRadius: 6,
          background: '#fef3c7',
          color: '#d97706',
        }}
      >
        Stopped
      </Tag>
    );
  } else {
    statusTag = (
      <Tag color="green" style={{ fontSize: 12, fontWeight: 500, border: 'none', borderRadius: 6 }}>
        ON
      </Tag>
    );
  }

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: stopped ? `1px solid ${color}44` : '1px solid #f0f0f0',
        height: '100%',
        transition: 'border-color 0.3s',
      }}
      styles={{ body: { padding: 24 } }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: `${color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color,
            }}
          >
            {icon}
          </span>
          <div>
            <Text style={{ fontSize: 14, fontWeight: 600, display: 'block', color: '#111827' }}>
              {label}
            </Text>
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>{description}</Text>
          </div>
        </div>
        {statusTag}
      </div>

      {/* Progress circle */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <Progress
          type="circle"
          percent={enabled ? Math.min(100, percent) : 0}
          strokeColor={stopped ? `${color}88` : (enabled ? color : '#d9d9d9')}
          trailColor="#f3f4f6"
          size={110}
          format={() => (
            <div style={{ textAlign: 'center' }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: stopped ? '#9ca3af' : (enabled ? '#111827' : '#9ca3af'),
                  letterSpacing: '-0.5px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {countdown}
              </Text>
            </div>
          )}
        />

        <Tooltip title={stopped ? 'Restart timer' : 'Reset timer'}>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={onReset}
            disabled={!enabled}
            type={stopped ? 'primary' : 'default'}
            style={{
              fontSize: 13,
              borderRadius: 6,
              ...(stopped ? { background: color, borderColor: color } : {}),
            }}
          >
            {stopped ? 'Restart' : 'Reset'}
          </Button>
        </Tooltip>
      </div>
    </Card>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard({ timerState, onReset }) {
  if (!timerState) {
    return (
      <div style={{ padding: '20px 0' }}>
        <Row gutter={[20, 20]}>
          {[0, 1, 2].map((i) => (
            <Col key={i} xs={24} sm={12} lg={8}>
              <Card style={{ borderRadius: 12 }}>
                <Skeleton active />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  const { break: br, water, screenTime } = timerState;

  const breakPercent = br.total > 0
    ? ((br.total - br.remaining) / br.total) * 100
    : 0;

  const waterPercent = water.total > 0
    ? ((water.total - water.remaining) / water.total) * 100
    : 0;

  const screenPercent = screenTime.threshold > 0
    ? (screenTime.elapsed / screenTime.threshold) * 100
    : 0;

  return (
    <div style={{ paddingTop: 20 }}>
      {/* Screen time summary bar */}
      {screenTime.enabled && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #f0f0f0',
            borderRadius: 10,
            padding: '12px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 13, color: '#6b7280' }}>
            Screen time this session
          </Text>
          <Text style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
            {formatElapsed(screenTime.elapsed)}
            <Text style={{ fontSize: 13, color: '#9ca3af', fontWeight: 400 }}>
              {' '}/ {formatElapsed(screenTime.threshold)}
            </Text>
          </Text>
        </div>
      )}

      <Row gutter={[20, 20]}>
        {/* Break reminder */}
        <Col xs={24} sm={8}>
          <ReminderCard
            icon={<CoffeeOutlined />}
            label="Break Reminder"
            description="Stand up & stretch"
            color="#f97316"
            percent={breakPercent}
            countdown={formatTime(br.remaining)}
            enabled={br.enabled}
            stopped={br.stopped}
            onReset={() => onReset('break')}
          />
        </Col>

        {/* Water reminder */}
        <Col xs={24} sm={8}>
          <ReminderCard
            icon={<ExperimentOutlined />}
            label="Water Reminder"
            description="Stay hydrated"
            color="#0ea5e9"
            percent={waterPercent}
            countdown={formatTime(water.remaining)}
            enabled={water.enabled}
            stopped={water.stopped}
            onReset={() => onReset('water')}
          />
        </Col>

        {/* Screen time */}
        <Col xs={24} sm={8}>
          <ReminderCard
            icon={<DesktopOutlined />}
            label="Screen Break"
            description="Take a break after set time"
            color="#8b5cf6"
            percent={screenPercent}
            countdown={formatElapsed(screenTime.elapsed)}
            enabled={screenTime.enabled}
            stopped={screenTime.stopped}
            onReset={() => onReset('screenTime')}
          />
        </Col>
      </Row>

      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <Text style={{ fontSize: 13, color: '#9ca3af' }}>
          made with ♥ by{' '}
          <a
            href="https://gopu.work"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#9ca3af', textDecoration: 'underline', textUnderlineOffset: 3 }}
            onClick={(e) => { e.preventDefault(); window.electronAPI.openExternal('https://gopu.work'); }}
          >
            Gopu
          </a>
        </Text>
      </div>
    </div>
  );
}
