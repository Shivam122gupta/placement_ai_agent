import React, { useEffect, useState } from 'react';
import { profileService } from '../services/profileService';
import { Profile } from '../types/profile';
import {
  User,
  Award,
  GraduationCap,
  Briefcase,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Sparkles,
  Building2,
  ExternalLink,
  RefreshCw,
  Mail,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSyncing, setAutoSyncing] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [targetRoles, setTargetRoles] = useState('');
  const [preferredLocations, setPreferredLocations] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('0-1 years');

  // Skill input
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Programming Languages');

  // Project input
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjTech, setNewProjTech] = useState('');
  const [newProjGithub, setNewProjGithub] = useState('');

  // Education input
  const [newEduDegree, setNewEduDegree] = useState('');
  const [newEduCollege, setNewEduCollege] = useState('');
  const [newEduYear, setNewEduYear] = useState('');

  // Experience input
  const [newExpCompany, setNewExpCompany] = useState('');
  const [newExpRole, setNewExpRole] = useState('');
  const [newExpDuration, setNewExpDuration] = useState('');
  const [newExpHighlights, setNewExpHighlights] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const populateFormFields = (data: Profile) => {
    setProfile(data);
    setFullName(data.full_name || '');
    setHeadline(data.headline || '');
    setBio(data.bio || '');
    setLocation(data.location || '');
    setPhone(data.phone || '');
    setLinkedinUrl(data.linkedin_url || '');
    setGithubUrl(data.github_url || '');
    setTargetRoles(data.target_roles?.join(', ') || '');
    setPreferredLocations(data.preferred_locations?.join(', ') || '');
    setExperienceLevel(data.experience_level || '0-1 years');
  };

  const loadProfile = async () => {
    try {
      const data = await profileService.getProfile();
      populateFormFields(data);
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSyncFromResume = async () => {
    setAutoSyncing(true);
    setSuccessMsg(null);
    try {
      const updated = await profileService.autoSyncLatestResume();
      populateFormFields(updated);
      setSuccessMsg('⚡ Profile successfully auto-populated from your latest resume! Name, education, experience, and skills updated.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to auto-populate from resume.';
      alert(msg);
    } finally {
      setAutoSyncing(false);
    }
  };

  const handleResendVerification = async () => {
    setResendingEmail(true);
    try {
      const msg = await authService.resendVerification();
      setSuccessMsg(`✉️ ${msg}`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to resend verification email.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleUpdateBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      const updated = await profileService.updateProfile({
        full_name: fullName,
        headline,
        bio,
        location,
        phone,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        target_roles: targetRoles.split(',').map((r) => r.trim()).filter(Boolean),
        preferred_locations: preferredLocations.split(',').map((l) => l.trim()).filter(Boolean),
        experience_level: experienceLevel,
      });
      populateFormFields(updated);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    try {
      const updated = await profileService.addSkill({
        name: newSkillName.trim(),
        category: newSkillCategory,
        proficiency: 'Intermediate',
      });
      setProfile(updated);
      setNewSkillName('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      const updated = await profileService.deleteSkill(id);
      setProfile(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpCompany.trim() || !newExpRole.trim()) return;
    try {
      const updated = await profileService.addExperience({
        company: newExpCompany.trim(),
        role: newExpRole.trim(),
        duration: newExpDuration.trim() || undefined,
        highlights: newExpHighlights.split('\n').map((h) => h.trim()).filter(Boolean),
      });
      setProfile(updated);
      setNewExpCompany('');
      setNewExpRole('');
      setNewExpDuration('');
      setNewExpHighlights('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      const updated = await profileService.deleteExperience(id);
      setProfile(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim() || !newProjDesc.trim()) return;
    try {
      const updated = await profileService.addProject({
        name: newProjName.trim(),
        description: newProjDesc.trim(),
        technologies: newProjTech.split(',').map((t) => t.trim()).filter(Boolean),
        github_url: newProjGithub.trim() || undefined,
      });
      setProfile(updated);
      setNewProjName('');
      setNewProjDesc('');
      setNewProjTech('');
      setNewProjGithub('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const updated = await profileService.deleteProject(id);
      setProfile(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEduDegree.trim() || !newEduCollege.trim()) return;
    try {
      const updated = await profileService.addEducation({
        degree: newEduDegree.trim(),
        college: newEduCollege.trim(),
        graduation_year: newEduYear ? parseInt(newEduYear) : undefined,
      });
      setProfile(updated);
      setNewEduDegree('');
      setNewEduCollege('');
      setNewEduYear('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      const updated = await profileService.deleteEducation(id);
      setProfile(updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FAF8F5]/20 border-t-[#FAF8F5]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 text-[#FAF8F5]">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#FAF8F5]/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-normal tracking-tight text-white">Candidate Profile</h1>
          <p className="text-xs text-[#E8E2D6]/75 mt-1 font-sans">
            Zero-manual data entry: Upload your resume or synchronize below to populate education, experience, and verified skills.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAutoSyncFromResume}
            disabled={autoSyncing}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] px-4 py-2 text-xs font-semibold text-white transition shadow-lg shadow-[#FF6B6B]/25 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {autoSyncing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-white" />
            )}
            <span>{autoSyncing ? 'Auto-Syncing Profile...' : '1-Click Auto-Fill from Resume'}</span>
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-[#FAF8F5]/20 bg-[#121214] px-3.5 py-2 shadow-sm">
            <span className="text-xs font-mono font-medium text-[#FAF8F5]">
              Readiness: <strong className="text-white">{profile?.completion_score || 0}%</strong>
            </span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-[#FAF8F5]/10 border border-[#FAF8F5]/30 p-4 text-xs text-[#FAF8F5] shadow-xl">
          <CheckCircle className="h-4 w-4 shrink-0 text-[#FAF8F5]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Account & Email Verification Status Strip */}
      {user && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 backdrop-blur-xl ${
          user.is_verified
            ? 'bg-emerald-500/[0.06] border-emerald-500/25'
            : 'bg-amber-500/[0.08] border-amber-500/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${user.is_verified ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-300'}`}>
              {user.is_verified ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">{user.email}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium ${
                  user.is_verified
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                }`}>
                  {user.is_verified ? 'Verified Account' : 'Unverified Email'}
                </span>
              </div>
              <p className="text-[11px] text-[#E8E2D6]/80 mt-0.5">
                {user.is_verified
                  ? 'Your account security is verified. Real-time grounding and notifications are enabled.'
                  : 'Please verify your email address to enable official job application delivery and interview invites.'}
              </p>
            </div>
          </div>

          {!user.is_verified && (
            <button
              onClick={handleResendVerification}
              disabled={resendingEmail}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3.5 py-1.5 text-xs font-medium text-amber-200 transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{resendingEmail ? 'Sending...' : 'Resend Verification Email'}</span>
            </button>
          )}
        </div>
      )}

      {/* 1. Basic & Career Preferences Form */}
      <div className="rounded-3xl border border-[#FAF8F5]/15 bg-[#121214] p-6 md:p-8 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-white border-b border-[#FAF8F5]/10 pb-4">
          <div className="p-1.5 rounded-lg bg-[#FAF8F5]/10 border border-[#FAF8F5]/20">
            <User className="h-4 w-4 text-[#FAF8F5]" />
          </div>
          <span>Personal & Career Preferences</span>
        </div>

        <form onSubmit={handleUpdateBasic} className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">Candidate Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ankit Sharma"
              className="mt-1.5 w-full rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#FAF8F5]/30 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">Professional Headline</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Junior Backend Developer | Python & FastAPI"
              className="mt-1.5 w-full rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#FAF8F5]/30 transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">Professional Bio / Summary</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Computer Science graduate passionate about high-throughput APIs, RAG pipelines, and distributed systems..."
              rows={2}
              className="mt-1.5 w-full rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#FAF8F5]/30 transition font-sans"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">Current Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bengaluru, India"
              className="mt-1.5 w-full rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#FAF8F5]/30 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">Contact Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="mt-1.5 w-full rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#FAF8F5]/30 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">LinkedIn URL</label>
            <input
              type="text"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="mt-1.5 w-full rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#FAF8F5]/30 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">GitHub URL</label>
            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              className="mt-1.5 w-full rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#FAF8F5]/30 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">Target Roles (comma separated)</label>
            <input
              type="text"
              value={targetRoles}
              onChange={(e) => setTargetRoles(e.target.value)}
              placeholder="e.g. Backend Developer, AI Engineer"
              className="mt-1.5 w-full rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#FAF8F5]/30 transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/70">Preferred Locations</label>
            <input
              type="text"
              value={preferredLocations}
              onChange={(e) => setPreferredLocations(e.target.value)}
              placeholder="e.g. Bengaluru, Remote"
              className="mt-1.5 w-full rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#FAF8F5]/30 transition"
            />
          </div>

          <div className="md:col-span-2 flex justify-end mt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] px-5 py-2.5 text-xs font-semibold text-white transition disabled:opacity-50 cursor-pointer shadow-md shadow-[#FF6B6B]/25 active:scale-95"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Saving...' : 'Save Personal Details'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Education History */}
      <div className="rounded-3xl border border-[#FAF8F5]/15 bg-[#121214] p-6 md:p-8 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-white border-b border-[#FAF8F5]/10 pb-4">
          <div className="p-1.5 rounded-lg bg-[#FAF8F5]/10 border border-[#FAF8F5]/20">
            <GraduationCap className="h-4 w-4 text-[#FAF8F5]" />
          </div>
          <span>Education & Academic History ({profile?.education?.length || 0})</span>
        </div>

        <div className="mt-5 space-y-3">
          {profile?.education && profile.education.length > 0 ? (
            profile.education.map((edu) => (
              <div
                key={edu.id}
                className="flex items-center justify-between rounded-2xl border border-[#FAF8F5]/10 bg-black/40 p-4 hover:border-[#FAF8F5]/30 transition"
              >
                <div>
                  <h4 className="text-xs font-semibold text-white">{edu.degree}</h4>
                  <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                    <span className="text-white font-semibold">{edu.college}</span>
                    {edu.branch ? ` • ${edu.branch}` : ''}
                    {edu.graduation_year ? ` • Class of ${edu.graduation_year}` : ''}
                    {edu.cgpa ? ` • CGPA: ${edu.cgpa}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteEducation(edu.id)}
                  className="text-neutral-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/[0.05] transition cursor-pointer"
                  title="Remove education"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-500 font-mono">No education records added yet. Upload resume to auto-fill.</p>
          )}
        </div>

        {/* Add Education Form */}
        <form onSubmit={handleAddEducation} className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#FAF8F5]/10 pt-5">
          <input
            type="text"
            value={newEduDegree}
            onChange={(e) => setNewEduDegree(e.target.value)}
            placeholder="Degree (e.g. B.Tech Computer Science)"
            className="flex-1 min-w-[180px] rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none"
          />
          <input
            type="text"
            value={newEduCollege}
            onChange={(e) => setNewEduCollege(e.target.value)}
            placeholder="University / College / School"
            className="flex-1 min-w-[180px] rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none"
          />
          <input
            type="number"
            value={newEduYear}
            onChange={(e) => setNewEduYear(e.target.value)}
            placeholder="Grad Year"
            className="w-28 rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B6B]/15 text-[#FFA07A] border border-[#FF6B6B]/30 px-4 py-2 text-xs font-semibold hover:bg-gradient-to-r hover:from-[#FF6B6B] hover:to-[#FA7268] hover:text-white transition cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Education</span>
          </button>
        </form>
      </div>

      {/* 3. Work Experience & Internships */}
      <div className="rounded-3xl border border-[#FAF8F5]/15 bg-[#121214] p-6 md:p-8 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-white border-b border-[#FAF8F5]/10 pb-4">
          <div className="p-1.5 rounded-lg bg-[#FAF8F5]/10 border border-[#FAF8F5]/20">
            <Building2 className="h-4 w-4 text-[#FAF8F5]" />
          </div>
          <span>Work Experience & Internships ({profile?.experience?.length || 0})</span>
        </div>

        <div className="mt-5 space-y-3">
          {profile?.experience && profile.experience.length > 0 ? (
            profile.experience.map((exp) => (
              <div
                key={exp.id}
                className="flex items-start justify-between rounded-2xl border border-[#FAF8F5]/10 bg-black/40 p-4 hover:border-[#FAF8F5]/30 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-white">{exp.role}</h4>
                    <span className="text-xs font-mono text-[#FAF8F5]">@ {exp.company}</span>
                  </div>
                  {exp.duration && <p className="text-[11px] font-mono text-neutral-500">{exp.duration}</p>}
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-[#E8E2D6]/80 space-y-1 mt-2 font-sans">
                      {exp.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteExperience(exp.id)}
                  className="text-neutral-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/[0.05] transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-500 font-mono">No work experience or internships cataloged yet.</p>
          )}
        </div>

        {/* Add Experience Form */}
        <form onSubmit={handleAddExperience} className="mt-6 space-y-3 border-t border-[#FAF8F5]/10 pt-5">
          <h4 className="text-[10px] font-mono font-medium uppercase text-[#FAF8F5]/70">Add Experience Entry</h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="text"
              value={newExpCompany}
              onChange={(e) => setNewExpCompany(e.target.value)}
              placeholder="Company / Organization (e.g. Stripe)"
              className="rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none"
            />
            <input
              type="text"
              value={newExpRole}
              onChange={(e) => setNewExpRole(e.target.value)}
              placeholder="Role / Title (e.g. Backend Intern)"
              className="rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none"
            />
            <input
              type="text"
              value={newExpDuration}
              onChange={(e) => setNewExpDuration(e.target.value)}
              placeholder="Duration (e.g. Jun 2025 - Aug 2025)"
              className="rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none"
            />
          </div>
          <textarea
            value={newExpHighlights}
            onChange={(e) => setNewExpHighlights(e.target.value)}
            placeholder="Key highlights and achievements (one per line)..."
            rows={2}
            className="w-full rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none font-sans"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B6B]/15 text-[#FFA07A] border border-[#FF6B6B]/30 px-4 py-2 text-xs font-semibold hover:bg-gradient-to-r hover:from-[#FF6B6B] hover:to-[#FA7268] hover:text-white transition cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Experience</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Verified Skills Catalog */}
      <div className="rounded-3xl border border-[#FAF8F5]/15 bg-[#121214] p-6 md:p-8 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-[#FAF8F5]/10 pb-4">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
            <div className="p-1.5 rounded-lg bg-[#FAF8F5]/10 border border-[#FAF8F5]/20">
              <Award className="h-4 w-4 text-[#FAF8F5]" />
            </div>
            <span>Verified Skills Catalog ({profile?.skills?.length || 0})</span>
          </div>
        </div>

        {/* Existing skills chips */}
        <div className="mt-5 flex flex-wrap gap-2">
          {profile?.skills && profile.skills.length > 0 ? (
            profile.skills.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center gap-2 rounded-xl border border-[#FAF8F5]/25 bg-[#FAF8F5]/[0.06] px-3 py-1.5 text-xs text-[#FAF8F5]"
              >
                <span className="font-semibold text-white">{skill.name}</span>
                <span className="text-[10px] font-mono text-[#FAF8F5]/70">({skill.category})</span>
                <button
                  onClick={() => handleDeleteSkill(skill.id)}
                  className="ml-0.5 text-neutral-500 hover:text-rose-400 cursor-pointer transition"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))
          ) : (
            <p className="text-xs text-neutral-500 font-mono">No skills cataloged yet. Add below or upload a resume.</p>
          )}
        </div>

        {/* Add skill inline form */}
        <form onSubmit={handleAddSkill} className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#FAF8F5]/10 pt-5">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Skill Name (e.g. Python, Docker)"
            className="flex-1 min-w-[200px] rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none"
          />
          <select
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            className="rounded-xl border border-[#FAF8F5]/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-[#FAF8F5] focus:outline-none"
          >
            <option>Programming Languages</option>
            <option>Frameworks</option>
            <option>Databases</option>
            <option>Cloud</option>
            <option>AI/ML</option>
            <option>DevOps</option>
            <option>General</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B6B]/15 text-[#FFA07A] border border-[#FF6B6B]/30 px-4 py-2 text-xs font-semibold hover:bg-gradient-to-r hover:from-[#FF6B6B] hover:to-[#FA7268] hover:text-white transition cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Skill</span>
          </button>
        </form>
      </div>

      {/* 5. Portfolio Projects */}
      <div className="rounded-3xl border border-[#FAF8F5]/15 bg-[#121214] p-6 md:p-8 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-white border-b border-[#FAF8F5]/10 pb-4">
          <div className="p-1.5 rounded-lg bg-[#FAF8F5]/10 border border-[#FAF8F5]/20">
            <Briefcase className="h-4 w-4 text-[#FAF8F5]" />
          </div>
          <span>Portfolio Projects ({profile?.projects?.length || 0})</span>
        </div>

        <div className="mt-5 space-y-3">
          {profile?.projects && profile.projects.length > 0 ? (
            profile.projects.map((proj) => (
              <div
                key={proj.id}
                className="flex items-start justify-between rounded-2xl border border-[#FAF8F5]/10 bg-black/40 p-4 hover:border-[#FAF8F5]/30 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-white">{proj.name}</h4>
                    {proj.github_url && (
                      <a
                        href={proj.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#FAF8F5] hover:text-white inline-flex items-center gap-1 text-[11px] transition underline decoration-white/30"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#E8E2D6]/80">{proj.description}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {proj.technologies?.map((tech, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-[#FAF8F5]/10 px-2 py-0.5 text-[10px] font-mono text-[#FAF8F5] border border-[#FAF8F5]/20"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteProject(proj.id)}
                  className="text-neutral-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/[0.05] transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-500 font-mono">No projects added yet.</p>
          )}
        </div>

        {/* Add Project Form */}
        <form onSubmit={handleAddProject} className="mt-6 space-y-3 border-t border-[#FAF8F5]/10 pt-5">
          <h4 className="text-[10px] font-mono font-medium uppercase text-[#FAF8F5]/70">Add Project</h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="text"
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              placeholder="Project Name (e.g. Distributed Task Queue)"
              className="rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none"
            />
            <input
              type="text"
              value={newProjTech}
              onChange={(e) => setNewProjTech(e.target.value)}
              placeholder="Technologies (e.g. Python, Redis, Docker)"
              className="rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none"
            />
          </div>
          <textarea
            value={newProjDesc}
            onChange={(e) => setNewProjDesc(e.target.value)}
            placeholder="Project Description & Architecture details (Used for semantic RAG memory & interview question generation)..."
            rows={2}
            className="w-full rounded-xl border border-[#FAF8F5]/15 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:border-[#FAF8F5] focus:outline-none font-sans"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B6B]/15 text-[#FFA07A] border border-[#FF6B6B]/30 px-4 py-2 text-xs font-semibold hover:bg-gradient-to-r hover:from-[#FF6B6B] hover:to-[#FA7268] hover:text-white transition cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
