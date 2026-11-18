import React from "react";
import { getPlugins } from "@/actions/pluginActions";
import { PluginManager } from "@/components/dashboard/PluginManager";

export default async function PluginsPage() {
  const plugins = await getPlugins();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Plugins &amp; Integrations
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage, activate, and configure modular capabilities for SEO, analytics, media management, and external workflows.
        </p>
      </div>

      <PluginManager initialPlugins={plugins} />
    </div>
  );
}
