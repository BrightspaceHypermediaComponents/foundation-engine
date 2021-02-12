
import { deepCopy } from '../../helper/deepCopy.js';
import { expect } from '@open-wc/testing';

describe('deepCopy', () => {
	const changedObject = {
		number: 42,
		string: 'Fluffy',
		undefined: 'not undefined',
		null: 'not null',
		function: () => 'new method',
		object: {
			prop1: 3,
			prop2: 4,
		},
		array: [ 2, 3, 4, 5]
	};
	const changeDefaultObject = (object) => {
		object.number = 42;
		object.string = 'Fluffy';
		object.undefined = 'not undefined';
		object.null = 'not null';
		object.function = () => 'new method';
		object.object.prop1 = 3;
		object.object.prop2 = 4;
		object.array.push(5);
		object.array.shift();
	};
	const compareObjectsValues = (a, b) => {
		expect(a.number, 'Number types equal').to.equal(b.number);
		expect(a.string, 'String types equal').to.equal(b.string);
		expect(a.undefined, 'Undefined types equal').to.equal(b.undefined);
		expect(a.null, 'Null types equal').to.equal(b.null);
		expect(a.function(), 'Function out come are equal').to.equal(b.function());
		expect(a.object, 'Object ref is not the same').to.not.equal(b.object);
		expect(a.object.prop1, 'Inner Object props are equal').to.equal(b.object.prop1);
		expect(a.object.prop2, 'Inner Object props are equal').to.equal(b.object.prop2);

		expect(a.array, 'Array ref is not the same.').to.not.equal(b.array);
		// Need toe check if the array values are the same and in the same order.
		let arrayEqual = true;
		if (a.array.length === b.array.length) {
			for (let i = 0; i < a.array.length; i++) {
				if (a.array[i] !== b.array[i]) arrayEqual = false;
			}
		} else {
			arrayEqual = false;
		}
		expect(arrayEqual, 'Array values are the same.').to.be.true;

	};
	const buildDefaultObject = () => {
		return {
			number: 231,
			string: 'Maya',
			undefined: undefined,
			null: null,
			function: () => 'function',
			object: {
				prop1: 1,
				prop2: 2,
			},
			array: [ 1, 2, 3, 4]
		};
	};

	describe('Normal, Easy Cases', () => {
		let mainObject, copiedObject;
		beforeEach(() => {
			mainObject = buildDefaultObject();
			copiedObject = deepCopy(mainObject);
		});

		it('should copy a standard object.', () => {
			expect(mainObject).to.not.equal(copiedObject);
			compareObjectsValues(mainObject, copiedObject);
		});

		it('should not change the second object when the first one changes', () => {
			changeDefaultObject(mainObject);
			compareObjectsValues(copiedObject, buildDefaultObject());
			compareObjectsValues(mainObject, changedObject);
		});

		it('should not change the first object when the second one changes', () => {
			changeDefaultObject(copiedObject);
			compareObjectsValues(mainObject, buildDefaultObject());
			compareObjectsValues(copiedObject, changedObject);
		});
	});

	describe('Cycle testing', () => {
		let mainObject, copiedObject;
		beforeEach(() => {
			mainObject = buildDefaultObject();
			mainObject.cycle = mainObject;
			copiedObject = deepCopy(mainObject);
		});

		it('should deep copy with a cycle in the objects.', () => {
			expect(mainObject, 'First object should be the same as cycle object.').to.equal(mainObject.cycle);
			expect(copiedObject, 'Second object should be the same as cycle object.').to.equal(copiedObject.cycle);
			expect(mainObject.cycle, 'Cycles objects should be different for each type.').to.not.equal(copiedObject.cycle);
		});

		it('should copy cycled objects such that if main object changes so does the cycled one and doesn\'t change the copied item.', () => {
			changeDefaultObject(mainObject);
			compareObjectsValues(copiedObject, buildDefaultObject());
			compareObjectsValues(mainObject, changedObject);
		});

		it('should copy cycled objects such that if copied object changes so does the cycled one and doesn\'t change the main item.', () => {
			changeDefaultObject(copiedObject);
			compareObjectsValues(mainObject, buildDefaultObject());
			compareObjectsValues(copiedObject, changedObject);
		});

		it('should update main object when changing the cycle object on the main object but not update the copied object', () => {
			changeDefaultObject(mainObject.cycle);
			compareObjectsValues(copiedObject, buildDefaultObject());
			compareObjectsValues(mainObject, changedObject);
		});

		it('should update copied object when changing the cycle object on the copied object but not update the main object', () => {
			changeDefaultObject(copiedObject.cycle);
			compareObjectsValues(mainObject, buildDefaultObject());
			compareObjectsValues(copiedObject, changedObject);
		});
	});
});
