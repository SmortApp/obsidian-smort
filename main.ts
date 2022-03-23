import {
	addIcon,
	App,
	ButtonComponent,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	TextComponent,
} from "obsidian";
// @ts-ignore
import smortLogo from "./SmortLogo.svg";
// @ts-ignore
import electron from "electron";

export default class Smort extends Plugin {
	async onload() {
		this.addCommand({
			id: "smort-modal-command",
			name: "Get Smort.io article as Markdown",
			callback: () => {
				new URLModal(this.app, this).open();
			},
		});
	}

	async processURL(url: string) {
		const activeView = this.getActiveView();
		if (!activeView) {
			console.error("[Smort] No active view to insert into.");
			return;
		}
		const urlObj = new URL(url);
		const articleId = urlObj.pathname.slice(1);
		const apiURL = `https://smort.io/api/article?uuid=${articleId}&markup=markdown`;
		var body = "";
		const request = electron.remote.net.request({
			url: apiURL,
		});
		request.setHeader("Accept", "application/json");
		request.on("response", (response: any) => {
			response.on("end", () => {
				if (body && body.length > 0) {
					this.addMarkdown(body);
				} else {
					console.error(
						`[Smort] Unable to fetch Markdown from ${apiURL}`
					);
				}
			});
			response.on("error", () => {
				console.error(`[Smort] Error fetching Markdown ${apiURL}`);
			});
			response.on("data", (chunk: any) => {
				body += chunk;
			});
		});
		request.end();
	}

	async addMarkdown(md: string) {
		const activeView = this.getActiveView();
		if (!activeView) {
			console.error("[Smort] No active view to insert into.");
			return;
		}

		activeView.editor.replaceSelection(md);
	}

	getActiveView(): MarkdownView {
		return this.app.workspace.getActiveViewOfType(MarkdownView);
	}
}

class URLModal extends Modal {
	plugin: Smort;

	constructor(app: App, plugin: Smort) {
		super(app);
		this.plugin = plugin;
		this.modalEl.id = "smort-modal";
	}

	onOpen() {
		const { contentEl } = this;
		addIcon("smort-logo", smortLogo);
		contentEl.createEl("h1", {
			text: "Smort.io",
			cls: "smort-title",
		});
		const urlField = new TextComponent(contentEl).setPlaceholder(
			"https://smort.io/[...]"
		);
		urlField.inputEl.id = "smort-input";

		const getSmort = () => {
			const url = urlField.getValue();
			this.plugin.processURL(url);
			this.close();
		};

		const smortButton = new ButtonComponent(contentEl)
			.setButtonText("Get Markdown")
			.onClick(getSmort);
		smortButton.buttonEl.id = "smort-button";
		urlField.inputEl.focus();
		urlField.inputEl.addEventListener("keypress", function (keypressed) {
			if (keypressed.key === "Enter") {
				getSmort();
			}
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
