import { pickRandom } from './random';

export class EmailGenerator {
	static generateFromUsername(username: string, emailDomains: string[], rng: () => number): string {
		const domain = pickRandom(emailDomains, rng);

		return `${username}@${domain}`;
	}
}
