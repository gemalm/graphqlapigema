Implemented following the youtube video: "Building a CRUD GraphQL API With Apollo Server V4, couchbase and TypeScript".
Thanks to @CooperCodes for the tutorial.

Setup Apollo Server / TypeScript
Connect / Setup mongodb
Create Routes (Create, Read, Update, Delete)
Test funcitonality out!

> npm init --yes // Creates a package.json to get started where we need to add "type": "module" so we can run await functions correctly inside the server

> npm install @apollo/server graphql

- tsconfig.json // This is to allow us to use typescript inside of our Apollo Server.
// Apollo Server by default has a recommended tsconfig for us to use:
{
    "compilerOptions": {
      "rootDirs": ["src"],
      "outDir": "dist",
      "lib": ["es2020"],
      "target": "es2020",
      "module": "esnext",
      "moduleResolution": "node",
      "esModuleInterop": true,
      "types": ["node"]
    }
}

> npm install --save-dev typescript @types/node

const server = new ApolloServer({
    typeDefs, // typeDefs -> Defining our GraphQL Types (Product, Query, Mutation)
    resolvers // resolers -> To create logic for certain GraphQL (Query, Mutation)
    // Query -> getProduct(id:String) -> inside of resolver we define the logic for grabbing the item from the database
})

apollo server:
query ExampleQuery {
  getProduct {
    name
  }
}


