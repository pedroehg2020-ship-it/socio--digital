import { ChatCircleText, SquaresFour, Siren, UsersThree, Package, Wallet, Gear } from "@phosphor-icons/react";

export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: SquaresFour },
  { to: "/chat", label: "Chat", icon: ChatCircleText },
  { to: "/radar", label: "Radar", icon: Siren },
  { to: "/clientes", label: "Clientes", icon: UsersThree },
  { to: "/estoque", label: "Estoque", icon: Package },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/configuracoes", label: "Configurações", icon: Gear },
];
