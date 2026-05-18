import Login from "@/components/login";
import { findCurrentUser } from "@/lib/admin";
import React from "react";

const AuthProvider = async () => {
  const admin = await findCurrentUser();
  console.log("ADMIN  ", admin);
  if (admin) return null;
  return (
    <div className="fixed z-[1000] w-full h-screen flex justify-center items-center bg-background">
      <Login />
    </div>
  );
};

export default AuthProvider;
