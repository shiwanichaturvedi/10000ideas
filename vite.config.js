"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const url_1 = require("url");
const path_1 = __importDefault(require("path"));
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    root: path_1.default.resolve(__dirname, '.'),
    resolve: {
        alias: {
            '@': path_1.default.resolve(__dirname, './src'),
        },
    },
    build: {
        outDir: path_1.default.resolve(__dirname, 'dist'), // Output inside client/
        emptyOutDir: true
    },
    server: {
        proxy: {
            '/api': 'http://localhost:5000',
        },
    }
});
