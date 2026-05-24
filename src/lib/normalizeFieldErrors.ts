export function normalizeFieldErrors(
    fieldErrors: Record<string, string[] | undefined> | undefined
): Record<string, string> {
    if (!fieldErrors) {
        return {}
    }

    return Object.fromEntries(
        Object.entries(fieldErrors)
            .filter((entry): entry is [string, string[]] => !!entry[1]?.length)
            .map(([field, messages]) => [field, messages[0]])
    )
}
