import * as vscode from 'vscode';
import { FileTreeItem } from '../provider/filebrowser';

export async function openFileCommand(file: FileTreeItem) {
  const uri = file.uri.fsPath;
  const stat = await vscode.workspace.fs.stat(vscode.Uri.file(uri));

  if (stat.type === vscode.FileType.File) {
    await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(uri));
  }
}

export async function openFolderCommand(file: FileTreeItem) {
  const uri = file.uri.fsPath;
  const stat = await vscode.workspace.fs.stat(vscode.Uri.file(uri));

  if (stat.type === vscode.FileType.Directory) {
    const folderPathParsed = uri.split(`\\`).join(`/`);
    // Updated Uri.parse to Uri.file
    const folderUri = vscode.Uri.file(folderPathParsed);
    vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
  }
}