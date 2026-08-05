import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { UserPlus, Trash } from "@phosphor-icons/react";

const ROLE_LABEL = { owner: "Proprietário", manager: "Gestor", member: "Colaborador" };

export default function ConfiguracoesPage() {
  const { user, company } = useAuth();
  const [team, setTeam] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" });
  const [saving, setSaving] = useState(false);

  const loadTeam = async () => {
    const res = await api.get("/company/team");
    setTeam(res.data);
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const canManage = user?.role === "owner" || user?.role === "manager";

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/company/team", form);
      toast.success("Membro adicionado com sucesso");
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "member" });
      loadTeam();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao adicionar membro");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await api.delete(`/company/team/${id}`);
      toast.success("Membro removido");
      loadTeam();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao remover membro");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl" data-testid="configuracoes-page">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-muted-foreground">Nome</p>
          <p className="font-medium" data-testid="config-company-name">{company?.name}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Equipe</CardTitle>
          {canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="add-team-member-btn">
                  <UserPlus size={16} /> Adicionar membro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar membro à equipe</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Nome</Label>
                    <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="team-name-input" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>E-mail</Label>
                    <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="team-email-input" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Senha temporária</Label>
                    <Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="team-password-input" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Papel</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                      <SelectTrigger data-testid="team-role-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Gestor</SelectItem>
                        <SelectItem value="member">Colaborador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={saving} data-testid="team-save-btn">
                      {saving ? "Salvando..." : "Adicionar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {team.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0" data-testid="team-member-row">
              <div>
                <p className="text-sm font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{ROLE_LABEL[m.role]}</Badge>
                {canManage && m.role !== "owner" && (
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(m.id)} data-testid="team-remove-btn">
                    <Trash size={16} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
