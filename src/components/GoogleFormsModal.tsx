import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  LogOut, 
  X, 
  PlusCircle, 
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { createConsignmentGoogleForm, GoogleFormCreationResult } from '../services/googleForms';
import { googleSignIn, logoutGoogle } from '../services/googleAuth';

interface GoogleFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  accessToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onLogout: () => void;
}

export const GoogleFormsModal: React.FC<GoogleFormsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  accessToken,
  onAuthSuccess,
  onLogout,
}) => {
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdForm, setCreatedForm] = useState<GoogleFormCreationResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthSuccess(result.user, result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal masuk dengan Google. Silakan coba lagi.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      onLogout();
      setCreatedForm(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal logout');
    }
  };

  const handleCreateForm = async () => {
    if (!accessToken) {
      setErrorMsg('Akses token Google belum tersedia. Silakan hubungkan akun terlebih dahulu.');
      return;
    }

    setIsCreatingForm(true);
    setErrorMsg(null);
    try {
      const res = await createConsignmentGoogleForm(accessToken);
      setCreatedForm(res);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal membuat Google Form. Pastikan izin akses formulir telah disetujui.');
    } finally {
      setIsCreatingForm(false);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#1B365D] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#1B365D] flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Integrasi Google Forms</h3>
              <p className="text-xs text-amber-200/80">info.barkasmajalengka Workspace Hub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* If NOT Logged In */}
          {!currentUser ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center text-[#1B365D]">
                <FileSpreadsheet className="w-8 h-8 text-[#1B365D]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">Hubungkan Akun Google Anda</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Gunakan Google Forms API untuk otomatis membuat formulir titip jual resmi di Google Drive Anda atau menyinkronkan data respon penitip.
                </p>
              </div>

              {/* Official Google Material Sign-In Button */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isLoadingAuth}
                  className="inline-flex items-center gap-3 px-5 py-3 border border-slate-300 rounded-full shadow-xs hover:shadow-md bg-white hover:bg-slate-50 transition-all font-medium text-sm text-slate-700 disabled:opacity-50 cursor-pointer"
                >
                  {isLoadingAuth ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#1B365D]" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  )}
                  <span>{isLoadingAuth ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                </button>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-left text-xs text-amber-900 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Sesuai kebijakan Google Workspace, aplikasi ini hanya meminta izin mengelola Google Forms dengan persetujuan Anda.
                </span>
              </div>
            </div>
          ) : (
            /* Logged in state */
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-10 h-10 rounded-full border border-slate-300"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#1B365D] text-white flex items-center justify-center font-bold">
                      {currentUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs sm:text-sm">
                      {currentUser.displayName || 'Akun Google'}
                    </h5>
                    <p className="text-slate-500 text-xs">{currentUser.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-rose-600 bg-white border border-slate-200 rounded-lg hover:border-rose-300 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>

              {/* Action: Create Google Form */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-bold text-[#1B365D] text-sm">
                      Buat Google Form Resmi Barkas Majalengka
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Otomatis membuat Google Form lengkap dengan 11 pertanyaan (Data Diri, Detail Barang, Kecamatan Majalengka, & Persetujuan) langsung di Google Drive Anda.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateForm}
                  disabled={isCreatingForm}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1B365D] hover:bg-[#24477A] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isCreatingForm ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Sedang Membuat Google Form...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4 text-amber-400" />
                      <span>Buat Formulir Google Forms Baru</span>
                    </>
                  )}
                </button>
              </div>

              {/* Success Result if created */}
              {createdForm && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Google Form Berhasil Dibuat di Akun Anda!</span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Judul: <strong>{createdForm.title}</strong>
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <a
                      href={createdForm.responderUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs"
                    >
                      <span>Lihat Form Publik</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <a
                      href={createdForm.editUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold"
                    >
                      <span>Edit di Google Forms</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(createdForm.responderUri)}
                      className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                      title="Salin Link Form"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
