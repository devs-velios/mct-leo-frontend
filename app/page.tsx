"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/features/auth/useAuth";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShake(false);

    // Validate inputs
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      setShake(true);
      return;
    }

    setIsLoading(true);

    try {
      // Credentials are validated server-side via the auth feature (proxied to Supabase)
      await login({ email: email.trim(), password });
      
      setIsSuccess(true);
      // Delay redirection for success animation
      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email ou mot de passe incorrect.");
      setIsLoading(false);
      setShake(true);

      // Reset shake state
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#29265B] px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      
      {/* Premium background decorative shapes */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Blob 1 */}
        <motion.div
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 40, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-12 -left-12 h-96 w-96 rounded-full bg-white/5 blur-[80px]"
        />
        {/* Blob 2 */}
        <motion.div
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 40, -30, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-16 -right-16 h-96 w-96 rounded-full bg-[#E34F2D]/10 blur-[80px]"
        />
        {/* Decorative thin accent ring */}
        <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full border border-white/5 rotate-45 pointer-events-none hidden md:block"></div>
        <div className="absolute bottom-1/4 right-1/3 w-[200px] h-[200px] rounded-full border border-[#E34F2D]/5 -rotate-12 pointer-events-none hidden md:block"></div>
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          x: shake ? [0, -10, 10, -10, 10, -5, 5, 0] : 0 
        }}
        transition={{ 
          type: "spring",
          stiffness: 100,
          damping: 15,
          x: { duration: 0.5 }
        }}
        className="relative z-10 w-full max-w-[440px] rounded-3xl bg-white p-8 shadow-[0_20px_50px_rgba(45,42,86,0.06)] border border-slate-100 glow-effect"
      >
        
        {/* Top brand icon wrapper */}
        <div className="flex flex-col items-center mb-6">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-md p-2.5"
          >
            <img src="/foxy.svg" alt="Léo" className="w-full h-full object-contain" />
          </motion.div>

          <h1 className="mt-5 text-3xl font-bold font-serif-mct text-[#332151] tracking-tight relative pb-2">
            Bienvenue
            {/* Custom stylized orange underline */}
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-[#E34F2D]" />
          </h1>
          <p className="mt-3 text-sm text-[#5A5A7A] text-center font-medium font-sans">
            Espace d'onboarding MonControleTechnique
          </p>
        </div>

        {/* Error Notification */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs font-semibold text-red-600"
            >
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-600 mt-0.5" />
              <div>{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A7A] mb-1.5 ml-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#5A5A7A]/50">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@exemple.com"
                disabled={isLoading || isSuccess}
                className="w-full rounded-3xl border border-[#5A5A7A]/15 bg-white pl-10 pr-4 py-3 text-sm text-[#332151] placeholder-[#5A5A7A]/40 outline-none transition-all duration-200 focus:border-[#332151] focus:ring-2 focus:ring-[#332151]/10 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 ml-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A7A]">
                Mot de passe
              </label>
              <a href="#" className="text-xs font-bold text-[#332151] hover:text-[#E34F2D] transition-colors duration-150">
                Oublié ?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#5A5A7A]/50">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading || isSuccess}
                className="w-full rounded-3xl border border-[#5A5A7A]/15 bg-white pl-10 pr-10 py-3 text-sm text-[#332151] placeholder-[#5A5A7A]/40 outline-none transition-all duration-200 focus:border-[#332151] focus:ring-2 focus:ring-[#332151]/10 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading || isSuccess}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#5A5A7A]/50 hover:text-[#332151] transition-colors"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading || isSuccess}
              className="relative overflow-hidden flex w-full items-center justify-center rounded-3xl bg-[#E34F2D] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#E34F2D]/20 transition-all duration-200 hover:bg-[#DF3714] hover:shadow-[#E34F2D]/30 disabled:opacity-85 cursor-pointer glow-effect"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : isSuccess ? (
                <motion.span 
                  initial={{ scale: 0.8 }} 
                  animate={{ scale: 1 }} 
                  className="flex items-center gap-1.5"
                >
                  Connexion réussie...
                </motion.span>
              ) : (
                "Se connecter"
              )}
            </motion.button>
          </div>
        </form>

        {/* Footer actions */}
        <div className="mt-8 text-center space-y-3">
          <p className="text-xs font-semibold text-[#5A5A7A]">
            Pas de compte ?{" "}
            <a href="#" className="text-[#332151] hover:text-[#E34F2D] transition-colors">
              Accès sur invitation.
            </a>
          </p>

          <div className="pt-4 border-t border-[#5A5A7A]/10">
            <span className="inline-block text-[10px] font-bold tracking-widest text-[#5A5A7A]/60 uppercase bg-[#5A5A7A]/5 px-3 py-1 rounded-full border border-[#5A5A7A]/10">
              DÉMO — ACCÈS RESTREINT
            </span>
          </div>
        </div>

      </motion.div>
    </main>
  );
}
