import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { SocialButton } from "@/components/ui/social-button";
import { Button } from "@/components/ui/Button";

export interface LoginCardProps {
  /** Mulai login Google (redirect penuh ke Worker). */
  onGoogle: () => void;
  /** Login/daftar email+password. Kembalikan { error } atau { info } untuk ditampilkan. */
  onEmailSubmit?: (p: {
    email: string;
    password: string;
    name: string;
    isSignUp: boolean;
  }) => Promise<{ error?: string; info?: string } | void>;
  /** Pesan dari luar (mis. ?error= dari callback OAuth). */
  notice?: { type: "error" | "info"; text: string } | null;
  onBackToLanding?: () => void;
  isSignUp?: boolean;
  onToggleSignUp?: () => void;
  onNavigateToKebijakan?: () => void;
  onForgotPassword?: () => void;
  hideTerms?: boolean;
  googleOnly?: boolean;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  onGoogle,
  onEmailSubmit,
  notice,
  isSignUp: isSignUpProp,
  onToggleSignUp: onToggleSignUpProp,
  onNavigateToKebijakan,
  onForgotPassword,
  hideTerms = false,
  googleOnly = false,
}) => {
  const [internalSignUp, setInternalSignUp] = useState(false);
  const isSignUp = isSignUpProp !== undefined ? isSignUpProp : internalSignUp;
  const toggleSignUp = onToggleSignUpProp || (() => setInternalSignUp(!internalSignUp));

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states: Dikosongkan secara default agar menampilkan placeholder
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "info"; text: string } | null>(null);
  const shown = msg || notice || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail))
      return setMsg({ type: "error", text: "Masukkan alamat email yang valid." });
    if (isSignUp) {
      if (name.trim().length < 2) return setMsg({ type: "error", text: "Nama lengkap minimal 2 karakter." });
      if (password.length < 8) return setMsg({ type: "error", text: "Kata sandi minimal 8 karakter." });
      if (password !== confirmPassword) return setMsg({ type: "error", text: "Konfirmasi kata sandi tidak sama." });
    } else if (!password) {
      return setMsg({ type: "error", text: "Kata sandi wajib diisi." });
    }
    setMsg(null);
    setLoading(true);
    try {
      const res = ((await onEmailSubmit?.({ email: cleanEmail, password, name: name.trim(), isSignUp })) ||
        undefined) as { error?: string; info?: string } | undefined;
      if (res?.error) setMsg({ type: "error", text: res.error });
      else if (res?.info) setMsg({ type: "info", text: res.info });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-t-[32px] sm:rounded-t-[36px] md:rounded-[28px] px-6 sm:px-8 pt-6 pb-6 sm:pb-7 shadow-2xl border-t border-neutral-100 md:border md:border-white/30 md:shadow-[0_25px_60px_rgba(0,0,0,0.25)] flex flex-col justify-between">
      <div className="w-full max-w-md mx-auto">
        {/* Form Header */}
        <div className={`${googleOnly ? "mb-6" : "mb-4"} text-center`}>
          <h2 className="text-2xl sm:text-[28px] font-black tracking-tight text-neutral-900">
            {googleOnly ? "Login Admin" : isSignUp ? "Daftar Akun" : "Login"}
          </h2>
          {!googleOnly ? (
            <p className="text-[14px] text-neutral-500 mt-1 font-medium">
              {isSignUp ? "Sudah Punya Akun? " : "Belum Punya Akun? "}
              <button
                type="button"
                onClick={toggleSignUp}
                className="text-[#7d6aee] hover:text-[#6954e5] font-bold hover:underline cursor-pointer transition-colors"
              >
                {isSignUp ? "Login" : "Daftar"}
              </button>
            </p>
          ) : (
            <p className="text-[14px] text-neutral-500 mt-1 font-medium">
              Masuk ke Dashboard Admin Satu Cerita
            </p>
          )}
        </div>

        {shown && (
          <div
            role="alert"
            className={`mb-3.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold ${
              shown.type === "error"
                ? "bg-red-50 text-red-600 border border-red-100"
                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
            }`}
          >
            {shown.text}
          </div>
        )}

        {/* Tombol Google */}
        <div className={googleOnly ? "mb-2" : "mb-3.5"}>
          <SocialButton
            social="google"
            theme="brand"
            size="xl"
            type="button"
            onClick={onGoogle}
            aria-label="Masuk dengan Google"
            title="Masuk dengan Google"
            className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 border-b-[3px] border-b-neutral-300 shadow-2xs hover:shadow-xs active:scale-[0.99] active:border-b-[2px] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <span className="text-black text-[16px] font-bold">
              Masuk dengan Google
            </span>
          </SocialButton>
        </div>

        {/* Form Email & Password hanya ditampilkan jika bukan googleOnly */}
        {!googleOnly && (
          <>
            {/* Divider: Atau */}
            <div className="mb-4">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-neutral-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider shrink-0">
                  Atau
                </span>
                <div className="border-t border-neutral-200 w-full" />
              </div>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isSignUp && (
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap"
                    maxLength={80}
                    autoComplete="name"
                    className="w-full bg-[#f4f7f6] border border-neutral-200/80 rounded-2xl px-4 py-3.5 text-[16px] font-medium text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-[#7d6aee]"
                  />
                </div>
              )}

              {/* Email Field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan alamat email"
                  className="w-full bg-[#f4f7f6] border border-neutral-200/80 rounded-2xl pl-12 pr-4 py-3.5 text-[16px] font-medium text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#7d6aee]/20 focus:border-[#7d6aee] transition-all"
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kata sandi"
                  className="w-full bg-[#f4f7f6] border border-neutral-200/80 rounded-2xl pl-12 pr-12 py-3.5 text-[16px] font-medium text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#7d6aee]/20 focus:border-[#7d6aee] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Extra Confirm Password Field only in Sign up */}
              {isSignUp && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    className="w-full bg-[#f4f7f6] border border-neutral-200/80 rounded-2xl pl-12 pr-12 py-3.5 text-[16px] font-medium text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#7d6aee]/20 focus:border-[#7d6aee] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}

              {/* Lupa Kata Sandi */}
              <div className="flex justify-end pt-0.5 pb-0.5">
                <button
                  type="button"
                  onClick={() =>
                    onForgotPassword
                      ? onForgotPassword()
                      : setMsg({
                          type: "info",
                          text: "Reset kata sandi segera tersedia. Untuk sementara, masuk dengan Google atau hubungi admin.",
                        })
                  }
                  className="text-[14px] text-[#7d6aee] hover:text-[#6954e5] font-bold hover:underline cursor-pointer transition-colors"
                >
                  Lupa kata sandi?
                </button>
              </div>

              {/* Main Submit Button: Login */}
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full bg-gradient-to-r from-[#7d6aee] to-[#ad9fff] hover:opacity-95 text-white font-bold py-3.5 px-4 rounded-xl border border-[#7d6aee] border-b-[3px] border-b-[#5c47dc] shadow-sm hover:shadow-md text-[16px] tracking-wide mt-1"
              >
                {loading ? "Memproses..." : isSignUp ? "Daftar Akun" : "Login"}
              </Button>
            </form>
          </>
        )}

        {/* Teks Kebijakan & Syarat Privasi: Ukuran 12px di semua tampilan */}
        {!hideTerms && (
          <div className="mt-4 text-center text-[12px] text-neutral-500 font-medium leading-tight select-none">
            <p className="text-[12px]">Dengan masuk, Anda menyetujui</p>
            <button
              type="button"
              onClick={onNavigateToKebijakan}
              className="inline-block mt-0.5 underline underline-offset-2 text-neutral-800 hover:text-[#7d6aee] font-bold transition-colors cursor-pointer text-[12px]"
            >
              Syarat &amp; Kebijakan Privasi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginCard;
