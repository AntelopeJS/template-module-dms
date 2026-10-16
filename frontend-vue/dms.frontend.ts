import type { DmsFrontendModule } from '#dms/frontend-module'
import Welcome from './app/components/Welcome.vue'

export default {
	componentPrefix: 'Example',
	setup(sdk) {
		sdk.registerComponent('Welcome', Welcome)
	},
} satisfies DmsFrontendModule
