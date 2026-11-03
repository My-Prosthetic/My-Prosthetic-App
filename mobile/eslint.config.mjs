import expoConfig from "eslint-config-expo/flat.js"
import prettierConfig from "eslint-config-prettier"
import reactNative from "eslint-plugin-react-native"

export default [
	...expoConfig,
	prettierConfig,
	{
		plugins: { "react-native": reactNative },
		rules: {
			"react-native/no-unused-styles": "warn",
		},
	},
	{
		ignores: ["dist/*", ".expo/*"],
	},
]
