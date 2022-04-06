import {
	addIcon,
	App,
	ButtonComponent,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	requestUrl,
	TextComponent,
} from "obsidian";
// @ts-ignore
import smortLogo from "./SmortLogo.svg";
// @ts-ignore
import { version as uuidVersion } from "uuid";
// @ts-ignore
import { validate as uuidValidate } from "uuid";

function uuidValidateV4(uuid: string) {
	return uuidValidate(uuid) && uuidVersion(uuid) === 4;
}
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
		let urlObj;
		try {
			urlObj = new URL(url);
		} catch (e) {
			new Notice("[Smort] Error: Invalid URL provided", 5000);
			return;
		}
		const articleId = urlObj.pathname.slice(1);
		if (!uuidValidateV4(articleId)) {
			new Notice("[Smort] Error: Invalid article ID", 5000);
			return;
		}
		const apiURL = `https://www.smort.io/api/article?uuid=${articleId}&markup=markdown`;
		requestUrl({
			url: apiURL,
			method: "GET",
			headers: { Accept: "application/json" },
		})
			.then((response) => {
				if (response.status !== 200) {
					new Notice(`[Smort] Error: ${response.status}`, 5000);
					return;
				}
				this.addMarkdown(response.text);
			})
			.catch((error) => new Notice("[Smort] Error: " + error, 5000));
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
