import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";
import { API_BASE_URL } from "../config";

export default function AdminLogin() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);

    try {
      // Send OTP request to backend - using same API as mobile
      console.log("Sending OTP to:", `${API_BASE_URL}/auth/send-otp`);
      console.log("Request body:", { phone });

      const response = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
        phone: phone,
      });

      console.log("OTP Response:", response.data);

      if (response.data.ok) {
        setOtpSent(true);
        setError("");
        alert("OTP sent successfully! Check backend console for OTP code.");
      } else {
        setError(response.data.error || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      console.error("Error response:", err.response);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      // Verify OTP and login - using same API as mobile
      const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        phone: phone,
        otp: otp,
        role: "admin",
      });

      if (response.data.ok) {
        const { token, user } = response.data;

        // Store token and user data
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminUser", JSON.stringify(user));

        // Check if this is superadmin phone number or role
        if (
          phone === "9999999999" ||
          user?.role === "superAdmin" ||
          user?.role === "superadmin"
        ) {
          navigate("/admin/super-admin");
        } else if (user?.role === "customerSuccess") {
          navigate("/admin/customer-success");
        } else if (user?.role === "support") {
          navigate("/admin/support");
        } else {
          setError("Unauthorized access - Admin role required");
        }
      } else {
        setError(response.data.error || "Invalid OTP");
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError(err.response?.data?.error || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    setOtp("");
    setOtpSent(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="icon-circle">
            <svg
              className="shield-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="login-title">Admin Portal</h1>
          <p className="login-subtitle">Secure Login with OTP</p>
        </div>

        {error && (
          <div className="error-message">
            <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOTP} className="login-form">
            <div className="input-group">
              <label className="input-label">
                <svg
                  className="label-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Phone Number
              </label>
              <input
                type="tel"
                className="input-field"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                maxLength={10}
                disabled={loading}
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <svg
                    className="button-icon"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Send OTP
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="login-form">
            <div className="otp-info">
              <p className="otp-sent-text">
                OTP sent to <strong>+91 {phone}</strong>
              </p>
              <button
                type="button"
                onClick={handleResendOTP}
                className="change-number-button"
              >
                Change Number
              </button>
            </div>

            <div className="input-group">
              <label className="input-label">
                <svg
                  className="label-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                Enter OTP
              </label>
              <input
                type="text"
                className="input-field otp-input"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                disabled={loading}
                autoFocus
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <svg
                    className="button-icon"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Verify & Login
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSendOTP}
              className="resend-button"
              disabled={loading}
            >
              Resend OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
