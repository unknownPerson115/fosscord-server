const { initDatabase, closeDatabase } = require("../dist/util/Database");
const { User } = require("../dist/entities/User");
jest.setTimeout(10000);

beforeAll((done) => {
	initDatabase().then(() => {
		new User().validate(); // warm up schema/model
		done();
	});
});

afterAll(() => {
	closeDatabase();
});

describe("Validate model class properties", () => {
	test("object instead of string", async () => {
		expect(() => {
			new User({}, { id: {} }).validate();
		}).toThrow();
	});

	test("validation should be faster than 20ms", () => {
		expect(() => {
			new User().validate();
		}).toBeFasterThan(20);
	});

	test("should not set opts", () => {
		const user = new User({ opts: { id: 0 } });
		expect(user.opts.id).not.toBe(0);
	});
});
