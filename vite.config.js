import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
    ],
    build: {
        outDir: 'public', // Output directly to public
        rollupOptions: {
            output: {
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name === 'app.css') {
                        return 'css/app.css'; // Place app.css directly in public/css
                    }
                    return 'build/assets/[name]-[hash][extname]'; // Default for others
                },
                entryFileNames: 'build/assets/[name]-[hash].js',
            },
        },
    },
});
