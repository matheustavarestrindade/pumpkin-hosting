import type { ServerSettings, serverType } from '$lib/server/db/schema';

type ServerType = (typeof serverType.enumValues)[number];

export function defaultSettings(type: ServerType): ServerSettings {
	switch (type) {
		case 'survival':
			return {
				difficulty: 'normal',
				pvp: true,
				maxPlayers: 10,
				gamemode: 'survival',
				motd: 'A hosting-mc server',
				allowlistEnabled: true,
				allowlist: [],
				hardcore: false
			};
		case 'creative':
			return {
				difficulty: 'peaceful',
				pvp: false,
				maxPlayers: 10,
				gamemode: 'creative',
				motd: 'A hosting-mc server',
				allowlistEnabled: true,
				allowlist: [],
				hardcore: false
			};
		case 'hardcore':
			return {
				difficulty: 'hard',
				pvp: true,
				maxPlayers: 10,
				gamemode: 'survival',
				motd: 'A hosting-mc server',
				allowlistEnabled: true,
				allowlist: [],
				hardcore: true
			};
		case 'flat':
			return {
				difficulty: 'peaceful',
				pvp: false,
				maxPlayers: 10,
				gamemode: 'creative',
				motd: 'A hosting-mc server',
				allowlistEnabled: true,
				allowlist: [],
				hardcore: false
			};
	}
}
