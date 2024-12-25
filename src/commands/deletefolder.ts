import * as vscode from 'vscode';
import { fs } from '@vscode-utility/fs-browserify';
import { IRefreshable } from '../interfaces/irefreshable';

export async function deleteFolderCommand(folderPath: string, refreshable: IRefreshable) {
  const result = await vscode.window.showInformationMessage(`Are you sure you want to delete ${folderPath}?`, "Yes", "No");
  if (result === "Yes") {
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Deleting ${folderPath}`,
      cancellable: true,
    }, async (progress, token) => {
      try {
        await fs.deleteAsync(folderPath, { recursive: true });
        progress.report({ message: "Folder deleted" });
        refreshable.refresh();
        vscode.window.showInformationMessage("Folder deleted");
      } catch (error) {
        vscode.window.showErrorMessage("Failed to delete folder");
      }
    });
  }
}