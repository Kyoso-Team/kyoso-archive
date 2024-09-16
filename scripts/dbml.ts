import { pgGenerate } from 'drizzle-dbml-generator';
import * as schema from '$db';

pgGenerate({
  schema,
  out: './.dbml/schema.dbml'
});

console.log('Generated DBML successfully at ".dbml/schema.dbml"');
process.exit(0);
