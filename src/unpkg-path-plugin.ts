import * as esbuild from 'esbuild-wasm';
import axios from "axios";

/* This Plugin is hijacking the default way the esbuild bundles files */

export const unpkgPathPlugin = () => {
    return {
        name: 'unpkg-path-plugin',
        setup(build: esbuild.PluginBuild) {
            build.onResolve({ filter: /.*/}, async (args: any) => {
                console.log('onResolve', args)
                if (args.path === 'index.js') {
                    return { path: args.path, namespace: 'a'}
                }
                // in the case when we get nested files inside the main file from the args.path
                if (args.path.includes('./') || args.path.includes('../')) {
                    return {
                        namespace: 'a',
                        // construct the path with the directory
                        path: new URL(args.path, 'https://unpkg.com' + args.resolveDir + '/').href
                    }
                }
                // the case for just the a plain index.js file
                return {
                    namespace: 'a',
                    path: `https://unpkg.com/${args.path}`
                }

            })

            // @ts-ignore
            build.onLoad({ filter: /.*/}, async (args: any) => {
                console.log('onLoad', args)

                if (args.path === 'index.js') {
                    return {
                        loader: 'jsx',
                        contents: `
                            const message = require('nested-test-pkg');
                            console.log(message);
                        `
                    }
                }

                const { data, request } = await axios.get(args.path);

                return {
                    loader: 'jsx',
                    contents: data,
                    resolveDir: new URL('./', request.responseURL).pathname
                }
            })
        }
    }
}