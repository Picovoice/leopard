import { createFilter } from "@rollup/pluginutils";
import { readFileSync } from "fs";

export function base64(opts = {
  include: [],
  exclude: []
}) {
  const filter = createFilter(opts.include, opts.exclude);
  return {
    name: "base64",
    transform(data: any, id: any) {
      if (filter(id)) {
        const fileData = readFileSync(id);
        return  `export default "${fileData.toString('base64')}";`
      }
    }
  };
}
