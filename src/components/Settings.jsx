import React, { useEffect, useState } from 'react';
import {
  Form,
  InputNumber,
  Switch,
  Button,
  Card,
  Typography,
  Space,
  message,
  Skeleton,
} from 'antd';
import {
  CoffeeOutlined,
  ExperimentOutlined,
  DesktopOutlined,
  SaveOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// ─── Settings ─────────────────────────────────────────────────────────────────

export default function Settings({ settings, onSave }) {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      form.setFieldsValue(settings);
      setHasChanges(false);
    }
  }, [settings, form]);

  const handleFinish = async (values) => {
    await onSave(values);
    setHasChanges(false);
    messageApi.success({
      content: 'Settings saved. Timers have been reset.',
      duration: 2.5,
    });
  };

  if (!settings) {
    return (
      <div style={{ paddingTop: 20 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 20, maxWidth: 560 }}>
      {contextHolder}

      <Form
        form={form}
        layout="horizontal"
        labelCol={{ style: { minWidth: 130 } }}
        onFinish={handleFinish}
        onValuesChange={() => setHasChanges(true)}
        initialValues={settings}
      >
        {/* Break Reminder */}
        <Card
          style={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 14 }}
          styles={{ body: { padding: '18px 22px' } }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Space align="center" size={10}>
              <span style={{ width: 34, height: 34, borderRadius: 8, background: '#f9731618', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: '#f97316' }}>
                <CoffeeOutlined />
              </span>
              <div>
                <Text style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'block' }}>Break Reminder</Text>
                <Text style={{ fontSize: 13, color: '#6b7280' }}>Remind you to stand up and stretch</Text>
              </div>
            </Space>
            <Form.Item name={['break', 'enabled']} valuePropName="checked" noStyle>
              <Switch size="small" />
            </Form.Item>
          </div>
          <Form.Item
            label={<Text style={{ fontSize: 13 }}>Every</Text>}
            name={['break', 'interval']}
            rules={[{ required: true, type: 'number', min: 1, max: 480 }]}
            style={{ marginBottom: 0 }}
          >
            <InputNumber
              min={1}
              max={480}
              addonAfter="minutes"
              style={{ width: 160 }}
            />
          </Form.Item>
        </Card>

        {/* Water Reminder */}
        <Card
          style={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 14 }}
          styles={{ body: { padding: '18px 22px' } }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Space align="center" size={10}>
              <span style={{ width: 34, height: 34, borderRadius: 8, background: '#0ea5e918', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: '#0ea5e9' }}>
                <ExperimentOutlined />
              </span>
              <div>
                <Text style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'block' }}>Water Reminder</Text>
                <Text style={{ fontSize: 13, color: '#6b7280' }}>Keep yourself hydrated throughout the day</Text>
              </div>
            </Space>
            <Form.Item name={['water', 'enabled']} valuePropName="checked" noStyle>
              <Switch size="small" />
            </Form.Item>
          </div>
          <Form.Item
            label={<Text style={{ fontSize: 13 }}>Every</Text>}
            name={['water', 'interval']}
            rules={[{ required: true, type: 'number', min: 1, max: 480 }]}
            style={{ marginBottom: 0 }}
          >
            <InputNumber
              min={1}
              max={480}
              addonAfter="minutes"
              style={{ width: 160 }}
            />
          </Form.Item>
        </Card>

        {/* Screen Time */}
        <Card
          style={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 24 }}
          styles={{ body: { padding: '18px 22px' } }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Space align="center" size={10}>
              <span style={{ width: 34, height: 34, borderRadius: 8, background: '#8b5cf618', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: '#8b5cf6' }}>
                <DesktopOutlined />
              </span>
              <div>
                <Text style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'block' }}>Screen Break</Text>
                <Text style={{ fontSize: 13, color: '#6b7280' }}>Take a short break after set time</Text>
              </div>
            </Space>
            <Form.Item name={['screenTime', 'enabled']} valuePropName="checked" noStyle>
              <Switch size="small" />
            </Form.Item>
          </div>
          <Form.Item
            label={<Text style={{ fontSize: 13 }}>Alert after</Text>}
            name={['screenTime', 'threshold']}
            rules={[{ required: true, type: 'number', min: 1, max: 1440 }]}
            style={{ marginBottom: 0 }}
          >
            <InputNumber
              min={1}
              max={1440}
              addonAfter="minutes"
              style={{ width: 160 }}
            />
          </Form.Item>
        </Card>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            disabled={!hasChanges}
            style={{ fontSize: 14, height: 38, paddingInline: 24, borderRadius: 8 }}
          >
            Save Settings
          </Button>
        </Form.Item>

        <Text style={{ fontSize: 13, color: '#9ca3af' }}>
          Saving resets all active timers to their new intervals.
        </Text>
      </Form>
    </div>
  );
}
