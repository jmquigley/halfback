module.exports = {
	bail: true,
	collectCoverage: true,
	coveragePathIgnorePatterns: [
		"<rootDir>/__tests__/helpers",
		"<rootDir>/node_modules"
	],
	moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],
	notify: false,
	setupFiles: ["<rootDir>/jest.setup.js"],
	testEnvironment: "jest-environment-jsdom-fourteen",
	testPathIgnorePatterns: [
		"<rootDir>/__tests__/helpers",
		"<rootDir>/node_modules"
	],
	verbose: true
};
