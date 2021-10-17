import * as esbuild from 'esbuild-wasm'
import {useState, useEffect, useRef} from "react";
import ReactDOM from 'react-dom';

const App = () => {
    const ref = useRef<any>()

    const [input, setInput] = useState('')
    const [code, setCode] = useState('')

    // we are grabbing the startService method from esbuild
    const startService = async () => {
        ref.current = await esbuild.startService({
            worker: true,
            wasmURL: '/esbuild.wasm'
        })
    }

    useEffect(() => {
        // starting the esbuild service when the app loads for the first time
        startService()
    }, []);


    const onClick = async () => {
       if (!ref.current) {
           return;
       }
       // using the transform from our ref to take the string from input and transpile
       const result = await ref.current.transform(input, {
           loader: 'jsx',
           target: 'es2015'
       })

       setCode(result.code)
    }
    return (
        <div>
            <textarea value={input} onChange={(e) => setInput(e.target.value)}></textarea>
            <div>
                <button onClick={onClick}>Submit</button>
            </div>
            <pre>{code}</pre>
        </div>
    )
}

ReactDOM.render(
    <App />,
    document.querySelector("#root"))