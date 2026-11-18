import React from "react";
import { getAllPlugins } from "@/actions/pluginActions";
import { PluginManager } from "@/components/dashboard/PluginManager";

export default async function PluginsPage() {
  const plugins = await getAllPlugins();

  return (
    <div className="space-y-6">
      <PluginManager initialPlugins={plugins} />
    </div>
  );
}
