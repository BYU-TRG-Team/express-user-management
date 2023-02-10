export {}

declare global{
  namespace jest {
      interface Matchers<R> {
          toBeArrayWithElements(expected: any[]): CustomMatcherResult;
      }
  }
}