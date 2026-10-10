import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { SocialButton } from "@/components/ui/social-button";

export interface LoginCardProps {
  onLogin: () => void;
  onBackToLanding?: () => void;
  isSignUp?: boolean;
  onToggleSignUp?: () => void;
  onNavigateToKebijakan?: () => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  onLogin,
  isSignUp: isSignUpProp,
  onToggleSignUp: onToggleSignUpProp,
  onNavigateToKebijakan,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="w-full bg-white rounded-t-[32px] sm:rounded-t-[36px] md:rounded-[28px] px-6 sm:px-8 pt-6 pb-6 sm:pb-7 shadow-2xl border-t border-neutral-100 md:border md:border-white/30 md:shadow-[0_25px_60px_rgba(0,0,0,0.25)] flex flex-col justify-between">
      <div className="w-full max-w-md mx-auto">
        {/* Form Header */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl sm:text-[28px] font-black tracking-tight text-neutral-900">
            {isSignUp ? "Daftar Akun" : "Login"}
          </h2>
          <p className="text-[14px] md:text-[18px] text-neutral-500 mt-1 font-medium">
            {isSignUp ? "Sudah Punya Akun? " : "Belum Punya Akun? "}
            <button
              type="button"
              onClick={toggleSignUp}
              className="text-[#7d6aee] hover:text-[#6954e5] font-bold hover:underline cursor-pointer transition-colors"
            >
              {isSignUp ? "Login" : "Daftar"}
            </button>
          </p>
        </div>

        {/* Form Inputs (Email dan Password dengan placeholder dan ukuran teks text-base md:text-xl) */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
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
              className="w-full bg-[#f4f7f6] border border-neutral-200/80 rounded-2xl pl-12 pr-4 py-3.5 text-base md:text-xl font-medium text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#7d6aee]/20 focus:border-[#7d6aee] transition-all"
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
              className="w-full bg-[#f4f7f6] border border-neutral-200/80 rounded-2xl pl-12 pr-12 py-3.5 text-base md:text-xl font-medium text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#7d6aee]/20 focus:border-[#7d6aee] transition-all"
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
                className="w-full bg-[#f4f7f6] border border-neutral-200/80 rounded-2xl pl-12 pr-12 py-3.5 text-base md:text-xl font-medium text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#7d6aee]/20 focus:border-[#7d6aee] transition-all"
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
              onClick={() => {}}
              className="text-[14px] md:text-[18px] text-[#7d6aee] hover:text-[#6954e5] font-bold hover:underline cursor-pointer transition-colors"
            >
              Lupa kata sandi?
            </button>
          </div>

          {/* 
            Main Submit Button: Login
            - Menggunakan gradasi ungu selaras Satu Cerita (bg-gradient-to-r from-[#7d6aee] to-[#ad9fff])
            - Shadow dan Outline mengikuti Untitled UI
          */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#7d6aee] to-[#ad9fff] hover:opacity-95 text-white font-bold py-3.5 px-4 rounded-xl border border-[#7d6aee]/30 shadow-[0px_1px_2px_rgba(16,24,40,0.05)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7d6aee]/20 transition-all duration-150 active:scale-[0.99] cursor-pointer text-base sm:text-lg tracking-wide flex items-center justify-center gap-2 mt-1 select-none"
          >
            <span>{isSignUp ? "Daftar Akun" : "Login"}</span>
          </button>
        </form>

        {/* Divider: Or Continue With */}
        <div className="mt-4 mb-3">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-neutral-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider shrink-0">
              Atau Lanjutkan Dengan
            </span>
            <div className="border-t border-neutral-200 w-full" />
          </div>
        </div>

        {/* Google Button */}
        <div>
          <SocialButton
            social="google"
            theme="brand"
            size="xl"
            type="button"
            onClick={onLogin}
            aria-label="Login dengan Google"
            title="Login dengan Google"
            className="w-full py-3.5 px-4 rounded-xl"
          />
        </div>

        {/* Teks Kebijakan & Syarat Privasi (Diperbesar 2px dari 12px ke 14px) */}
        <p className="mt-4 text-center text-[14px] text-neutral-500 font-medium leading-relaxed select-none">
          Dengan masuk, Anda menyetujui{" "}
          <button
            type="button"
            onClick={onNavigateToKebijakan}
            className="underline underline-offset-2 text-neutral-800 hover:text-[#7d6aee] font-bold transition-colors cursor-pointer"
          >
            syarat &amp; kebijakan privasi
          </button>{" "}
          SatuCerita
        </p>
      </div>
    </div>
  );
};

export default LoginCard;
