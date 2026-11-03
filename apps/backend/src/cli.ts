import { bootstrap } from "./composition";
import { runCliCommand } from "./presentation/cli/run";

const app = bootstrap();
try {
  const out = await runCliCommand(app, process.argv.slice(2));
  console.log(out);
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}
