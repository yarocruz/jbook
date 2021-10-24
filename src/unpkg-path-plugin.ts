import * as esbuild from 'esbuild-wasm';
import axios from "axios";
import localForage from "localforage";

const fileCache = localForage.createInstance({
    name: 'filecache'
});

// (async () => {
//    await fileCache.setItem('color', 'red')
//
//    const color = await fileCache.getItem('color')
//
//     console.log(color)
// })()

/* This Plugin is hijacking the default way esbuild bundles files */

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
                // the case for just a plain index.js file
                return {
                    namespace: 'a',
                    path: `https://unpkg.com/${args.path}`
                }

            })

            build.onLoad({ filter: /.*/}, async (args: any) => {
                console.log('onLoad', args)

                if (args.path === 'index.js') {
                    return {
                        loader: 'jsx',
                        contents: `
                            import React, { useState } from 'react';
                            import ReactDOM from 'react-dom';
                            console.log(react, reactDOM);
                        `
                    }
                }

                // Checking to see if we already fetched a file
                // return immediately if true
                const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path)

                if (cachedResult) {
                    return cachedResult
                }

                const { data, request } = await axios.get<string | Uint8Array | undefined>(args.path);

                const result: esbuild.OnLoadResult = {
                    loader: 'jsx',
                    contents: data,
                    resolveDir: new URL('./', request.responseURL).pathname
                };
                // store response in cache
                await fileCache.setItem(args.path, result)

                return result
            })
        }
    }
}