The initial version can only support Node.js repro, as it's easy to implement.

The repro setup can be copied from https://github.com/aws-samples/aws-sdk-js-tests, with API calls in the source code instead of "utils" package.
The build/publish can be copied from https://github.com/aws/aws-sdk-js-codemod if required.

The PoC for Node.js can be created internally

Once PoC is approved by OSDS and JS SDK team, we can submit Open Source request in awslabs org, say with package name aws-sdk-js-repro.
Other feature development, like adding repro for browser or react-native, can happen on GitHub.

