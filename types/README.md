# Types

Foundry's own types come from the
[`@dfreds/foundry-types`](https://www.npmjs.com/package/@dfreds/foundry-types)
package, installed with the rest of the dependencies by `npm install`. There is
nothing to copy or update by hand.

To move to a newer Foundry version, change the `@dfreds/foundry-types` version
in `package.json` and run `npm install`. The package version is the Foundry
version, so `14.365.0` describes Foundry 14.365.

The folders next to this file hold types for things Foundry does not provide —
other modules and libraries this module talks to. Those are still kept here by
hand.
