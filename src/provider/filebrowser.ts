import * as vscode from 'vscode';
import { fs } from '@vscode-utility/fs-browserify';
import { IRefreshable } from '../interfaces/irefreshable';

const extensions = ["class"];

async function getFiles(uri: vscode.Uri): Promise<FileTreeItem[]> {
  const stat = await fs.statAsync(uri.fsPath);

  if (stat.type === vscode.FileType.Directory) {
    try {
      const children = await fs.readDirectoryAsync(uri.fsPath);
      const fileItems = await Promise.all(children.map(async ([name, type]) => {
        if (extensions.every((ext) => name.endsWith(ext))) {
          return [];
        }

        if (type === vscode.FileType.Directory) {
          return new FileTreeItem(name, vscode.Uri.file(`${uri.fsPath}/${name}`), type, vscode.TreeItemCollapsibleState.Collapsed);
        }

        return new FileTreeItem(name, vscode.Uri.file(`${uri.fsPath}/${name}`), type, vscode.TreeItemCollapsibleState.None);
      }));

      return fileItems.flat();
    }
    catch (e) {
      return [];
    }
  }
  else {
    return [];
  }
}

export class FileBrowserProvider implements vscode.TreeDataProvider<FileTreeItem>, IRefreshable {
  private _onDidChangeTreeData: vscode.EventEmitter<FileTreeItem | undefined | null | void> = new vscode.EventEmitter<FileTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private path: vscode.Uri) { }

  getTreeItem(element: FileTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  async getChildren(element?: FileTreeItem | undefined): Promise<FileTreeItem[]> {
    return element ? element.children : await getFiles(this.path);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

export class FileTreeItem extends vscode.TreeItem {
  children: FileTreeItem[] = [];

  constructor(
    public readonly name: string,
    public readonly uri: vscode.Uri,
    public readonly type: vscode.FileType = vscode.FileType.Directory,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(name, collapsibleState);
    this.command = {
      command: 'minecraft-version-browser.openFile',
      title: 'Open Directory',
      arguments: [this],
    };
    getFiles(uri).then((children) => {
      this.children = children;
    });
  }

  iconPath = this.type === vscode.FileType.Directory ? new vscode.ThemeIcon('folder') :
    this.uri.fsPath.endsWith(".png") ?
      new vscode.ThemeIcon('file-media') :
      this.uri.fsPath.endsWith(".json") ?
        new vscode.ThemeIcon('file-code') :
        this.uri.fsPath.endsWith(".txt") ?
          new vscode.ThemeIcon('file-text') :
          this.uri.fsPath.endsWith(".class") ?
            new vscode.ThemeIcon('file-binary') :
            new vscode.ThemeIcon('file');
}