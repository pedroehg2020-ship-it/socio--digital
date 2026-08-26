import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { ChartLineUp } from "@phosphor-icons/react";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", companyName: "" });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.companyName);
      navigate("/onboarding");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Não foi possível criar a conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <ChartLineUp size={20} weight="bold" className="text-primary-foreground" />
          </div>
          <span className="font-heading font-extrabold text-xl tracking-tight">Sócio Digital</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-8">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Criar conta</h1>
          <p className="text-sm text-muted-foreground mt-1">Cadastre sua empresa e comece a usar seu Sócio Digital</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Seu nome</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="register-name-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Nome da empresa</Label>
              <Input id="companyName" required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} data-testid="register-company-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="register-email-input" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="register-password-input" />
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="register-submit-btn">
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline" data-testid="go-to-login-link">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
