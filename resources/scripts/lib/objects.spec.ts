import { isObject } from '@/lib/objects';

describe('@/lib/objects.ts', function () {
    describe('isObject()', function () {
        it('should return true for objects', function () {
            expect(isObject({})).toBe(true);
            expect(isObject({ foo: 123 })).toBe(true);
            expect(isObject(Object.freeze({}))).toBe(true);
        });

        it('should return false for null', function () {
            expect(isObject(null)).toBe(false);
        });

        const truthyCases = [
            undefined,
            123,
            'foobar',
            () => ({}),
            Function,
            String(123),
            isObject,
            () => null,
            [],
            [1, 2, 3],
        ];
        truthyCases.forEach((value) => {
            it('should return false for ' + String(value), () => {
                expect(isObject(value)).toBe(false);
            });
        });
    });
});
