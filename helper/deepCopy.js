export function deepCopy(inObject, copiedObjects = null) {
	if (typeof inObject !== 'object' || inObject === null) {
		return inObject; // Return the value if inObject is not an object
	}

	if (inObject instanceof Date) {
		return new Date(inObject.getTime());
	}

	// Create an array or object to hold the values
	const outObject = Array.isArray(inObject) ? [] : {};

	// What if there is a cycle?
	copiedObjects = copiedObjects === null ? new WeakMap() : copiedObjects;
	if (copiedObjects.has(inObject)) {
		return copiedObjects.get(inObject);
	}
	copiedObjects.set(inObject, outObject);

	let value;
	for (const key in inObject) {
		value = inObject[key];

		// Recursively (deep) copy for nested objects, including arrays
		outObject[key] = deepCopy(value, copiedObjects);
	}

	return outObject;
}
