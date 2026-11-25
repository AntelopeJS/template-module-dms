import type { DmsFrontendModule } from '#dms/frontend-module'
import WelcomeCard from './app/components/WelcomeCard.vue'

export default {
	componentPrefix: 'DmsExample',
	setup(sdk) {
		sdk.registerComponent('Welcome', WelcomeCard)
	},
} satisfies DmsFrontendModule
