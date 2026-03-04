import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../state/auth";
import LoginDialog from "../../components/dialogs/LoginDialog";

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSwitchToRegister = () => {
    navigate("/register");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <LoginDialog
        isOpen={true}
        onClose={() => navigate("/")}
        onSwitchToRegister={handleSwitchToRegister}
      />
    </div>
  );
}
