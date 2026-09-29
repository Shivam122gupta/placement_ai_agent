import * as React from "react";
import { useState, useId } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Typewriter } from "@/components/ui/typewriter-text";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";

const labelVariants = cva(
  "text-[10px] font-mono font-medium uppercase tracking-wider text-[#FAF8F5]/80"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B6B] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#ff5757] hover:to-[#f96155] text-white font-semibold shadow-lg shadow-[#FF6B6B]/30 border-none cursor-pointer active:scale-95 transition-all",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 text-white backdrop-blur-md",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-[#FF6B6B]/15 text-[#FAF8F5]/80 hover:text-white",
        link: "text-[#FF7E67] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-[#FAF8F5]/20 bg-[#18181B]/80 px-4 py-2 text-sm text-[#FAF8F5] placeholder:text-[#FAF8F5]/40 focus:border-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#FAF8F5]/20 backdrop-blur-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 font-sans",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  rightLabel?: React.ReactNode;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, rightLabel, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

    return (
      <div className="grid w-full items-center gap-1.5">
        <div className="flex items-center justify-between">
          {label && <Label htmlFor={id}>{label}</Label>}
          {rightLabel}
        </div>
        <div className="relative">
          <Input
            id={id}
            type={showPassword ? "text" : "password"}
            className={cn("pe-10", className)}
            ref={ref}
            {...props}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-[#FAF8F5]/50 hover:text-[#FAF8F5] focus:outline-none cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

function SignInForm({
  onSuccess,
  onForgotPassword,
}: {
  onSuccess?: () => void;
  onForgotPassword: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        "Invalid email or password. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <Link to="/" title="Back to Landing Page" className="transition transform hover:scale-105 cursor-pointer">
          <img
            src="/hirxora-logo-2.jpg"
            alt="Hirxora"
            className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-lg shadow-[#FF6B6B]/25 mb-1"
          />
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#FAF8F5]">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm text-[#E8E2D6]/80">
          Enter your credentials to access your Hirxora Copilot
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="candidate@university.edu"
            required
            autoComplete="email"
          />
        </div>

        <PasswordInput
          name="password"
          label="Password"
          rightLabel={
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[11px] font-sans font-medium text-[#FF7E67] hover:text-[#FFA07A] hover:underline cursor-pointer transition"
            >
              Forgot password?
            </button>
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full cursor-pointer">
          {isSubmitting ? "Signing in..." : "Sign In to Hirxora"}
        </Button>
      </div>
    </form>
  );
}

function SignUpForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Client-side validation before hitting the API
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, fullName);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const responseData = err.response?.data;
      const validationErrors = responseData?.error?.details?.validation_errors;
      const msg =
        responseData?.error?.message === "Request payload validation failed" && validationErrors?.length
          ? validationErrors.map((e: any) => e.message).join(", ")
          : responseData?.error?.message ||
            "Registration failed. Email may already be in use.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <Link to="/" title="Back to Landing Page" className="transition transform hover:scale-105 cursor-pointer">
          <img
            src="/hirxora-logo-2.jpg"
            alt="Hirxora"
            className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-lg shadow-[#FF6B6B]/25 mb-1"
          />
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#FAF8F5]">
          Create an account
        </h1>
        <p className="text-xs sm:text-sm text-[#E8E2D6]/80">
          Start your personalized career journey with Hirxora
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-3.5">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Alex Mercer"
            required
            autoComplete="name"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@university.edu"
            required
            autoComplete="email"
          />
        </div>

        <PasswordInput
          name="password"
          label="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="••••••••"
        />

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full cursor-pointer">
          {isSubmitting ? "Creating Account..." : "Get Started with Hirxora"}
        </Button>
      </div>
    </form>
  );
}

function ForgotPasswordForm({ onBackToSignIn }: { onBackToSignIn: () => void }) {
  const [email, setEmail] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMsg(null);
    setIsSubmitting(true);
    try {
      const msg = await authService.forgotPassword(email);
      setStatusMsg(msg || "Password reset link has been dispatched to your email.");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to send reset link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleForgotPassword} className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <Link to="/" title="Back to Landing Page" className="transition transform hover:scale-105 cursor-pointer">
          <img
            src="/hirxora-logo-2.jpg"
            alt="Hirxora"
            className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-lg shadow-[#FF6B6B]/25 mb-1"
          />
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#FAF8F5]">
          Reset Password
        </h1>
        <p className="text-xs sm:text-sm text-[#E8E2D6]/80">
          Enter your registered email to receive a password reset link
        </p>
      </div>

      {statusMsg && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-300 leading-relaxed">
          {statusMsg}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="forgot-email">Registered Email</Label>
          <Input
            id="forgot-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="candidate@university.edu"
            required
            autoComplete="email"
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full cursor-pointer">
          {isSubmitting ? "Sending Reset Link..." : "Send Reset Link"}
        </Button>

        <button
          type="button"
          onClick={onBackToSignIn}
          className="text-center text-xs font-mono text-neutral-400 hover:text-white pt-2 cursor-pointer transition"
        >
          ← Back to Sign in
        </button>
      </div>
    </form>
  );
}

// 4-Corner Animated Snake Light Trails Component in Warm White
function FourCornerSnakeBeams() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-0">
      {/* Top-Left Corner Snake */}
      <div className="absolute top-4 left-4 w-32 h-32 opacity-75">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <path
            d="M 10 90 Q 10 10, 90 10"
            stroke="rgba(250,248,245,0.1)"
            strokeWidth="2"
            strokeDasharray="3 4"
          />
          <motion.path
            d="M 10 90 Q 10 10, 90 10"
            stroke="url(#snake-tl-white)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathOffset: 0 }}
            animate={{ pathOffset: [0, 1] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
            style={{ pathLength: 0.35 }}
          />
          <defs>
            <linearGradient id="snake-tl-white" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FAF8F5" stopOpacity="0" />
              <stop offset="60%" stopColor="#F5F2EB" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FAF8F5" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top-Right Corner Snake */}
      <div className="absolute top-4 right-4 w-32 h-32 opacity-75">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <path
            d="M 10 10 Q 90 10, 90 90"
            stroke="rgba(250,248,245,0.1)"
            strokeWidth="2"
            strokeDasharray="3 4"
          />
          <motion.path
            d="M 10 10 Q 90 10, 90 90"
            stroke="url(#snake-tr-white)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathOffset: 0 }}
            animate={{ pathOffset: [0, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            style={{ pathLength: 0.35 }}
          />
          <defs>
            <linearGradient id="snake-tr-white" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FAF8F5" stopOpacity="0" />
              <stop offset="60%" stopColor="#EAE5D9" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FAF8F5" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom-Left Corner Snake */}
      <div className="absolute bottom-4 left-4 w-32 h-32 opacity-75">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <path
            d="M 10 10 Q 10 90, 90 90"
            stroke="rgba(250,248,245,0.1)"
            strokeWidth="2"
            strokeDasharray="3 4"
          />
          <motion.path
            d="M 10 10 Q 10 90, 90 90"
            stroke="url(#snake-bl-white)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathOffset: 0 }}
            animate={{ pathOffset: [0, 1] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
            style={{ pathLength: 0.35 }}
          />
          <defs>
            <linearGradient id="snake-bl-white" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FAF8F5" stopOpacity="0" />
              <stop offset="60%" stopColor="#F5F2EB" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FAF8F5" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom-Right Corner Snake */}
      <div className="absolute bottom-4 right-4 w-32 h-32 opacity-75">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <path
            d="M 90 10 Q 90 90, 10 90"
            stroke="rgba(250,248,245,0.1)"
            strokeWidth="2"
            strokeDasharray="3 4"
          />
          <motion.path
            d="M 90 10 Q 90 90, 10 90"
            stroke="url(#snake-br-white)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathOffset: 0 }}
            animate={{ pathOffset: [0, 1] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "linear" }}
            style={{ pathLength: 0.35 }}
          />
          <defs>
            <linearGradient id="snake-br-white" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FAF8F5" stopOpacity="0" />
              <stop offset="60%" stopColor="#F5F2EB" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FAF8F5" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function AuthFormContainer({
  mode,
  onSetMode,
  onSuccess,
}: {
  mode: "signin" | "signup" | "forgot";
  onSetMode: (m: "signin" | "signup" | "forgot") => void;
  onSuccess?: () => void;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[400px] group">
      {/* Continuous Rotating Glowing Snake Border Beam around the 4 Corners */}
      <div className="absolute -inset-[1.5px] rounded-[26px] overflow-hidden pointer-events-none -z-0">
        <motion.div
          className="absolute -inset-[100%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_280deg,rgba(250,248,245,0.35)_330deg,#FAF8F5_360deg)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Main Glassmorphic Auth Card */}
      <div className="relative z-10 grid w-full gap-4 p-6 sm:p-8 rounded-[24px] border border-[#FAF8F5]/20 bg-[#121214]/95 backdrop-blur-3xl shadow-2xl shadow-black/60">
        {mode === "signin" && (
          <SignInForm
            onSuccess={onSuccess}
            onForgotPassword={() => onSetMode("forgot")}
          />
        )}
        {mode === "signup" && <SignUpForm onSuccess={onSuccess} />}
        {mode === "forgot" && (
          <ForgotPasswordForm onBackToSignIn={() => onSetMode("signin")} />
        )}

        {mode !== "forgot" && (
          <div className="text-center text-xs text-[#FAF8F5]/60 pt-2 border-t border-[#FAF8F5]/10">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => onSetMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-[#FF7E67] hover:text-[#FFA07A] hover:underline pl-1 cursor-pointer transition-colors"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export interface AuthContentProps {
  image?: {
    src: string;
    alt: string;
  };
  quote?: {
    text: string;
    author: string;
  };
}

export interface AuthUIProps {
  initialMode?: "signin" | "signup" | "forgot";
  signInContent?: AuthContentProps;
  signUpContent?: AuthContentProps;
  onSuccess?: () => void;
}

const defaultSignInContent = {
  image: {
    src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80",
    alt: "Students learning and preparing for careers",
  },
  quote: {
    text: "Your skills are real. Your next breakthrough is closer than you think.",
    author: "Hirxora",
  },
};

const defaultSignUpContent = {
  image: {
    src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80",
    alt: "Young engineers collaborating together",
  },
  quote: {
    text: "Prepare with calm confidence. Every dream offer begins with a first step.",
    author: "Hirxora",
  },
};

export function AuthUI({
  initialMode = "signin",
  signInContent = {},
  signUpContent = {},
  onSuccess,
}: AuthUIProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initialMode);

  const finalSignInContent = {
    image: { ...defaultSignInContent.image, ...signInContent.image },
    quote: { ...defaultSignInContent.quote, ...signInContent.quote },
  };
  const finalSignUpContent = {
    image: { ...defaultSignUpContent.image, ...signUpContent.image },
    quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
  };

  const currentContent = mode === "signup" ? finalSignUpContent : finalSignInContent;

  return (
    <div className="w-full min-h-screen bg-[#080607] text-[#FAF8F5] md:grid md:grid-cols-2 relative overflow-hidden selection:bg-[#FAF8F5] selection:text-black">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>

      {/* 4-Corner Floating Snake Beams on Left Area */}
      <FourCornerSnakeBeams />

      {/* Left Form Area */}
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-8 z-10">
        <AuthFormContainer
          mode={mode}
          onSetMode={setMode}
          onSuccess={onSuccess}
        />
      </div>

      {/* Right Split Screen with Typewriter and Ambient Cinematic Image */}
      <div
        className="hidden md:block relative bg-cover bg-center transition-all duration-700 ease-in-out"
        style={{ backgroundImage: `url(${currentContent.image.src})` }}
        key={currentContent.image.src}
      >
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#FAF8F5]/[0.03] via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#080607] via-[#080607]/80 to-transparent" />

        <div className="relative z-10 flex h-full flex-col items-center justify-end p-8 pb-14">
          <blockquote className="space-y-3 text-center max-w-lg">
            <p className="font-serif text-xl sm:text-2xl font-normal text-[#FAF8F5] leading-snug">
              “
              <Typewriter
                key={currentContent.quote.text}
                text={currentContent.quote.text}
                speed={50}
              />
              ”
            </p>
            <cite className="block text-xs uppercase font-mono tracking-widest text-[#FF7E67] not-italic font-semibold drop-shadow-[0_0_15px_rgba(255,107,107,0.35)]">
              — {currentContent.quote.author}
            </cite>
          </blockquote>
        </div>
      </div>
    </div>
  );
}

export default AuthUI;
