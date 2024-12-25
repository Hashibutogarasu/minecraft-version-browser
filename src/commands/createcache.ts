import { PistonMetaAPI } from "../api/minecraft";
import { MinecraftVersions, Version, VersionType } from "../api/models/version";
import * as vscode from "vscode";

export async function createCacheCommand(context: vscode.ExtensionContext): Promise<MinecraftVersions | undefined> {
  const pistonMetaAPI = new PistonMetaAPI();

  const data = await pistonMetaAPI.getVersionManifest(context);
  return data;
}

export function mapByVersionType(mc: MinecraftVersions): Record<VersionType, Version[]> {
  const mapped = mc.versions.reduce((acc, version) => {
    const type = version.type as VersionType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(version);
    return acc;
  }, {} as Record<VersionType, typeof mc.versions>);

  return mapped;
}