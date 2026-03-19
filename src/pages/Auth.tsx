import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else navigate("/");
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    const chosenName = displayName.trim() || email.split("@")[0];
    if (chosenName.length < 2) { toast.error("Display name must be at least 2 characters"); return; }
    setLoading(true);
    // Check display name uniqueness
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("display_name", chosenName)
      .maybeSingle();
    if (existing) {
      toast.error("This display name is already taken, please choose another");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: chosenName },
        emailRedirectTo: `${appUrl}/auth`,
      },
    });
    if (error) toast.error(error.message);
    else toast.success("Check your email to confirm your account");
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Check your email for a reset link");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">⚽</span>
          <h1 className="text-xl font-semibold text-foreground tracking-tight mt-3">myTraining</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "Sign in to your account" : mode === "signup" ? "Create your account" : "Reset your password"}
          </p>
        </div>

        <form onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
          {mode !== "forgot" && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? "..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-4 text-center space-y-1">
          {mode === "login" && (
            <>
              <button onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Forgot password?
              </button>
              <p className="text-xs text-muted-foreground">
                No account?{" "}
                <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">
                  Sign up
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                Sign in
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <button onClick={() => setMode("login")} className="text-xs text-primary font-medium hover:underline">
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
