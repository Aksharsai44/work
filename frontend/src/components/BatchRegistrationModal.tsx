import React, { useState, useEffect } from "react";
import { Batch, Student } from "../types";
import {
  QrCode,
  CheckCircle2,
  Lock,
  User,
  Mail,
  Phone,
  Building2,
  Sparkles,
  ArrowRight,
  Key,
} from "lucide-react";
import confetti from "canvas-confetti";

interface BatchRegistrationModalProps {
  batch: Batch;
  existingStudents: Student[];
  onRegisterStudent: (newStudent: Partial<Student>) => void;
  onAutoLogin?: (newStudent: Partial<Student>) => void;
  onClose: () => void;
}

export const BatchRegistrationModal: React.FC<BatchRegistrationModalProps> = ({
  batch,
  existingStudents,
  onRegisterStudent,
  onAutoLogin,
  onClose,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [college, setCollege] = useState(batch.college);
  const [branch, setBranch] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [savedNewStudent, setSavedNewStudent] = useState<Partial<Student> | null>(null);

  useEffect(() => {
    if (batch) {
      setCollege(batch.college || "");
    }
  }, [batch?.id, batch?.college]);

  const handleEmailBlur = () => {
    if (!email.trim()) return;
    const found = existingStudents.find(
      (s) => s.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (found) {
      setIsExistingUser(true);
      setName(found.name);
      setMobile(found.mobile);
      setCollege(found.college);
      setBranch(found.branch || "");
      setCity(found.city || "");
      setStateValue(found.state || "");
    } else {
      setIsExistingUser(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isExistingUser && password && password !== confirmPassword) {
      setErrorMsg("Passwords do not match!");
      return;
    }

    const newStudentData: Partial<Student> = {
      name,
      email,
      mobile,
      college,
      branch,
      city,
      state: stateValue,
      password: !isExistingUser ? password : undefined,
      batchId: batch.id,
      batchName: batch.name,
      status: "active",
      enrolledAt: new Date().toISOString(),
      scores: {
        quizScore: 0,
        codingScore: 0,
        liveQAScore: 0,
        assignmentScore: 0,
        overallAccuracy: 0.0,
      },
      totalPoints: 0,
      activeStreakDays: 0,
      fastestResponseMs: 0,
      attendedSessions: 0,
      totalSessions: 0,
    };

    onRegisterStudent(newStudentData);
    setSavedNewStudent(newStudentData);
    setRegistrationSuccess(true);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-slate-100 my-auto animate-in fade-in">
        {/* Pinned Header */}
        <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-indigo-600 font-black text-xs sm:text-sm">
            <QrCode className="w-4 h-4" />
            <span>MIND2I Self-Registration</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {registrationSuccess ? (
          <div className="text-center py-6 space-y-4 my-auto">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Registration Complete!</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              You are officially registered in <strong>{batch.name}</strong>. You can now access all workshop assignments, Learn Hub modules, and live polls.
            </p>
            <button
              onClick={() => {
                if (onAutoLogin && savedNewStudent) {
                  onAutoLogin(savedNewStudent);
                } else {
                  onClose();
                }
              }}
              className="px-5 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              Continue to Student Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div className="p-2 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs flex items-center justify-between">
              <span className="font-bold text-indigo-900 text-[11px]">Enrolling into:</span>
              <span className="text-indigo-700 font-semibold text-[11px]">{batch.name} • {batch.college}</span>
            </div>

            {errorMsg && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 font-semibold">
                {errorMsg}
              </div>
            )}

            {isExistingUser && (
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Account recognized! Adding this batch to your profile.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                  Email Address (Username) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="you@university.edu"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+1 (555) 012-3456"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                  College Name
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                  Branch
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="CSE, AI/ML, ECE"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                    State
                  </label>
                  <input
                    type="text"
                    value={stateValue}
                    onChange={(e) => setStateValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {!isExistingUser && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Fixed Footer */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
              >
                Register & Enroll Now
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
