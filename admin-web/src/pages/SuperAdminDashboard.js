import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API_BASE_URL = "http://172.20.10.11:5000/api";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [recentSignups, setRecentSignups] = useState([]);

  // Data states
  const [ratings, setRatings] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [complaintsStats, setComplaintsStats] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [kycList, setKYCList] = useState([]);
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showKYCModal, setShowKYCModal] = useState(false);

  // Profile states
  const [adminProfile, setAdminProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phoneNumber: "",
  });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/");
      return;
    }

    // Load profile on mount
    if (!adminProfile) {
      loadProfile();
    }

    if (activeTab === "dashboard") loadDashboard();
    else if (activeTab === "ratings") loadRatings();
    else if (activeTab === "complaints") loadComplaints();
    else if (activeTab === "team") loadTeam();
    else if (activeTab === "kyc") loadKYC();
    else if (activeTab === "users") loadUsers();
    else if (activeTab === "providers") loadProviders();
    else if (activeTab === "audit") loadAuditLogs();
    else if (activeTab === "profile") loadProfile();
  }, [activeTab, navigate]);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
  });

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/admin/dashboard/metrics`,
        getAuthHeaders()
      );
      setMetrics(res.data.metrics);
      setRecentSignups(res.data.recentSignups);
    } catch (err) {
      console.error("Load dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/admin/ratings`,
        getAuthHeaders()
      );
      setRatings(res.data.ratings);
    } catch (err) {
      console.error("Load ratings error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/admin/complaints`,
        getAuthHeaders()
      );
      setComplaints(res.data.complaints);
      setComplaintsStats(res.data.statusCounts);
    } catch (err) {
      console.error("Load complaints error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeam = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/admin/team`,
        getAuthHeaders()
      );
      setTeamMembers(res.data.teamMembers);
    } catch (err) {
      console.error("Load team error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadKYC = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/admin/kyc`,
        getAuthHeaders()
      );
      setKYCList(res.data.providers);
    } catch (err) {
      console.error("Load KYC error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/admin/users`,
        getAuthHeaders()
      );
      setUsers(res.data.users);
    } catch (err) {
      console.error("Load customers error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/admin/providers`,
        getAuthHeaders()
      );
      setProviders(res.data.providers);
    } catch (err) {
      console.error("Load providers error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/admin/audit-logs`,
        getAuthHeaders()
      );
      setAuditLogs(res.data.logs);
    } catch (err) {
      console.error("Load audit logs error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/");
  };

  const approveKYC = async (userId) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/admin/kyc/${userId}/approve`,
        {},
        getAuthHeaders()
      );
      alert("KYC approved successfully!");
      loadKYC();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to approve KYC");
    }
  };

  const rejectKYC = async (userId) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      await axios.patch(
        `${API_BASE_URL}/admin/kyc/${userId}/reject`,
        { reason },
        getAuthHeaders()
      );
      alert("KYC rejected successfully!");
      loadKYC();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to reject KYC");
    }
  };

  const hideRating = async (ratingId) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/admin/ratings/${ratingId}/status`,
        { action: "hide" },
        getAuthHeaders()
      );
      loadRatings();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to hide rating");
    }
  };

  const deleteRating = async (ratingId) => {
    if (!window.confirm("Are you sure you want to delete this rating?")) return;

    try {
      await axios.patch(
        `${API_BASE_URL}/admin/ratings/${ratingId}/status`,
        { action: "delete" },
        getAuthHeaders()
      );
      loadRatings();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete rating");
    }
  };

  const updateComplaintStatus = async (complaintId, status) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/admin/complaints/${complaintId}/status`,
        { status },
        getAuthHeaders()
      );
      loadComplaints();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update complaint");
    }
  };

  const loadProfile = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/admin/profile`,
        getAuthHeaders()
      );
      setAdminProfile(response.data);
      setProfileForm({
        name: response.data.name || "",
        phoneNumber: response.data.phoneNumber || "",
      });
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  const updateProfile = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/admin/profile`,
        profileForm,
        getAuthHeaders()
      );
      alert("Profile updated successfully!");
      setEditingProfile(false);
      loadProfile();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update profile");
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>SuperAdmin</h2>
          <p>Full Access</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 Dashboard
          </button>
          <button
            className={activeTab === "kyc" ? "active" : ""}
            onClick={() => setActiveTab("kyc")}
          >
            ✅ KYC Management
          </button>
          <button
            className={activeTab === "ratings" ? "active" : ""}
            onClick={() => setActiveTab("ratings")}
          >
            ⭐ Ratings & Reviews
          </button>
          <button
            className={activeTab === "complaints" ? "active" : ""}
            onClick={() => setActiveTab("complaints")}
          >
            🚨 Complaints
          </button>
          <button
            className={activeTab === "team" ? "active" : ""}
            onClick={() => setActiveTab("team")}
          >
            🧑‍💼 Team Management
          </button>
          <button
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            👥 Users
          </button>
          <button
            className={activeTab === "providers" ? "active" : ""}
            onClick={() => setActiveTab("providers")}
          >
            👨‍🔧 Providers
          </button>
          <button
            className={activeTab === "audit" ? "active" : ""}
            onClick={() => setActiveTab("audit")}
          >
            📜 Audit Logs
          </button>
          <button
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => setActiveTab("profile")}
          >
            👤 Profile
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Header with Profile */}
        <div className="dashboard-header">
          <div className="header-title">
            <h1>
              {activeTab.charAt(0).toUpperCase() +
                activeTab.slice(1).replace(/([A-Z])/g, " $1")}
            </h1>
            <p>Manage your system efficiently</p>
          </div>

          {adminProfile && (
            <div className="header-profile">
              <div
                className="profile-trigger"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <div className="profile-info-header">
                  <span className="profile-name">
                    {adminProfile.name || "Admin"}
                  </span>
                  <span className="profile-role">SuperAdmin</span>
                </div>
                <div className="profile-avatar-header">
                  {adminProfile.name?.charAt(0) || "A"}
                </div>
                <svg
                  className={`dropdown-arrow ${
                    showProfileDropdown ? "open" : ""
                  }`}
                  width="12"
                  height="8"
                  viewBox="0 0 12 8"
                  fill="none"
                >
                  <path
                    d="M1 1.5L6 6.5L11 1.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {showProfileDropdown && (
                <>
                  <div
                    className="dropdown-backdrop"
                    onClick={() => setShowProfileDropdown(false)}
                  ></div>
                  <div className="profile-dropdown">
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">
                        {adminProfile.name?.charAt(0) || "A"}
                      </div>
                      <div className="dropdown-info">
                        <h4>{adminProfile.name || "Admin User"}</h4>
                        <p>{adminProfile.phoneNumber}</p>
                        <span className="dropdown-role-badge">SuperAdmin</span>
                      </div>
                    </div>

                    <div className="dropdown-divider"></div>

                    <div className="dropdown-menu">
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setActiveTab("profile");
                          setShowProfileDropdown(false);
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M8 8C9.933 8 11.5 6.433 11.5 4.5C11.5 2.567 9.933 1 8 1C6.067 1 4.5 2.567 4.5 4.5C4.5 6.433 6.067 8 8 8Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M13.5 15C13.5 12.515 11.0899 10.5 8 10.5C4.91015 10.5 2.5 12.515 2.5 15"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span>My Profile</span>
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setActiveTab("dashboard");
                          setShowProfileDropdown(false);
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <rect
                            x="2"
                            y="2"
                            width="5"
                            height="5"
                            rx="1"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <rect
                            x="9"
                            y="2"
                            width="5"
                            height="5"
                            rx="1"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <rect
                            x="2"
                            y="9"
                            width="5"
                            height="5"
                            rx="1"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <rect
                            x="9"
                            y="9"
                            width="5"
                            height="5"
                            rx="1"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>
                        <span>Dashboard</span>
                      </button>
                    </div>

                    <div className="dropdown-divider"></div>

                    <button
                      className="dropdown-item logout-item"
                      onClick={() => {
                        handleLogout();
                        setShowProfileDropdown(false);
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M6 14H3.33333C2.59695 14 2 13.403 2 12.6667V3.33333C2 2.59695 2.59695 2 3.33333 2H6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M10.6667 11.3333L14 8L10.6667 4.66667"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 8H6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {loading && <div className="loading-overlay">Loading...</div>}

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && metrics && (
          <div className="dashboard-content">
            <h1>Dashboard Overview</h1>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-info">
                  <h3>{metrics.totalProviders}</h3>
                  <p>Total Providers</p>
                </div>
                <div className="metric-bar">
                  <div className="bar-fill" style={{ width: "70%" }}></div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-info">
                  <h3>{metrics.totalCustomers}</h3>
                  <p>Total Customers</p>
                </div>
                <div className="metric-bar">
                  <div className="bar-fill" style={{ width: "85%" }}></div>
                </div>
              </div>
              <div className="metric-card green">
                <div className="metric-info">
                  <h3>{metrics.verifiedProviders}</h3>
                  <p>Verified Providers</p>
                </div>
                <div className="metric-bar">
                  <div
                    className="bar-fill green"
                    style={{
                      width: `${
                        (metrics.verifiedProviders / metrics.totalProviders) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="metric-card orange">
                <div className="metric-info">
                  <h3>{metrics.kycPending}</h3>
                  <p>KYC Pending</p>
                </div>
                <div className="metric-bar">
                  <div
                    className="bar-fill orange"
                    style={{
                      width: `${
                        (metrics.kycPending / metrics.totalProviders) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="metric-card red">
                <div className="metric-info">
                  <h3>{metrics.kycRejected}</h3>
                  <p>KYC Rejected</p>
                </div>
                <div className="metric-bar">
                  <div
                    className="bar-fill red"
                    style={{
                      width: `${
                        (metrics.kycRejected / metrics.totalProviders) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="metric-card blue">
                <div className="metric-info">
                  <h3>{metrics.dailyRegistrations}</h3>
                  <p>Daily Registrations</p>
                </div>
                <div className="metric-bar">
                  <div className="bar-fill blue" style={{ width: "60%" }}></div>
                </div>
              </div>
              <div className="metric-card blue">
                <div className="metric-info">
                  <h3>{metrics.weeklyRegistrations}</h3>
                  <p>Weekly Registrations</p>
                </div>
                <div className="metric-bar">
                  <div className="bar-fill blue" style={{ width: "75%" }}></div>
                </div>
              </div>
              <div className="metric-card blue">
                <div className="metric-info">
                  <h3>{metrics.monthlyRegistrations}</h3>
                  <p>Monthly Registrations</p>
                </div>
                <div className="metric-bar">
                  <div className="bar-fill blue" style={{ width: "90%" }}></div>
                </div>
              </div>
            </div>

            <div className="activity-section">
              <h2>Activity Chart</h2>
              <div className="chart-container">
                <div className="bar-chart">
                  <div className="bar-item">
                    <div
                      className="bar active"
                      style={{
                        height: `${
                          (metrics.activeProviders / metrics.totalProviders) *
                          200
                        }px`,
                      }}
                    ></div>
                    <p>Active ({metrics.activeProviders})</p>
                  </div>
                  <div className="bar-item">
                    <div
                      className="bar inactive"
                      style={{
                        height: `${
                          (metrics.inactiveProviders / metrics.totalProviders) *
                          200
                        }px`,
                      }}
                    ></div>
                    <p>Inactive ({metrics.inactiveProviders})</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="recent-signups">
              <h2>Recent Provider Signups</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>KYC Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSignups.map((provider) => (
                    <tr key={provider.id}>
                      <td>{provider.name}</td>
                      <td>{provider.phoneNumber}</td>
                      <td>
                        <span className={`status-badge ${provider.kycStatus}`}>
                          {provider.kycStatus}
                        </span>
                      </td>
                      <td>
                        {new Date(provider.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KYC MANAGEMENT TAB */}
        {activeTab === "kyc" && (
          <div className="dashboard-content">
            <h1>KYC Management - Submitted Applications</h1>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {kycList.map((provider) => (
                  <tr key={provider.id} style={{ cursor: "pointer" }}>
                    <td
                      onClick={() => {
                        setSelectedProvider(provider);
                        setShowKYCModal(true);
                      }}
                    >
                      {provider.name}
                    </td>
                    <td
                      onClick={() => {
                        setSelectedProvider(provider);
                        setShowKYCModal(true);
                      }}
                    >
                      {provider.phoneNumber}
                    </td>
                    <td
                      onClick={() => {
                        setSelectedProvider(provider);
                        setShowKYCModal(true);
                      }}
                    >
                      <span className={`status-badge ${provider.kycStatus}`}>
                        {provider.kycStatus}
                      </span>
                    </td>
                    <td
                      onClick={() => {
                        setSelectedProvider(provider);
                        setShowKYCModal(true);
                      }}
                    >
                      {provider.kycSubmittedAt
                        ? new Date(provider.kycSubmittedAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => {
                          setSelectedProvider(provider);
                          setShowKYCModal(true);
                        }}
                      >
                        Review KYC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* RATINGS TAB */}
        {activeTab === "ratings" && (
          <div className="dashboard-content">
            <h1>Ratings & Reviews Management</h1>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rater</th>
                  <th>Ratee</th>
                  <th>Score</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((rating) => (
                  <tr key={rating.id}>
                    <td>{rating.rater?.name || "N/A"}</td>
                    <td>{rating.ratee?.name || "N/A"}</td>
                    <td>⭐ {rating.score}</td>
                    <td>{rating.comment}</td>
                    <td>{new Date(rating.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn-hide"
                        onClick={() => hideRating(rating.id)}
                      >
                        Hide
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => deleteRating(rating.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* COMPLAINTS TAB */}
        {activeTab === "complaints" && (
          <div className="dashboard-content">
            <h1>Complaints & Support</h1>

            {complaintsStats && (
              <div className="metrics-grid">
                <div className="metric-card">
                  <h3>{complaintsStats.total}</h3>
                  <p>Total Complaints</p>
                </div>
                <div className="metric-card orange">
                  <h3>{complaintsStats.open}</h3>
                  <p>Open</p>
                </div>
                <div className="metric-card blue">
                  <h3>{complaintsStats.inProgress}</h3>
                  <p>In Progress</p>
                </div>
                <div className="metric-card green">
                  <h3>{complaintsStats.closed}</h3>
                  <p>Closed</p>
                </div>
              </div>
            )}

            <table className="data-table">
              <thead>
                <tr>
                  <th>Reporter</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint.id}>
                    <td>{complaint.reporter?.name || "N/A"}</td>
                    <td>{complaint.reason}</td>
                    <td>
                      <span className={`status-badge ${complaint.status}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td>{complaint.assignedUser?.name || "Unassigned"}</td>
                    <td>
                      {complaint.status !== "closed" && (
                        <button
                          className="btn-close"
                          onClick={() =>
                            updateComplaintStatus(complaint.id, "closed")
                          }
                        >
                          Close
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === "team" && (
          <div className="dashboard-content">
            <h1>Team Management</h1>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td>{member.phoneNumber}</td>
                    <td>
                      <span className={`role-badge ${member.role}`}>
                        {member.role}
                      </span>
                    </td>
                    <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="dashboard-content">
            <h1>All Users</h1>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Address</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.phoneNumber}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.address || "N/A"}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PROVIDERS TAB */}
        {activeTab === "providers" && (
          <div className="dashboard-content">
            <h1>All Service Providers</h1>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>KYC Status</th>
                  <th>Services</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr key={provider.id}>
                    <td>{provider.name}</td>
                    <td>{provider.phoneNumber}</td>
                    <td>
                      <span className={`status-badge ${provider.kycStatus}`}>
                        {provider.kycStatus}
                      </span>
                    </td>
                    <td>{provider.services?.length || 0}</td>
                    <td>{new Date(provider.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === "audit" && (
          <div className="dashboard-content">
            <h1>Audit Logs</h1>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.user?.name || "N/A"}</td>
                    <td>
                      <span className="action-badge">{log.action}</span>
                    </td>
                    <td>{log.description}</td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* KYC REVIEW MODAL */}
      {showKYCModal && selectedProvider && (
        <div className="modal-overlay" onClick={() => setShowKYCModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>KYC Review - {selectedProvider.name}</h2>
              <button
                className="modal-close"
                onClick={() => setShowKYCModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Warning banner if documents are missing */}
              {(!selectedProvider.kycFrontUrl ||
                !selectedProvider.kycBackUrl) && (
                <div className="kyc-warning-banner">
                  <strong>⚠️ Warning:</strong> Some KYC documents are missing.
                  The image upload may have failed. You can reject this KYC to
                  allow the provider to resubmit with proper documents.
                </div>
              )}

              <div className="kyc-info-section">
                <h3>Personal Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Name:</label>
                    <span>{selectedProvider.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Phone Number:</label>
                    <span>{selectedProvider.phoneNumber}</span>
                  </div>
                  <div className="info-item">
                    <label>Address:</label>
                    <span>{selectedProvider.address || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <label>Aadhaar Number:</label>
                    <span>{selectedProvider.aaadharNumber || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <label>PAN Number:</label>
                    <span>{selectedProvider.panCardNumber || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <label>Submitted At:</label>
                    <span>
                      {selectedProvider.kycSubmittedAt
                        ? new Date(
                            selectedProvider.kycSubmittedAt
                          ).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="kyc-documents-section">
                <h3>KYC Documents</h3>
                <div className="documents-grid">
                  {selectedProvider.profilePhoto && (
                    <div className="document-item">
                      <label>Profile Photo</label>
                      <img
                        src={selectedProvider.profilePhoto}
                        alt="Profile"
                        className="kyc-document-img"
                      />
                    </div>
                  )}
                  {selectedProvider.kycFrontUrl ? (
                    <div className="document-item">
                      <label>Aadhaar Card Front</label>
                      <img
                        src={selectedProvider.kycFrontUrl}
                        alt="Aadhaar Front"
                        className="kyc-document-img"
                      />
                    </div>
                  ) : (
                    <div className="document-item">
                      <label>Aadhaar Card Front</label>
                      <div className="kyc-document-missing">
                        <p>⚠️ Document not uploaded</p>
                        <small>The image upload may have failed</small>
                      </div>
                    </div>
                  )}
                  {selectedProvider.kycBackUrl ? (
                    <div className="document-item">
                      <label>PAN Card / Aadhaar Back</label>
                      <img
                        src={selectedProvider.kycBackUrl}
                        alt="Document Back"
                        className="kyc-document-img"
                      />
                    </div>
                  ) : (
                    <div className="document-item">
                      <label>PAN Card / Aadhaar Back</label>
                      <div className="kyc-document-missing">
                        <p>⚠️ Document not uploaded</p>
                        <small>The image upload may have failed</small>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="kyc-actions">
                {selectedProvider.kycStatus === "pending" && (
                  <>
                    <button
                      className="btn-approve-large"
                      onClick={() => {
                        approveKYC(selectedProvider.id);
                        setShowKYCModal(false);
                      }}
                    >
                      ✓ Approve KYC
                    </button>
                    <button
                      className="btn-reject-large"
                      onClick={() => {
                        rejectKYC(selectedProvider.id);
                        setShowKYCModal(false);
                      }}
                    >
                      ✗ Reject KYC
                    </button>
                  </>
                )}
                {selectedProvider.kycStatus === "verified" && (
                  <div className="kyc-verified-badge">✓ KYC Verified</div>
                )}
                {selectedProvider.kycStatus === "rejected" && (
                  <div className="kyc-rejected-badge">✗ KYC Rejected</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === "profile" && adminProfile && (
        <div className="dashboard-content">
          <h1>My Profile</h1>

          <div className="profile-container">
            <div className="profile-header">
              <div className="profile-avatar">
                <span>{adminProfile.name?.charAt(0) || "A"}</span>
              </div>
              <div className="profile-header-info">
                <h2>{adminProfile.name || "Admin User"}</h2>
                <span className="role-badge superadmin">SuperAdmin</span>
              </div>
            </div>

            <div className="profile-body">
              {!editingProfile ? (
                <>
                  <div className="profile-info-grid">
                    <div className="profile-info-item">
                      <label>Name</label>
                      <p>{adminProfile.name || "N/A"}</p>
                    </div>
                    <div className="profile-info-item">
                      <label>Phone Number</label>
                      <p>{adminProfile.phoneNumber || "N/A"}</p>
                    </div>
                    <div className="profile-info-item">
                      <label>Role</label>
                      <p>SuperAdmin</p>
                    </div>
                  </div>
                  <div className="profile-actions">
                    <button
                      className="btn-primary"
                      onClick={() => setEditingProfile(true)}
                    >
                      ✏️ Edit Profile
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="profile-form">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="Enter name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="text"
                        value={profileForm.phoneNumber}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phoneNumber: e.target.value,
                          })
                        }
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div className="profile-actions">
                    <button className="btn-primary" onClick={updateProfile}>
                      💾 Save Changes
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setEditingProfile(false);
                        setProfileForm({
                          name: adminProfile.name || "",
                          phoneNumber: adminProfile.phoneNumber || "",
                        });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
