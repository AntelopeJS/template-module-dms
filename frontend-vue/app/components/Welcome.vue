<script setup lang="ts">
interface Props {
	title: string
	message: string
}

defineProps<Props>()
</script>

<template>
	<section class="border-default bg-default rounded-xl border p-6 sm:p-8">
		<p class="text-primary mb-3 text-sm font-medium">Backend → Vue</p>
		<h2 class="text-highlighted text-2xl font-semibold tracking-tight">
			{{ title }}
		</h2>
		<p class="text-muted mt-2 max-w-2xl">{{ message }}</p>
		<dl class="border-default mt-8 grid gap-6 border-t pt-6 md:grid-cols-2">
			<div>
				<dt class="text-highlighted font-medium">Build your page</dt>
				<dd class="text-muted mt-2 text-sm leading-6">
					Edit
					<code class="text-toned break-all">src/pages/welcome.ts</code>
					to add DMS components and pass data to this card.
				</dd>
			</div>
			<div>
				<dt class="text-highlighted font-medium">Make it your own</dt>
				<dd class="text-muted mt-2 text-sm leading-6">
					Edit
					<code class="text-toned break-all">
						frontend-vue/app/components/Welcome.vue
					</code>
					to change the frontend. Both servers reload while you work.
				</dd>
			</div>
		</dl>
	</section>
</template>
