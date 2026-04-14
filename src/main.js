import { createSSRApp } from "vue";
import App from "./App.vue";

// 全局后端地址：优先使用 Vite 注入的环境变量 VITE_API_BASE，便于本地开发时指向 http://localhost:3000
// Vite will replace VITE_API_BASE at build time via define in vite.config.js.
// If not provided, fallback to the production API URL.
const _VITE_API_BASE = typeof VITE_API_BASE !== 'undefined' && VITE_API_BASE ? VITE_API_BASE : '';
export const BASE_URL = _VITE_API_BASE || 'https://api.linxiksp.cn';

export function createApp() {
	const app = createSSRApp(App);
	// 在 Vue 应用实例上注入全局属性，组件内可使用 `this.$BASE_URL` 或通过 import { BASE_URL } 引用
	app.config.globalProperties.$BASE_URL = BASE_URL;
	return {
		app,
	};
}
