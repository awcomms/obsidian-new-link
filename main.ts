import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	getLinkpath,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class NewLink extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		const { vault } = this.app;

		const new_link = async (editor: Editor, open?: boolean) => {
			let content = editor.getSelection();
			if (content) {
				editor.replaceSelection(`[[${content}]]`);
			} else {
				const line = editor.getCursor().line;
				content = editor.getLine(line);
				editor.setLine(line, `[[${content}]]`);
			}
			// this.app.fileManager.generateMarkdownLink(file, this.app.workspace.getActiveFile())
			const file =
				// vault.getFileByPath(content.trim()) ||
				await vault.create(`${content}.md`, "");
			if (open) {
				this.app.workspace.getLeaf(true).openFile(file);
			}
		};

		const move_line = async (editor: Editor, direction: boolean) => {
			const line = editor.getCursor().line;
			const other_line = direction ? line + 1 : line - 1;
			const content = editor.getLine(line);
			const other_content = editor.getLine(other_line)
			editor.setLine(other_line, content)
			editor.setLine(line, other_content)
		};

		const open_current_link = async (editor: Editor, open?: boolean) => {
			const line = editor.getCursor().line;
			const content = editor.getLine(line);
			const matches = /\[\[(.*?)\]\]/g.exec(content);
			if (!matches) return;
			const link_text = matches[1];
			const path = getLinkpath(content);
			let file = vault.getFileByPath(path);
			console.debug(path, file);
			if (!file) file = await vault.create(`${link_text}.md`, "");
			this.app.workspace.getLeaf(true).openFile(file);
		};

		this.addCommand({
			id: "move-line-up",
			name: "Move line up",
			editorCallback(editor) {
				move_line(editor, true);
			},
		});

		this.addCommand({
			id: "move-line-up",
			name: "Move line up",
			editorCallback(editor) {
				move_line(editor, false);
			},
		});

		this.addCommand({
			id: "create-link",
			name: "Create link",
			editorCallback(editor, ctx) {
				new_link(editor);
			},
		});

		this.addCommand({
			id: "open-current-link",
			name: "Open current link",
			async editorCallback(editor, ctx) {
				await open_current_link(editor);
			},
		});

		this.addCommand({
			id: "create-link-open",
			name: "Create link and open",
			editorCallback(editor) {
				new_link(editor, true);
			},
		});

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("This is a notice!");
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: NewLink;

	constructor(app: App, plugin: NewLink) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
