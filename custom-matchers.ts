import { cloneDeep, isEqual } from "lodash";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
        toBeArrayWithElements(expected: any[]): CustomMatcherResult;
    }
  }
}

expect.extend({
  toBeArrayWithElements(received, comparedArray) {
    const pass = isEqual(cloneDeep(received).sort(), cloneDeep(comparedArray).sort());
    const message = () => `expected ${received} to contain the same elements as ${comparedArray}`;
    return {
      message,
      pass,
    };
  },
});

export {};