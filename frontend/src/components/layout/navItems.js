import { ChatCircleText, SquaresFour, Gear, MagnifyingGlass, ArrowsClockwise, Lightning, Database, ShoppingCartSimple, UsersThree, Package, Wallet } from "@phosphor-icons/react";

export const NAV_ITEMS = [
  { to: "/vendas", label: "Vendas", icon: ShoppingCartSimple },
  { to: "/dashboard", label: "Visão geral", icon: SquaresFour },
  { to: "/clientes", label: "Clientes", icon: UsersThree },
  { to: "/estoque", label: "Estoque", icon: Package },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/chat", label: "Conversar", icon: ChatCircleText },
  { to: "/investigar", label: "Investigar", icon: MagnifyingGlass },
  { to: "/simular", label: "Simular", icon: ArrowsClockwise },
  { to: "/acoes", label: "Ações", icon: Lightning },
  { to: "/dados", label: "Dados", icon: Database },
  { to: "/configuracoes", label: "Configurações", icon: Gear },
];
