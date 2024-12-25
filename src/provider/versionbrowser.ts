import * as vscode from 'vscode';
import { MinecraftVersions, Version, VersionType, versionTypes, VersionTypeTree } from '../api/models/version';
import { IRefreshable } from '../interfaces/irefreshable';
import { mapByVersionType } from '../commands/createcache';
import { fs } from '@vscode-utility/fs-browserify';

export class VersioTypeBrowserProvider implements vscode.TreeDataProvider<VersionTypeTree>, IRefreshable {
  private _onDidChangeTreeData: vscode.EventEmitter<VersionTypeTree | undefined | null | void> = new vscode.EventEmitter<VersionTypeTree | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<VersionTypeTree | undefined | null | void> = this._onDidChangeTreeData.event;
  private versions: Record<VersionType, Version[]> | undefined;

  constructor(
    private context: vscode.ExtensionContext,
  ) {
    this.initalize();
  }

  async initalize() {
    const file = vscode.Uri.joinPath(this.context.globalStorageUri, "version_manifest_v2.json");
    if (await fs.existAsync(file)) {
      const data = MinecraftVersions.fromJSON(((await vscode.workspace.fs.readFile(file)).toString()));
      const mapped = mapByVersionType(data);
      this.versions = mapped;
    }
    else {
      vscode.commands.executeCommand("minecraft-version-browser.createCache");
    }
  }

  getTreeItem(element: VersionTypeTree): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: VersionTypeTree | undefined): vscode.ProviderResult<VersionTypeTree[] | Version[]> {
    if (!element) {
      return versionTypes.map(type => new VersionTypeTree(type));
    }
    return this.versions ? Object.entries(this.versions).find(([key, value]) => key === element.label)?.[1] : [];
  }

  getParent?(element: VersionTypeTree): vscode.ProviderResult<Version> {
    return null;
  }

  resolveTreeItem?(item: vscode.TreeItem, element: VersionTypeTree, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
    return item;
  }

  refresh(): void {
    this.initalize();
    this._onDidChangeTreeData.fire();
  }
}