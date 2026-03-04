import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../state/auth";
import RegisterDialog from "../../components/dialogs/RegisterDialog";

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSwitchToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <RegisterDialog
        isOpen={true}
        onClose={() => navigate("/")}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
}
