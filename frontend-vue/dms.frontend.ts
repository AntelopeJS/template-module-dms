import type { DmsFrontendModule } from '#dms/frontend-module'
import WelcomeCard from './app/components/WelcomeCard.vue'

export default {
	componentPrefix: 'Example',
	setup(sdk) {
		sdk.registerComponent('Welcome', WelcomeCard)
	},
} satisfies DmsFrontendModule
