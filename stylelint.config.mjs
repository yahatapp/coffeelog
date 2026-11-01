export default {
  rules: {
    "block-no-empty": true,
    "color-no-invalid-hex": true,
    "declaration-block-no-duplicate-properties": true,
    "declaration-block-no-duplicate-custom-properties": true,
    "property-no-unknown": true,
    "unit-no-unknown": true,
    "selector-pseudo-class-no-unknown": true,
    "selector-pseudo-element-no-unknown": true,
    "selector-max-compound-selectors": 3,
    "custom-property-pattern": "^(cl-|_)[a-z0-9-]+$",
    "at-rule-no-unknown": true,
  },
  overrides: [
    { files: ["**/*.module.css"], rules: { "selector-class-pattern": "^[a-z][a-zA-Z0-9]*$" } },
  ],
};
