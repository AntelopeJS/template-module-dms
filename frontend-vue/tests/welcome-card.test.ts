import { createApp } from 'vue'
import { expect, it } from 'vitest'
import WelcomeCard from '../app/components/WelcomeCard.vue'

it('renders the title and message supplied by the backend', () => {
	const container = document.createElement('div')
	const app = createApp(WelcomeCard, {
		title: 'Inventory dashboard',
		message: 'Manage warehouse availability.',
	})
	try {
		app.mount(container)
		expect(container.querySelector('h2')?.textContent).toBe(
			'Inventory dashboard',
		)
		expect(container.textContent).toContain('Manage warehouse availability.')
	} finally {
		app.unmount()
	}
})
