import { authorize } from "../../../src";

const policiesPath = `${__dirname}/../../helpers/samplePolicies`;

describe("authorize.js - all rule", () => {
  it("should check for authorization correctly - success", () => {
    // foo.load expects user to have both "foo.m" and "foo.n" permissions
    const successCombinations = [
      ["foo.m", "foo.n"],
      ["foo.m", "foo.n", "foo.o"]
    ];

    successCombinations.forEach(permissions => {
      expect(authorize("foo", "load", permissions, policiesPath)).toEqual(true);
    });
  });

  it("should check for authorization correctly - failure", () => {
    // foo.load expects user to have both "foo.m" and "foo.n" permissions
    const failureCombinations = [[], ["foo.p", "foo.q"]];

    failureCombinations.forEach(permissions => {
      expect(authorize("foo", "load", permissions, policiesPath)).toEqual(
        false
      );
    });
  });
});
