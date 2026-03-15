import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";

export type UserRole = "Operations" | "Accounting" | "HR" | "Admin";

interface LoginProps {
  onLogin: (email: string, password: string, role: UserRole) => void;
}

// Email to role mapping
const emailToRoleMap: Record<string, UserRole> = {
  "jjb@jjbgroupofcompanies.com": "Admin",
  "pablo@jjbgroupofcompanies.com": "Operations",
  "gerlie@jjbgroupofcompanies.com": "Accounting",
  "shiela@jjbgroupofcompanies.com": "HR",
};

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous error
    setEmailError("");
    
    // Check if email is in the mapping
    const role = emailToRoleMap[email.toLowerCase().trim()];
    
    if (!role) {
      setEmailError("This demo account is not configured. Use one of the JJB emails shown below.");
      return;
    }
    
    onLogin(email, password, role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Card className="w-full max-w-md p-10 bg-white border border-[#E5E7EB] shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
        <div className="mb-10 text-center">
          <div className="inline-block p-4 bg-[#0A1D4D] rounded-lg mb-4">
            <h1 className="text-white">JJB OS</h1>
          </div>
          <p className="text-[#6B7280]">Logistics Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#0A1D4D]">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(""); // Clear error when user types
              }}
              placeholder="Enter your email"
              required
              className={`rounded-lg border-[#E5E7EB] focus:border-[#F25C05] focus:ring-[#F25C05]/20 transition-all duration-200 h-12 ${
                emailError ? "border-red-500" : ""
              }`}
            />
            {emailError && (
              <p className="text-xs text-red-600 mt-1">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#0A1D4D]">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="rounded-lg border-[#E5E7EB] focus:border-[#F25C05] focus:ring-[#F25C05]/20 transition-all duration-200 h-12"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-[#F25C05] hover:bg-[#D84D00] text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"
          >
            Login
          </Button>
        </form>

        {/* Demo Accounts Card */}
        <div className="mt-6 bg-[#F5F6FA] border border-[#E6E9F0] rounded-xl p-4">
          <p className="text-[13px] mb-3" style={{ fontWeight: 600 }}>
            Demo accounts
          </p>
          <div className="space-y-2 text-[12px] text-[#6B7280]">
            <div className="flex justify-between">
              <span>Admin:</span>
              <span className="text-[#0A1D4D]">jjb@jjbgroupofcompanies.com</span>
            </div>
            <div className="flex justify-between">
              <span>Operations:</span>
              <span className="text-[#0A1D4D]">pablo@jjbgroupofcompanies.com</span>
            </div>
            <div className="flex justify-between">
              <span>Accounting:</span>
              <span className="text-[#0A1D4D]">gerlie@jjbgroupofcompanies.com</span>
            </div>
            <div className="flex justify-between">
              <span>HR:</span>
              <span className="text-[#0A1D4D]">shiela@jjbgroupofcompanies.com</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-center text-[#6B7280]">
          Use any password • Role assigned based on email
        </p>
      </Card>
    </div>
  );
}
