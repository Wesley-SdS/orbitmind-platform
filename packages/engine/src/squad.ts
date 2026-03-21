import { parse as parseYaml } from "yaml";
import { squadYamlSchema, type SquadYaml } from "@orbitmind/shared";

export class SquadParser {
  parse(yamlContent: string): SquadYaml {
    const raw = parseYaml(yamlContent);
    return squadYamlSchema.parse(raw);
  }

  validate(config: unknown): { valid: boolean; errors: string[] } {
    const result = squadYamlSchema.safeParse(config);
    if (result.success) {
      return { valid: true, errors: [] };
    }
    return {
      valid: false,
      errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
}
