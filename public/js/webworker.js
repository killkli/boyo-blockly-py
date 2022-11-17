// webworker.js

// Setup your project to serve `py-worker.js`. You should also serve
// `pyodide.js`, and all its associated `.asm.js`, `.data`, `.json`,
// and `.wasm` files as well:
importScripts("../pyodide/pyodide.js");
importScripts("./jsdom.js");
const vDom = new jsdom.JSDOM();
self.document = vDom.window.document;
self.HTMLElement = vDom.window.HTMLElement;
self.customElements = vDom.window.customElements;
self.DOMParser = vDom.window.DOMParser;
self.console = vDom.window.console;


const resultDiv = self.document.createElement("div");
self.document.body.appendChild(resultDiv);
resultDiv.setAttribute("id", "result");

const IO = {
    inputBuffer: [],
    stdin: ()=>"input輸入，請用虛擬機器來執行喔～\n",
};

async function loadPyodideAndPackages() {
    self.pyodide = await loadPyodide({
        stdin: IO.stdin,
    });
    await pyodide.runPythonAsync(await (await fetch("../pyscript/pyodideworker.py")).text());
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");
    await micropip.install('/turtle/custom_turtle_for_Pyodide-1.0-py3-none-any.whl');
}

let pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
    const { type, data, id } = event.data;
    // make sure loading is done
    await pyodideReadyPromise;

    switch (type) {
        case "loadPath":
            await loadFromFile(data);
            self.postMessage({ type, data: "done", id });
            return;
        case "loadPackage":
            await self.pyodide.loadPackage(data);
            self.postMessage({ type, data: "done", id });
            return;
        case "executePython":
            // Don't bother yet with this line, suppose our API is built in such a way:
            const { python, context } = event.data;
            // The worker copies the context in its own "memory" (an object mapping name to values)
            for (const key of Object.keys(context)) {
                self[key] = context[key];
            }
            // Now is the easy part, the one that is similar to working in the main thread:
            try {
                await self.pyodide.loadPackagesFromImports(python);
                const returnData = await self.pyodide.runPythonAsync(python);
                const results = resultDiv.innerHTML + (returnData !== undefined ? returnData : "");
                resultDiv.innerHTML = "";
                self.postMessage({ type, results, id });
            } catch (error) {
                self.postMessage({ type, error: error.message, id });
            }
    }
};

async function loadFromFile(path) {
    const filename = getLastPath(path);
    await self.pyodide.runPythonAsync(`
from pyodide.http import pyfetch
from js import console
try:
    response = await pyfetch("${path}")
except Exception as err:
    console.warn("PyScript: Access to local files (using 'paths:' in py-env) is not available when directly opening a HTML file; you must use a webserver to serve the additional files. See https://github.com/pyscript/pyscript/issues/257#issuecomment-1119595062 on starting a simple webserver with Python.")
    raise(err)
content = await response.bytes()
with open("${filename}", "wb") as f:
    f.write(content)
`);
}

function getLastPath(str) {
    return str.split("\\").pop().split("/").pop();
}
