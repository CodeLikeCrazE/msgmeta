import {
	DOMParser,
	Element,
} from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';

function getDefaultMetadata(): MSGMetadata {
	return {
		isEmpty: true,
	};
}

function escapeMarkdownString(str: string) {
	let escaped = "";
	for (const char of Array.from(str)) {
		if ("\\`*_{}[]<>()#+-.!|".includes(char)) {
			escaped += "\\";
		}
		escaped += char;
	}
	return escaped;
}

function escapeHTMLString(str:string) {
	let output = "";
	for (const char of Array.from(str)) {
		if (char == "\"") {
			output += `&#${char.charCodeAt(0)};`;			
		} else {
			output += char;
		}
	}
	return output;
}

export function createMeta(metadata:MSGMetadata) {
	return `![msgmeta::${escapeMarkdownString(JSON.stringify(metadata))}](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==)`;
}

export function getMetadataFromMessageString(str: string) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(str, 'text/html');
	if (!doc) {
		return getDefaultMetadata();
	}
	const root = doc.body;
	return getMetadataFromDOMNode(root) || getDefaultMetadata();
}

export function getMetadataFromDOMNode(element: Element): MSGMetadata | null {
	if (element.tagName.toLowerCase() == 'img') {
		const alt = element.attributes.getNamedItem('alt');
		const magic = 'msgmeta::';
		if (alt && alt.value.startsWith(magic)) {
			try {
				return JSON.parse(alt.value.slice(magic.length));
			} catch {
				return null;
			}
		}
	}
	for (const subnode of element.children) {
		return getMetadataFromDOMNode(subnode);
	}
	return null;
}

export type MSGMetadata = {
	// defaults to true if there is no metadata
	isEmpty?: boolean;

	// if true, then the sender is a bot
	bot?: boolean;

	// what client the message was sent from
	client?: MSGClient;

	// description
	description?: MSGMessageDescription;
};

export type MSGMessageDescription =
	| {
			type: MSGMessageDescriptionType.Help;
			commands: MSGCommand[];
	  }
	| {
			type: MSGMessageDescriptionType.SuccessfulBet;
			betWinnerId: string;
			pointsWon: number;
	  }
	| {
			type: MSGMessageDescriptionType.FailedBet;
			betLoserId: string;
			pointsLost: number;
	  }
	| {
			type: MSGMessageDescriptionType.CompletedLottery;
			lotteryWinnerId: string;
			pointsWon: number;
	  };

export type MSGCommand = {
	name: string;
	prefix: string;
	arguments: MSGCommandArgument[];
	description: string;
};

export type MSGCommandArgument = {
	name: string;
	type: MSGCommandArgumentType;
};

export enum MSGCommandArgumentType {
	UserID = 'user.id',
	UserHandle = 'user.handle.not-reccomended',
	Number = 'number',
	Token = 'token',
	String = 'string',
	UnquotedString = 'string.lastsToEnd.unquoted',
}

export enum MSGMessageDescriptionType {
	Help = 'help',
	SuccessfulBet = 'bet.success',
	FailedBet = 'bet.failed',
	CompletedLottery = 'lottery.completed',
}

export enum MSGClient {
	w96Web = 'web',
	w96WebBeta = 'web.new',
	w96API = 'api.official',
	customWebsockets = 'api.unofficial.ws-custom',
}
