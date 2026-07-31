import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'AccessCrafter',
    description: 'Author and transfer task-aware cognitive support strategies across web interfaces.',
    permissions: ['storage', 'activeTab', 'scripting', 'sidePanel'],
    host_permissions: ['http://localhost/*', 'file:///*'],
  },
});
