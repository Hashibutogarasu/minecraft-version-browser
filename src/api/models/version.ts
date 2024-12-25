import * as vscode from 'vscode';
import { getApi, FileDownloader } from "@microsoft/vscode-file-downloader-api";
import { fs } from '@vscode-utility/fs-browserify';
import * as nativefs from 'fs';
import * as admZip from 'adm-zip';

export type Package = {
  downloads: {
    client: {
      sha1: string;
      size: number;
      url: string;
    };
  }
};

export class PackageTreeItem extends vscode.TreeItem {
  package: Package;
  parent: Version;

  constructor(package_: Package, parent: Version) {
    super(package_.downloads.client.url, vscode.TreeItemCollapsibleState.None);
    this.package = package_;
    this.parent = parent;
  }

  async downloadClient(context: vscode.ExtensionContext, token: vscode.CancellationToken
    , onDownloadProgressChange?: (downloadedBytes: number, totalBytes: number | undefined) => void,
  ): Promise<vscode.Uri> {
    const fileDownloader: FileDownloader = await getApi();
    const file: vscode.Uri = await fileDownloader.downloadFile(
      vscode.Uri.parse(this.package.downloads.client.url),
      `${this.parent.id}.jar`,
      context,
      token,
      onDownloadProgressChange,
      {
        shouldUnzip: false
      }
    );

    const storagePath = context.globalStorageUri;
    const moveClientPath = storagePath.with({ path: storagePath.path + "/versions/" + this.parent.id });

    new admZip(file.fsPath).extractAllTo(moveClientPath.fsPath, true);

    return moveClientPath;
  }
}

export type VersionType = "release" | "snapshot" | "old_beta" | "old_alpha";

export const versionTypes = [
  "release",
  "snapshot",
  "old_beta",
  "old_alpha"
];

export class VersionTypeTree extends vscode.TreeItem {
  type: string;

  constructor(
    type: string,
  ) {
    super(type, vscode.TreeItemCollapsibleState.Collapsed);
    this.type = type;
    this.command = {
      command: "minecraft-version-browser.createCache",
      title: "Create a cache of postonmeta"
    };
  }
}

export class Version extends vscode.TreeItem {
  id: string;
  type: string;
  url: string;
  time: string;
  releaseTime: string;
  sha1: string;
  complianceLevel: number;

  constructor(
    id: string,
    type: string,
    url: string,
    time: string,
    releaseTime: string,
    sha1: string,
    complianceLevel: number
  ) {
    super(id, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `${id} - ${type}`;
    this.id = id;
    this.type = type;
    this.url = url;
    this.time = time;
    this.releaseTime = releaseTime;
    this.sha1 = sha1;
    this.complianceLevel = complianceLevel;

    this.command = {
      command: 'minecraft-version-browser.openPackage',
      title: 'Open Package',
      arguments: [this]
    };
  }

  async getPackage(): Promise<PackageTreeItem> {
    const response = await (await fetch(this.url)).json() as Package;
    return new PackageTreeItem(response, this);
  }
}

export class Latest extends vscode.TreeItem {
  release: string;
  snapshot: string;

  constructor(release: string, snapshot: string) {
    super(release, vscode.TreeItemCollapsibleState.None);
    this.release = release;
    this.snapshot = snapshot;
  }
}

export class MinecraftVersions extends vscode.TreeItem {
  latest: Latest;
  versions: Version[];

  constructor(latest: Latest, versions: Version[]) {
    super("Minecraft Versions", vscode.TreeItemCollapsibleState.None);
    this.latest = latest;
    this.versions = versions;
  }

  static fromJSON(json: string): MinecraftVersions {
    const obj = JSON.parse(json);
    const latest = new Latest(obj.latest.release, obj.latest.snapshot);
    const versions = obj.versions.map((version: any) => {
      return new Version(
        version.id,
        version.type,
        version.url,
        version.time,
        version.releaseTime,
        version.sha1,
        version.complianceLevel
      );
    });
    return new MinecraftVersions(latest, versions);
  }
}














