import { useEffect, useMemo, useRef, useState } from "react";
import { Mail, Lock, Eye, EyeOff, User, Store, ShieldCheck, Loader2 } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import AppLogo from "@/components/AppLogo.jsx";
import { useTheme } from "@/context/ThemeContext.jsx";
import { useTranslation } from "@/context/LanguageContext.jsx";
import { auth, googleProvider } from "@/firebase/firebaseConfig.js";

const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

const strength = (pw) => {
  const v = pw || "";
  const hasLen = v.length >= 8;
  const hasNum = /\\d/.test(v);
  const hasSpecial = /[^A-Za-z0-9]/.test(v);
  if (!v) return { pct: 0, labelKey: "", tone: "" };
  if (!hasLen) return { pct: 33, labelKey: "passwordWeak", tone: "bg-red-500" };
  if (hasLen && (hasNum || hasSpecial)) {
    if (hasNum && hasSpecial) return { pct: 100, labelKey: "passwordStrong", tone: "bg-[#16A34A]" };
    return { pct: 66, labelKey: "passwordFair", tone: "bg-amber-500" };
  }
  return { pct: 66, labelKey: "passwordFair", tone: "bg-amber-500" };
};

/**
 * Complete replacement LoginPage.
 * @param {{ onLoggedIn: () => void }} props
 */
