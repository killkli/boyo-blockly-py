module.exports = {
	globDirectory: 'public/',
	globPatterns: [
		'**/*.{css,png,html,js,json,whl,tar,ttf,data,wasm,py,svg}'
	],
	swDest: 'public/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};