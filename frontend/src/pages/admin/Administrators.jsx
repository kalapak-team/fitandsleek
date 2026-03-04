import React from "react";
import Users from "./Users.jsx";

export default function AdministratorsPage() {
  return <Users showCustomers={false} showAdmins={true} />;
}
