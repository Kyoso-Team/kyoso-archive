import * as schema from '../src/lib/db/schema';
import { pgGenerate } from 'drizzle-dbml-generator';

function main() {
  pgGenerate({
    schema,
    out: './dbml/schema.dbml'
  });

  console.log('Generated DBML successfully at \'dbml/schema.dbml\'');
  process.exit(0);
}

main();