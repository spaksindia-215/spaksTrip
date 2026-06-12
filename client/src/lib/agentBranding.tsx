"use client";

import { createContext, useContext } from "react";

export interface AgentBranding {
  agentId:      string | null;
  slug:         string | null;
  companyName:  string | null;
  primaryColor: string | null;
  logo:         string | null;
}

const DEFAULT_BRANDING: AgentBranding = {
  agentId:      null,
  slug:         null,
  companyName:  null,
  primaryColor: null,
  logo:         null,
};

const AgentBrandingContext = createContext<AgentBranding>(DEFAULT_BRANDING);

export function AgentBrandingProvider({
  value,
  children,
}: {
  value: AgentBranding;
  children: React.ReactNode;
}) {
  return (
    <AgentBrandingContext.Provider value={value}>
      {children}
    </AgentBrandingContext.Provider>
  );
}

/** Returns agent branding for the current subdomain, or all-null on apex. */
export function useAgentBranding(): AgentBranding {
  return useContext(AgentBrandingContext);
}
