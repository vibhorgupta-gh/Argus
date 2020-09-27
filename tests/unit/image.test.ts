import { Image } from "../../src/image";

describe('isUpdated', () => {
    test('when inputs match', () => {
        expect(Image.isUpdatedImage("abc", "abc")).toBe(true);
    });
    test('when inputs do not match', () => {
        expect(Image.isUpdatedImage("abc", "def")).toBe(false);
    });
});

