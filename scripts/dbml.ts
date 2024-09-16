import { pgGenerate } from 'drizzle-dbml-generator';
import * as schema from '../src/lib/server/db/schema';

function main() {
  pgGenerate({
    schema,
    out: './.dbml/schema.dbml'
  });

  console.log('Generated DBML successfully at ".dbml/schema.dbml"');
  process.exit(0);
}

main();
