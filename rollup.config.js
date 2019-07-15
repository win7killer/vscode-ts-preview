import tsPlugin from 'rollup-plugin-typescript';
import resolve from 'rollup-plugin-node-resolve';

export default {
    input: './src/extension.ts',
    output: {
        file: 'out/bundle.js',
        format: 'cjs'
    },
    plugins: [
        tsPlugin(),
        resolve({
            // 将自定义选项传递给解析插件
            customResolveOptions: {
                moduleDirectory: 'node_modules'
            }
        })
    ]
};
