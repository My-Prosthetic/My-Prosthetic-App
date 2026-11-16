export function getPasswordRequirements(value: string, repeatedValue: string) {
	return [
		{
			id: "minLength",
			label: "signup.passwordRules.minLength" as const,
			valid: Array.from(value).length >= 12,
		},
		{
			id: "uppercase",
			label: "signup.passwordRules.uppercase" as const,
			valid: /[A-Z]/.test(value),
		},
		{
			id: "lowercase",
			label: "signup.passwordRules.lowercase" as const,
			valid: /[a-z]/.test(value),
		},
		{ id: "number", label: "signup.passwordRules.number" as const, valid: /[0-9]/.test(value) },
		{
			id: "symbol",
			label: "signup.passwordRules.symbol" as const,
			valid: /[\p{P}\p{S}]/u.test(value),
		},
		{
			id: "match",
			label: "signup.passwordRules.match" as const,
			valid: value.length > 0 && value === repeatedValue,
		},
	]
}
