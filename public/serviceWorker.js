const staticPyPWA = "boyo-blockly-py"
const assets = [
    "./js/pwa-scaffold.js",
    "./js/py-worker.js",
    "./js/webworker.js",
    "./js/jsdom.js",
    "./js/download.min.js",
    "./js/indexeddb-fs.js",
    "./js/floatingui_core.js",
    "./js/floatingui_dom.js",
    "./js/popupcontainer.js",
    "./main.js",

    "./turtle/svg.py",
    "./turtle/myturtke.py",
    "./turtle/custom_turtle_for_Pyodide-1.0-py3-none-any.whl",
    "./pyscript/pyodideworker.py",

    "./pyodide/pyodide.js",
    "./pyodide/packages.json",
    "./pyodide/repodata.json",
    "./pyodide/pyodide_py.tar",
    "./pyodide/pyodide.asm.js",
    "./pyodide/pyodide.asm.data",
    "./pyodide/pyodide.asm.wasm",
    "./pyodide/packaging-21.3-py3-none-any.whl",
    "./pyodide/micropip-0.1.0-py3-none-any.whl",
    "./pyodide/pyparsing-3.0.9-py3-none-any.whl",
    "./pyodide/numpy-1.22.4-cp310-cp310-emscripten_3_1_21_wasm32.whl",
    "./pyodide/future-0.18.2-py3-none-any.whl",
    "./pyodide/distutils.tar",

    "./images/icons/android-chrome-192x192.png",
    "./images/icons/android-chrome-512x512.png",
    "./images/icons/android-chrome-maskable-192x192.png",
    "./images/icons/android-chrome-maskable-512x512.png",
    "./images/icons/apple-touch-icon-120x120.png",
    "./images/icons/apple-touch-icon-152x152.png",
    "./images/icons/apple-touch-icon-180x180.png",
    "./images/icons/apple-touch-icon-60x60.png",
    "./images/icons/apple-touch-icon-76x76.png",
    "./images/icons/apple-touch-icon.png",
    "./images/icons/favicon-16x16.png",
    "./images/icons/favicon-32x32.png",
    "./images/icons/msapplication-icon-144x144.png",
    "./images/icons/mstile-150x150.png",
    "./images/icons/safari-pinned-tab.svg",

    "./css/milligram.min.css",
    "./icons/stylesheet.css",
    "./css/site.css",
    "./blockly/blockly_compressed.js",
    "./blockly/blocks_compressed.js",
    "./blockly/python_compressed.js",
    "./blockly/msg/js/zh-hant.js",
    "./codemirror/codemirror.css",
    "./codemirror/fullscreen.css",
    "./codemirror/show-hint.css",
    "./codemirror/codemirror.js",
    "./codemirror/show-hint.js",
    "./codemirror/python-hint.js",
    "./codemirror/fullscreen.js",
    "./codemirror/python.js",
    "./blockmirror/block_mirror.css",
    "./blockmirror/skulpt_parser.js",
    "./blockmirror/block_mirror.js",
    "./icons/stylesheet.css",
    "./icons/icon-works-webfont.eot",
    "./icons/icon-works-webfont.svg",
    "./icons/icon-works-webfont.ttf",
    "./icons/icon-works-webfont.woff",
]

self.addEventListener("install", installEvent => {
    installEvent.waitUntil(
        caches.open(staticPyPWA).then(cache => {
            cache.addAll(assets).then(r => {
                console.log("Cache assets downloaded");
            }).catch(err => console.log("Error caching item", err))
            console.log(`Cache ${staticPyPWA} opened.`);
        }).catch(err => console.log("Error opening cache", err))
    )
})

self.addEventListener("fetch", fetchEvent => {
    if (fetchEvent.request.url.match('^https://0\.peerjs\.com')||
        fetchEvent.request.url.match('^https://killkli\.ddns\.net')) {
        return false;
    }
    fetchEvent.respondWith(
        caches.match(fetchEvent.request).then(res => {
            const result = res;
            if (res !== undefined) {
                const fetchPromise = fetch(fetchEvent.request);
                fetchPromise.then(fetchRes => {
                    caches.open(staticPyPWA).then(cache => {
                        cache.put(fetchEvent.request, fetchRes);
                        // console.log("New cached saved!", fetchEvent.request.url);
                    })
                }).catch(err => console.log("Error fetching", err))
                return result;
            } else {
                const newFetch = fetch(fetchEvent.request);
                // console.log("serving new fetched", fetchEvent.request.url);
                return newFetch;
            }
        }).catch(err => console.log("Cache fetch error: ", err))
    )
})