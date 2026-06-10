/**
 * Login Page - Admin Dashboard Authentication
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    alert("Reset password via email is not yet implemented in Go backend.");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-circle">SGM</div>
          <h2>SGM Hadir</h2>
          <p>Admin Dashboard</p>
        </div>

        {showForgotPassword ? (
          /* Forgot Password Form */
          <form onSubmit={handleResetPassword}>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                marginBottom: "8px",
                textAlign: "center",
              }}
            >
              Reset Password
            </h3>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-secondary)",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              Masukkan email Anda untuk menerima link reset password.
            </p>

            {resetSent ? (
              <div
                style={{
                  padding: "16px",
                  background: "#ECFDF5",
                  borderRadius: "8px",
                  textAlign: "center",
                  marginBottom: "16px",
                }}
              >
                <p
                  style={{
                    color: "#059669",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                  }}
                >
                  ✅ Link reset password telah dikirim ke email Anda.
                </p>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Email</label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-text-muted)",
                    }}
                  />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: "36px" }}
                    placeholder="email@sgm.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "16px",
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSent(false);
                }}
              >
                Kembali
              </button>
              {!resetSent && (
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Kirim Link
                </button>
              )}
            </div>
          </form>
        ) : (
          /* Login Form */
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#FEF2F2",
                  borderRadius: "8px",
                  color: "#DC2626",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-muted)",
                  }}
                />
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: "36px" }}
                  placeholder="email@sgm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-muted)",
                  }}
                />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  style={{ paddingLeft: "36px", paddingRight: "40px" }}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-muted)",
                    padding: "4px",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </button>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-primary)",
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                }}
              >
                Lupa password?
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