export default function LoginPage({ onLoggedIn }) {
  const { t, language, setLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMode, setSuccessMode] = useState("login");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const [values, setValues] = useState({
    name: "",
    business: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // touched tracks which fields user has LEFT (onBlur)
  const [touched, setTouched] = useState({});

  // errors only computed from touched fields
  const [errors, setErrors] = useState({});

  const [pwFocused, setPwFocused] = useState(false);
  const [terms, setTerms] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);

  const validateField = (field, value) => {
    switch (field) {
      case "name":
        if (!value || value.trim().length < 2) return t("errorNameMin");
        return "";
      case "business":
        if (!value || value.trim().length < 3) return t("errorBusinessMin");
        return "";
      case "email":
        if (!value) return t("errorEmpty");
        if (!emailRegex.test(String(value).trim())) return t("errorEmail");
        return "";
      case "password":
        if (!value) return t("errorEmpty");
        if (String(value).length < 8) return t("errorPasswordMin");
        return "";
      case "confirmPassword":
        if (!value) return t("errorEmpty");
        if (value !== values.password) return t("errorPasswordMatch");
        return "";
      default:
        return "";
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Rule 5: don't revalidate a passing field until submit again
    if (touched[field] && errors[field] === "") return;

    const fieldError = validateField(field, values[field]);
    setErrors((prev) => ({ ...prev, [field]: fieldError }));
  };

  const getFieldError = (field) => {
    return touched[field] ? errors[field] : "";
  };

  const handleSubmit = (mode) => {
    const relevant =
      mode === "login"
        ? ["email", "password"]
        : ["name", "business", "email", "password", "confirmPassword"];

    const allTouched = relevant.reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched((prev) => ({ ...prev, ...allTouched }));

    const allErrors = relevant.reduce(
      (acc, key) => ({ ...acc, [key]: validateField(key, values[key]) }),
      {},
    );
    setErrors((prev) => ({ ...prev, ...allErrors }));

    const hasErrors = Object.values(allErrors).some((e) => e !== "");
    if (hasErrors) return;

    if (mode === "signup") {
      setTermsTouched(true);
      if (!terms) return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMode(mode);
      setShowSuccess(true);
      setTimeout(() => {
        localStorage.setItem("warkahbiz_logged_in", "true");
        if (mode === "signup") {
          localStorage.setItem("warkahbiz_profile_name", values.name);
          localStorage.setItem("warkahbiz_business_name", values.business);
        }
        onLoggedIn();
      }, 1500);
    }, 1500);
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleError("");
      setGoogleLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      localStorage.setItem("warkahbiz_logged_in", "true");
      localStorage.setItem(
        "warkahbiz_user",
        JSON.stringify({
          name: user.displayName,
          email: user.email,
          photo: user.photoURL,
          uid: user.uid,
        }),
      );

      if (user.displayName) localStorage.setItem("warkahbiz_profile_name", user.displayName);
      setSuccessMode("login");
      setShowSuccess(true);
      setTimeout(() => onLoggedIn(), 1500);
    } catch (error) {
      if (error?.code !== "auth/popup-closed-by-user") {
        setGoogleError(t("googleLoginError"));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const langRef = useRef(null);
  const [langOpen, setLangOpen] = useState(false);
  useEffect(() => {
    const fn = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const langOptions = useMemo(
    () => [
      { code: "ms", flag: "🇲🇾", short: "BM", name: t("langNativeMs") },
      { code: "en", flag: "🇬🇧", short: "EN", name: t("langNativeEn") },
      { code: "zh", flag: "🇨🇳", short: "中文", name: `${t("langNativeZh")} (${t("langAliasZh")})` },
      { code: "ta", flag: "🇮🇳", short: "தமிழ்", name: `${t("langNativeTa")} (${t("langAliasTa")})` },
    ],
    [t],
  );
  const currentLang = langOptions.find((o) => o.code === language) || langOptions[0];

  const pwBar = strength(values.password);
  const showStrength = !!values.password && (pwFocused || touched.password);

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[9999] grid place-items-center bg-white dark:bg-[#0F172A] animate-fade-in px-6">
        <div className="w-24 h-24 rounded-full bg-[#16A34A] grid place-items-center shadow-lg animate-check-pop">
          <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="mt-6 text-center">
          <div className="text-xl font-bold text-[#0F172A] dark:text-slate-100">{t("welcomeBack")}</div>
          {successMode === "signup" ? (
            <div className="mt-2 text-sm text-[#64748B] dark:text-slate-400">{t("accountCreated")}</div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#DCFCE7] to-[#F8FAFC] dark:from-[#14532D] dark:to-[#0F172A] flex">
      <div className="w-full max-w-[390px] min-h-screen mx-auto flex flex-col overflow-hidden">
        {/* ROW 1 — controls bar (inside frame) */}
        <div className="relative flex items-center justify-between px-4 py-3">
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className="tap rounded-full px-3 py-1.5 text-[13px] font-semibold bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F1F5F9] border border-[#E2E8F0] dark:border-[#334155] shadow-sm"
            >
              {currentLang.flag} {currentLang.short}
            </button>
            {langOpen ? (
              <div className="absolute left-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] shadow-lg overflow-hidden z-20">
                {langOptions.map((o) => (
                  <button
                    key={o.code}
                    type="button"
                    onClick={() => {
                      setLanguage(o.code);
                      setLangOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm tap hover:bg-[#F0FDF4] dark:hover:bg-slate-700 ${
                      language === o.code ? "font-bold text-[#16A34A]" : "text-[#0F172A] dark:text-[#F1F5F9]"
                    }`}
                  >
                    {o.flag} {o.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="tap w-9 h-9 rounded-full grid place-items-center bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] shadow-sm text-lg"
            aria-label={theme === "dark" ? t("lightMode") : t("darkMode")}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>

        {/* ROW 2 — hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-5">
          <div className="animate-fade-in [animation-duration:300ms] animate-pop-in">
            <AppLogo size="lg" />
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]">{t("appName")}</div>
          <div className="mt-1 text-[13px] text-[#64748B] dark:text-slate-300 italic text-center">{t("appTagline")}</div>
          <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar max-w-full px-2">
            <span className="shrink-0 px-3 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A] text-[11px] font-semibold">💰 {t("badge1")}</span>
            <span className="shrink-0 px-3 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A] text-[11px] font-semibold">🤖 {t("badge2")}</span>
            <span className="shrink-0 px-3 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A] text-[11px] font-semibold">📦 {t("badge3")}</span>
          </div>
        </div>

        {/* ROW 3 — form card */}
        <div className="bg-white dark:bg-[#1E293B] rounded-t-[24px] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-5 pt-6 pb-8 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 rounded-xl p-1 bg-[#F1F5F9] dark:bg-slate-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setErrors({});
                setTouched({});
                setGoogleError("");
              }}
              className={`tap py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === "login" ? "bg-[#16A34A] text-white" : "text-[#64748B] dark:text-slate-300"
              }`}
            >
              {t("login")}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setErrors({});
                setTouched({});
                setGoogleError("");
              }}
              className={`tap py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === "signup" ? "bg-[#16A34A] text-white" : "text-[#64748B] dark:text-slate-300"
              }`}
            >
              {t("signup")}
            </button>
          </div>

          {activeTab === "login" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit("login");
              }}
            >
              <Field
                label={t("emailLabel")}
                icon={<Mail className="w-4 h-4" />}
                error={getFieldError("email")}
              >
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))}
                  onBlur={() => handleBlur("email")}
                  placeholder={t("emailPlaceholder")}
                  className={inputCls(!!getFieldError("email"), "pr-3")}
                />
              </Field>

              <Field
                label={t("passwordLabel")}
                icon={<Lock className="w-4 h-4" />}
                error={getFieldError("password")}
                suffix={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="tap p-2 text-[#64748B] dark:text-slate-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              >
                <input
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                  onChange={(e) => setValues((p) => ({ ...p, password: e.target.value }))}
                  onBlur={() => handleBlur("password")}
                  placeholder={t("passwordPlaceholder")}
                  className={inputCls(!!getFieldError("password"), "pr-10")}
                />
              </Field>

              <div className="text-right mt-1">
                <button type="button" className="tap text-[#16A34A] text-xs font-semibold">
                  {t("forgotPassword")}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="tap w-full h-[52px] mt-4 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("loggingIn")}
                  </>
                ) : (
                  t("loginButton")
                )}
              </button>

              <Divider label={t("orDivider")} />

              <GoogleButton
                label={t("googleButton")}
                loading={googleLoading}
                onClick={handleGoogleLogin}
              />
              {googleError ? <p className="text-[11px] text-[#DC2626] mt-2 animate-fade-in">{googleError}</p> : null}
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit("signup");
              }}
            >
              <Field label={t("nameLabel")} icon={<User className="w-4 h-4" />} error={getFieldError("name")}>
                <input
                  type="text"
                  value={values.name}
                  onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
                  onBlur={() => handleBlur("name")}
                  placeholder={t("namePlaceholder")}
                  className={inputCls(!!getFieldError("name"), "pr-3")}
                />
              </Field>

              <Field label={t("businessLabel")} icon={<Store className="w-4 h-4" />} error={getFieldError("business")}>
                <input
                  type="text"
                  value={values.business}
                  onChange={(e) => setValues((p) => ({ ...p, business: e.target.value }))}
                  onBlur={() => handleBlur("business")}
                  placeholder={t("businessPlaceholder")}
                  className={inputCls(!!getFieldError("business"), "pr-3")}
                />
              </Field>

              <Field label={t("emailLabel")} icon={<Mail className="w-4 h-4" />} error={getFieldError("email")}>
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))}
                  onBlur={() => handleBlur("email")}
                  placeholder={t("emailPlaceholder")}
                  className={inputCls(!!getFieldError("email"), "pr-3")}
                />
              </Field>

              <Field
                label={t("passwordLabel")}
                icon={<Lock className="w-4 h-4" />}
                error={getFieldError("password")}
                suffix={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="tap p-2 text-[#64748B] dark:text-slate-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              >
                <input
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                  onChange={(e) => setValues((p) => ({ ...p, password: e.target.value }))}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => {
                    setPwFocused(false);
                    handleBlur("password");
                  }}
                  placeholder={t("passwordPlaceholder")}
                  className={inputCls(!!getFieldError("password"), "pr-10")}
                />
              </Field>

              {showStrength ? (
                <div className="mt-1">
                  <div className="h-1.5 rounded-full bg-[#E2E8F0] dark:bg-[#334155] overflow-hidden">
                    <div className={`h-full ${pwBar.tone} transition-all`} style={{ width: `${pwBar.pct}%` }} />
                  </div>
                  <div className="text-[11px] mt-1 text-[#64748B] dark:text-slate-300">
                    {pwBar.labelKey ? t(pwBar.labelKey) : ""}
                  </div>
                </div>
              ) : null}

              <Field
                label={t("confirmPassword")}
                icon={<ShieldCheck className="w-4 h-4" />}
                error={getFieldError("confirmPassword")}
              >
                <input
                  type="password"
                  value={values.confirmPassword}
                  onChange={(e) => setValues((p) => ({ ...p, confirmPassword: e.target.value }))}
                  onBlur={() => handleBlur("confirmPassword")}
                  placeholder={t("confirmPassword")}
                  className={inputCls(!!getFieldError("confirmPassword"), "pr-3")}
                />
              </Field>

              <label className="mt-2 flex items-start gap-2 text-xs text-[#64748B] dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] accent-[#16A34A]"
                />
                <span>{t("termsText")}</span>
              </label>
              {termsTouched && !terms ? (
                <p className="text-[11px] text-[#DC2626] mt-1 animate-fade-in">{t("errorTerms")}</p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="tap w-full h-[52px] mt-4 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("registering")}
                  </>
                ) : (
                  t("signupButton")
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function inputCls(isError, extra = "") {
  return `w-full h-12 rounded-[10px] border-[1.5px] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-[#64748B] dark:placeholder:text-slate-300 text-sm pl-10 ${extra} outline-none transition-shadow ${
    isError
      ? "border-[#DC2626] shadow-[0_0_0_3px_rgba(220,38,38,0.15)]"
      : "border-[#E2E8F0] dark:border-[#334155] focus:border-[#16A34A] focus:shadow-[0_0_0_3px_rgba(22,163,74,0.15)]"
  }`;
}

function Field({ label, icon, children, error, suffix }) {
  return (
    <div className="mb-3.5">
      <label className="block text-xs font-medium text-[#64748B] dark:text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-slate-300">{icon}</span>
        {children}
        {suffix ? <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{suffix}</span> : null}
      </div>
      {error ? <p className="text-[11px] text-[#DC2626] mt-1 animate-fade-in">{error}</p> : null}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-[#334155]" />
      <span className="text-xs text-[#64748B] dark:text-slate-300">{label}</span>
      <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-[#334155]" />
    </div>
  );
}

function GoogleButton({ label, loading, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="tap w-full h-[52px] rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] font-semibold text-[#0F172A] dark:text-[#F1F5F9] flex items-center justify-center gap-3 disabled:opacity-70"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      )}
      {label}
    </button>
  );
}
