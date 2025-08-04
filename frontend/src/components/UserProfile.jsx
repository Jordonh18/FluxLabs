import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { userAPI } from '../services/api';

export function UserProfile({ userId }) {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
  });
  const [settings, setSettings] = useState({
    auto_extend_labs: false,
    default_duration: 60,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
    loadSettings();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const response = await userAPI.getProfile(userId);
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await userAPI.getSettings(userId);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await userAPI.updateProfile(userId, profile);
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await userAPI.updateSettings(userId, settings);
      setMessage('Settings updated successfully!');
    } catch (error) {
      setMessage('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profile.first_name}
                onChange={(e) => setProfile({...profile, first_name: e.target.value})}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profile.last_name}
                onChange={(e) => setProfile({...profile, last_name: e.target.value})}
                placeholder="Enter last name"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lab Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoExtend"
                checked={settings.auto_extend_labs}
                onChange={(e) => setSettings({...settings, auto_extend_labs: e.target.checked})}
                className="rounded border-gray-300"
              />
              <Label htmlFor="autoExtend">Auto-extend labs when near expiry</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultDuration">Default Lab Duration (minutes)</Label>
              <Input
                id="defaultDuration"
                type="number"
                min="30"
                max="480"
                value={settings.default_duration}
                onChange={(e) => setSettings({...settings, default_duration: parseInt(e.target.value)})}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {message && (
        <div className={`text-sm p-3 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
