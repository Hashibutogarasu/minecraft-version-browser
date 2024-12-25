import * as vscode from 'vscode';
import { Version } from './api/models/version';
import { VersioTypeBrowserProvider } from './provider/versionbrowser';
import { FileBrowserProvider, FileTreeItem } from './provider/filebrowser';
import { openPackage } from './commands/openpackage';
import { openFileCommand } from './commands/openfile';
import { refreshAllCommand } from './commands/refresh/refresh_all';
import { deleteFolderCommand } from './commands/deletefolder';
import { createCacheCommand } from './commands/createcache';
import { fs } from '@vscode-utility/fs-browserify';

export async function activate(context: vscode.ExtensionContext) {
	const storagePath = context.globalStorageUri;
	const downloadPath = storagePath.with({ path: storagePath.path + "/versions/" });
	const versionProvider = new VersioTypeBrowserProvider(context);
	const fileProvider = new FileBrowserProvider(downloadPath);

	if (!(await fs.existAsync(downloadPath))) {
		await vscode.workspace.fs.createDirectory(downloadPath);
	}

	const versionBrowser = vscode.window.createTreeView(
		"minecraft-version-browser.version_browser",
		{
			treeDataProvider: versionProvider
		}
	);

	context.subscriptions.push(versionBrowser);

	const assetBrowser = vscode.window.createTreeView(
		"minecraft-version-browser.asset_browser",
		{
			treeDataProvider: fileProvider
		}
	);

	context.subscriptions.push(assetBrowser);

	context.subscriptions.push(vscode.commands.registerCommand("minecraft-version-browser.openPackage", async (version: Version) => {
		openPackage({ version, downloadPath, context, refreshable: fileProvider });
	}));

	const openFile = vscode.commands.registerCommand("minecraft-version-browser.openFile", openFileCommand);

	context.subscriptions.push(openFile);

	const refreshCommand = vscode.commands.registerCommand("minecraft-version-browser.refresh", async () => {
		versionBrowser.message = "Refreshing...";
		assetBrowser.message = "Refreshing...";

		refreshAllCommand(versionProvider, fileProvider);

		versionBrowser.message = "";
		assetBrowser.message = "";
	});

	context.subscriptions.push(refreshCommand);

	const refleshVersionBrowser = vscode.commands.registerCommand("minecraft-version-browser.version_browser.refresh", async () => {
		versionProvider.refresh();
	});
	context.subscriptions.push(refleshVersionBrowser);

	const refleshAssetBrowser = vscode.commands.registerCommand("minecraft-version-browser.asset_browser.refresh", async () => {
		fileProvider.refresh();
	});
	context.subscriptions.push(refleshAssetBrowser);

	const deleteFolder = vscode.commands.registerCommand("minecraft-version-browser.deleteFolder", async (file: FileTreeItem) => {
		await deleteFolderCommand(file.uri.fsPath, fileProvider);
	});
	context.subscriptions.push(deleteFolder);

	const createCache = vscode.commands.registerCommand("minecraft-version-browser.createCache", async () => {
		await createCacheCommand(context);
		versionProvider.refresh();
	});

	context.subscriptions.push(createCache);
}

export function deactivate() { }
