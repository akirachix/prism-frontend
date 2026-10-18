import { hasPage } from "./TestApp";

export function testWithPages(...addresses: string[]): typeof test {
  return addresses.every(hasPage) ? test : test.skip;
}
