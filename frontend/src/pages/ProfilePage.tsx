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
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data);
      setFullName(data.full_name || '');
      setLocation(data.location || '');
      setTargetRoles(data.target_roles?.join(', ') || '');
      setPreferredLocations(data.preferred_locations?.join(', ') || '');
      setExperienceLevel(data.experience_level || '0-1 years');
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      const updated = await profileService.updateProfile({
        full_name: fullName,
        location,
        target_roles: targetRoles.split(',').map((r) => r.trim()).filter(Boolean),
        preferred_locations: preferredLocations.split(',').map((l) => l.trim()).filter(Boolean),
        experience_level: experienceLevel,
      });
      setProfile(updated);
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Candidate Profile</h1>
          <p className="text-xs text-gray-400">
            Manage your verified skills, education, and projects for deterministic matching & RAG retrieval.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-brand-500/20 bg-brand-500/10 px-4 py-2">
          <Sparkles className="h-4 w-4 text-brand-400" />
          <span className="text-xs font-semibold text-brand-300">
            Completion Score: {profile?.completion_score || 0}%
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-sm text-emerald-400">
          <CheckCircle className="h-5 w-5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Basic & Career Preferences Form */}
      <div className="rounded-2xl border border-gray-800 bg-[#111827]/80 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-gray-800 pb-3">
          <User className="h-4 w-4 text-brand-400" />
          <span>Personal & Career Preferences</span>
        </div>

        <form onSubmit={handleUpdateBasic} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ankit Sharma"
              className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-900/80 px-3.5 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bengaluru, India"
              className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-900/80 px-3.5 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Roles (comma separated)</label>
            <input
              type="text"
              value={targetRoles}
              onChange={(e) => setTargetRoles(e.target.value)}
              placeholder="e.g. Backend Developer, AI Engineer"
              className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-900/80 px-3.5 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Preferred Locations</label>
            <input
              type="text"
              value={preferredLocations}
              onChange={(e) => setPreferredLocations(e.target.value)}
              placeholder="e.g. Bengaluru, Hyderabad, Remote"
              className="mt-1 w-full rounded-xl border border-gray-700 bg-gray-900/80 px-3.5 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 flex justify-end mt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Verified Skills Catalog */}
      <div className="rounded-2xl border border-gray-800 bg-[#111827]/80 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Award className="h-4 w-4 text-yellow-400" />
            <span>Verified Skills ({profile?.skills?.length || 0})</span>
          </div>
        </div>

        {/* Existing skills chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {profile?.skills && profile.skills.length > 0 ? (
            profile.skills.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-300"
              >
                <span>{skill.name}</span>
                <span className="text-[10px] text-gray-400">({skill.category})</span>
                <button
                  onClick={() => handleDeleteSkill(skill.id)}
                  className="ml-1 text-gray-400 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))
          ) : (
            <p className="text-xs text-gray-500">No skills cataloged yet. Add below or upload a resume.</p>
          )}
        </div>

        {/* Add skill inline form */}
        <form onSubmit={handleAddSkill} className="mt-6 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Skill Name (e.g. Python, Docker)"
            className="flex-1 min-w-[200px] rounded-xl border border-gray-700 bg-gray-900/80 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
          />
          <select
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
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
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 px-4 py-2 text-xs font-semibold hover:bg-brand-500 hover:text-white transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Skill</span>
          </button>
        </form>
      </div>

      {/* 3. Portfolio Projects */}
      <div className="rounded-2xl border border-gray-800 bg-[#111827]/80 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-gray-800 pb-3">
          <Briefcase className="h-4 w-4 text-emerald-400" />
          <span>Portfolio Projects ({profile?.projects?.length || 0})</span>
        </div>

        <div className="mt-4 space-y-3">
          {profile?.projects && profile.projects.length > 0 ? (
            profile.projects.map((proj) => (
              <div
                key={proj.id}
                className="flex items-start justify-between rounded-xl border border-gray-800 bg-gray-900/60 p-4"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{proj.name}</h4>
                  <p className="mt-1 text-xs text-gray-400">{proj.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {proj.technologies?.map((tech, i) => (
                      <span
                        key={i}
                        className="rounded bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteProject(proj.id)}
                  className="text-gray-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">No projects added yet.</p>
          )}
        </div>

        {/* Add Project Form */}
        <form onSubmit={handleAddProject} className="mt-6 space-y-3 border-t border-gray-800/80 pt-4">
          <h4 className="text-xs font-bold uppercase text-gray-400">Add Project</h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="text"
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              placeholder="Project Name (e.g. Distributed Task Queue)"
              className="rounded-xl border border-gray-700 bg-gray-900/80 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
            <input
              type="text"
              value={newProjTech}
              onChange={(e) => setNewProjTech(e.target.value)}
              placeholder="Technologies (e.g. Python, Redis, Docker)"
              className="rounded-xl border border-gray-700 bg-gray-900/80 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <textarea
            value={newProjDesc}
            onChange={(e) => setNewProjDesc(e.target.value)}
            placeholder="Project Description & Architecture details (Used for semantic RAG memory & interview question generation)..."
            rows={2}
            className="w-full rounded-xl border border-gray-700 bg-gray-900/80 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 text-xs font-semibold hover:bg-emerald-500 hover:text-white transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Project</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Education History */}
      <div className="rounded-2xl border border-gray-800 bg-[#111827]/80 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-gray-800 pb-3">
          <GraduationCap className="h-4 w-4 text-cyan-400" />
          <span>Education History ({profile?.education?.length || 0})</span>
        </div>

        <div className="mt-4 space-y-3">
          {profile?.education && profile.education.length > 0 ? (
            profile.education.map((edu) => (
              <div
                key={edu.id}
                className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/60 p-4"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{edu.degree}</h4>
                  <p className="text-xs text-gray-400">
                    {edu.college} {edu.graduation_year ? `• Class of ${edu.graduation_year}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteEducation(edu.id)}
                  className="text-gray-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">No education records added yet.</p>
          )}
        </div>

        {/* Add Education Form */}
        <form onSubmit={handleAddEducation} className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-800/80 pt-4">
          <input
            type="text"
            value={newEduDegree}
            onChange={(e) => setNewEduDegree(e.target.value)}
            placeholder="Degree (e.g. B.Tech Computer Science)"
            className="flex-1 min-w-[180px] rounded-xl border border-gray-700 bg-gray-900/80 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
          />
          <input
            type="text"
            value={newEduCollege}
            onChange={(e) => setNewEduCollege(e.target.value)}
            placeholder="University / College"
            className="flex-1 min-w-[180px] rounded-xl border border-gray-700 bg-gray-900/80 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
          />
          <input
            type="number"
            value={newEduYear}
            onChange={(e) => setNewEduYear(e.target.value)}
            placeholder="Graduation Year"
            className="w-32 rounded-xl border border-gray-700 bg-gray-900/80 px-3.5 py-2 text-xs text-white focus:border-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-4 py-2 text-xs font-semibold hover:bg-cyan-500 hover:text-white transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Education</span>
          </button>
        </form>
      </div>
    </div>
  );
};
