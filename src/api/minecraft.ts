import { MinecraftVersions } from "./models/version";
import * as vscode from 'vscode';
import { fs } from '@vscode-utility/fs-browserify';

export class PistonMetaAPI {
  baseUrl: string;

  constructor() {
    this.baseUrl = "https://piston-meta.mojang.com/mc";
  }

  async getVersionManifest(context: vscode.ExtensionContext): Promise<MinecraftVersions | undefined> {
    const file = vscode.Uri.joinPath(context.globalStorageUri, "version_manifest_v2.json");
    if (await fs.existAsync(file)) {
      const response = await vscode.workspace.fs.readFile(file);
      return MinecraftVersions.fromJSON(response.toString());
    }

    try {
      const response = await (await fetch(`${this.baseUrl}/game/version_manifest_v2.json`)).text();

      const uri = context.globalStorageUri;
      const cachePath = uri.with({ path: uri.path + "/version_manifest_v2.json" });
      await vscode.workspace.fs.writeFile(cachePath, Buffer.from(response));

      return MinecraftVersions.fromJSON(response);
    }
    catch (e) {

    }
  }
}