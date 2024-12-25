import * as vscode from 'vscode';
import { Version } from '../api/models/version';
import { IRefreshable } from '../interfaces/irefreshable';
import { getApi } from "@microsoft/vscode-file-downloader-api";

export async function openPackage({ version, downloadPath, context, refreshable }: { version: Version, downloadPath: vscode.Uri, context: vscode.ExtensionContext, refreshable: IRefreshable }) {
  try {
    const pkg = await version.getPackage();
    const clientUri = downloadPath.with({ path: downloadPath.path + "/" + version.id });
    const api = await getApi();

    try {
      if (await vscode.workspace.fs.stat(clientUri)) {
        vscode.window.showInformationMessage("Client already downloaded");
        return;
      }
      else {
        vscode.window.showInformationMessage("Client not downloaded");
      }
    } catch (error) {
      await vscode.workspace.fs.createDirectory(downloadPath);
    }

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Downloading ${version.id}`,
      cancellable: true,
    }, async (progress, token) => {
      token.onCancellationRequested(async () => {
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: "Canceling...",
        }, async (progress, token) => {
          await api.deleteAllItems(context);
          progress.report({ message: "Download cancelled" });
        });
      });

      try {
        await pkg.downloadClient(context, token, (downloadedBytes, totalBytes) => {
          const progressNum = downloadedBytes / (totalBytes ?? 1);
          progress.report({ message: `${downloadedBytes}/${totalBytes}` });
        });
      }
      catch (error) {
      }

      progress.report({ message: "Deleting temporary files" });

      try {
        await api.deleteAllItems(context);
      }
      catch (error) { }

      if (!token.isCancellationRequested) {
        progress.report({ message: "Refreshing..." });
        await vscode.commands.executeCommand("minecraft-version-browser.refresh");

        vscode.window.showInformationMessage("Download complete");
        refreshable.refresh();
        progress.report({ message: "Download complete" });
      }
    });
  }
  catch (e) {

  }
}