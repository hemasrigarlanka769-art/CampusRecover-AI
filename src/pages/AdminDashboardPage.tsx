import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Layers,
  Sparkles,
  Sliders,
  ShieldAlert,
  Activity,
  CheckCircle2,
  FileCheck2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.js';
import { User, AuditLog, AIWeightsConfig, UserRole } from '../types/index.js';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [aiConfig, setAiConfig] = useState<AIWeightsConfig>({
    textWeight: 0.35,
    imageWeight: 0.35,
    metadataWeight: 0.20,
    locationWeight: 0.05,
    timeWeight: 0.05,
    minThreshold: 60,
  });
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'ai' | 'users' | 'audit'>('overview');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [s, u, cfg, logs] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAiConfig(),
        api.getAuditLogs(),
      ]);
      setStats(s);
      setUsers(u);
      setAiConfig(cfg);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  const handleSaveAiWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await api.updateAiConfig(aiConfig);
      setConfigSaveSuccess(true);
      setTimeout(() => setConfigSaveSuccess(false), 3000);
      loadAdminData();
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      loadAdminData();
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Campus Security &amp; Admin Console
            </h1>
            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold border border-purple-100">
              Role: System Administrator
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Central telemetry, AI matching parameter calibration, user role provisioning, and audit logs.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveAdminTab('overview')}
            className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
              activeAdminTab === 'overview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveAdminTab('ai')}
            className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
              activeAdminTab === 'ai' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            AI Tuning
          </button>
          <button
            onClick={() => setActiveAdminTab('users')}
            className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
              activeAdminTab === 'users' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('audit')}
            className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
              activeAdminTab === 'audit' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Audit Log
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeAdminTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Key Metrics Grid with tabular figures */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Users</span>
              <p className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 mt-2">
                {stats.totalUsers}
              </p>
              <p className="text-[10px] text-slate-600 mt-1">Verified university members</p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold uppercase">Reports Logged</span>
              <p className="text-3xl font-extrabold font-mono tabular-nums text-indigo-600 mt-2">
                {stats.totalLost + stats.totalFound}
              </p>
              <p className="text-[10px] text-slate-600 mt-1 font-mono">
                {stats.totalLost} lost · {stats.totalFound} found
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold uppercase">AI Matches Found</span>
              <p className="text-3xl font-extrabold font-mono tabular-nums text-purple-600 mt-2">
                {stats.totalMatches}
              </p>
              <p className="text-[10px] text-slate-600 mt-1">
                {stats.pendingClaims} pending ownership reviews
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold uppercase">Return Success Rate</span>
              <p className="text-3xl font-extrabold font-mono tabular-nums text-emerald-600 mt-2">
                {stats.returnRate}%
              </p>
              <p className="text-[10px] text-emerald-700 font-medium mt-1">
                {stats.itemsReturned} verified returned items
              </p>
            </div>
          </div>

          {/* Categories Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Campus Lost vs. Found Category Distribution
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="grid grid-cols-12 py-2 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
                <span className="col-span-6">Category</span>
                <span className="col-span-3 text-right">Lost Cases</span>
                <span className="col-span-3 text-right">Found Cases</span>
              </div>
              {Object.entries(stats.categories || {}).map(([cat, counts]: [string, any]) => (
                <div key={cat} className="grid grid-cols-12 py-3 items-center">
                  <span className="col-span-6 font-medium text-slate-900">{cat}</span>
                  <span className="col-span-3 text-right font-mono tabular-nums text-indigo-700">
                    {counts.lost}
                  </span>
                  <span className="col-span-3 text-right font-mono tabular-nums text-emerald-700">
                    {counts.found}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI TUNING TAB */}
      {activeAdminTab === 'ai' && (
        <form onSubmit={handleSaveAiWeights} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
              <Sliders className="w-4 h-4" />
              <span>AI Algorithm Tuning</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Multimodal Matching Formula Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Adjust how the AI calculates match confidence scores across text, vision, metadata, campus location, and time proximity.
            </p>
          </div>

          {configSaveSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Matching weights updated and saved to server successfully.</span>
            </div>
          )}

          <div className="space-y-6 max-w-2xl">
            {/* Text Weight */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Text Description Similarity Weight</span>
                <span className="font-mono text-indigo-600">{Math.round(aiConfig.textWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.6"
                step="0.05"
                value={aiConfig.textWeight}
                onChange={(e) => setAiConfig({ ...aiConfig, textWeight: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-600 mt-0.5">Semantic tokens, embeddings, and keyword overlap</p>
            </div>

            {/* Image Weight */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Image / Vision Similarity Weight</span>
                <span className="font-mono text-indigo-600">{Math.round(aiConfig.imageWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.6"
                step="0.05"
                value={aiConfig.imageWeight}
                onChange={(e) => setAiConfig({ ...aiConfig, imageWeight: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-600 mt-0.5">Visual object detection, shape, and color histograms</p>
            </div>

            {/* Metadata Weight */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Metadata Match Weight (Category, Brand, Color)</span>
                <span className="font-mono text-indigo-600">{Math.round(aiConfig.metadataWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.4"
                step="0.05"
                value={aiConfig.metadataWeight}
                onChange={(e) => setAiConfig({ ...aiConfig, metadataWeight: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Location Weight */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Campus Location Proximity Weight</span>
                <span className="font-mono text-indigo-600">{Math.round(aiConfig.locationWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.2"
                step="0.01"
                value={aiConfig.locationWeight}
                onChange={(e) => setAiConfig({ ...aiConfig, locationWeight: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Time Weight */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Time Delta Proximity Weight</span>
                <span className="font-mono text-indigo-600">{Math.round(aiConfig.timeWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.2"
                step="0.01"
                value={aiConfig.timeWeight}
                onChange={(e) => setAiConfig({ ...aiConfig, timeWeight: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Minimum Threshold */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Minimum Match Alert Threshold</span>
                <span className="font-mono text-emerald-600">{aiConfig.minThreshold}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="85"
                step="5"
                value={aiConfig.minThreshold}
                onChange={(e) => setAiConfig({ ...aiConfig, minThreshold: parseInt(e.target.value, 10) })}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-600 mt-0.5">
                Matches scoring below this cut-off will not generate automatic user notifications.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSavingConfig}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {isSavingConfig ? 'Saving...' : 'Apply Calibrated Weights'}
            </button>
          </div>
        </form>
      )}

      {/* USERS MANAGEMENT TAB */}
      {activeAdminTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">University Members Directory</h3>
            <span className="text-xs text-slate-500">{users.length} registered campus users</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Campus ID</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-[11px] text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono">{u.studentId}</td>
                    <td className="px-5 py-3.5 text-slate-600">{u.department}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                        VERIFIED
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="text-[11px] border border-slate-200 rounded px-2 py-1 bg-white font-medium text-slate-700 focus:outline-none"
                      >
                        <option value="STUDENT">Student</option>
                        <option value="FACULTY">Faculty</option>
                        <option value="CAMPUS_STAFF">Staff</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {activeAdminTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-2">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Immutable System Audit Trail</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological log of report creations, AI scans, ownership claims, and physical returns.
            </p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-900">{log.actorName}</span>
                    <span className="text-slate-600">({log.actorRole})</span>
                  </div>
                  <p className="text-slate-600">{log.details}</p>
                </div>
                <span className="text-[11px] font-mono text-slate-600 shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
