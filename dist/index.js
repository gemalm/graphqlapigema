import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import * as couchbase from "couchbase";
import { v4 as uuidv4 } from "uuid";
const typeDefs = `#graphql
    type Product {
        name: String
        price: Float
        quantity: Int
        tags: [String]
    }

    input ProductInput {
        name: String
        price: Float
        quantity: Int
        tags: [String]
    }

    type Query {
        getProduct(id: String): Product
        getAllProductsWithTerm(term: String): [ Product ]
    }

    type Mutation {
        createProduct(product: ProductInput): Product
        deleteProduct(id: String): Boolean
        updateProduct(id: String, product: ProductInput): Product
        setQuantity(id: String, quantity: Int): Boolean
    }

`;
/*
    Mutation -> changes data (deleting, creating the data, changing just one property)
    x createProduct
    x deleteProduct
    x updateProduct
    x getAllProductsWithTerm - Full text search within Couchbase to easily search documents
    x setQuantity - Use Couchbase to edit just one property in a document
*/
const resolvers = {
    Query: {
        async getProduct(_, args, contextValue) {
            // args : { id: "1" }, contextValue : { couchbaseCluster: Cluster }
            const { id } = args; // id: "1" object destructuring
            const bucket = contextValue.couchbaseCluster.bucket('store-bucket');
            const collection = bucket.scope('products-scope').collection('products');
            const getResult = await collection.get(id).catch((error) => {
                console.log(error);
                throw error; // "Document not found"
            });
            return getResult.content;
        },
        //getAllProductsWithTerm(term: String): [ Product ]
        async getAllProductsWithTerm(_, args, contextValue) {
            // search index ->
            // "product-index" -> products collection
            const { term } = args; // typescript
            // searches happen at the cluster level
            const result = await contextValue.couchbaseCluster.searchQuery("index-products", couchbase.SearchQuery.match(term), {
                limit: 2
            });
            // result.rows -> [ {id:""} ]
            const bucket = contextValue.couchbaseCluster.bucket('store-bucket');
            const collection = bucket.scope('products-scope').collection('products');
            var productsArray = [];
            for (var i = 0; i < result.rows.length; i++) {
                const id = result.rows[i].id;
                const getResult = await collection.get(id).catch((error) => {
                    console.log(error);
                    throw error; // "Document not found"
                });
                productsArray.push(getResult.content);
            }
            return productsArray;
        },
    },
    Mutation: {
        async createProduct(_, args, contextValue) {
            const { product } = args; // product: { name: "Gema", ... } object destructuring
            const bucket = contextValue.couchbaseCluster.bucket('store-bucket');
            const collection = bucket.scope('products-scope').collection('products');
            // insert (key, value) -> "1", product
            // we want to create unique IDs
            // UUID (Universal Unique Identifier) npm uuid
            // uuidv4() -> "32876876-32hg-27dh-22ff-cb9823765276" <- they will never be the same twice 
            const key = uuidv4(); // key: "32876876-32hg-27dh-22ff-cb9823765276"
            const createdMutationResult = await collection.insert(key, product).catch((error) => {
                console.log(error);
                throw error; // "Document not found"
            });
            return product;
        },
        async deleteProduct(_, args, contextValue) {
            const { id } = args; // id: "1" object destructuring
            const bucket = contextValue.couchbaseCluster.bucket('store-bucket');
            const collection = bucket.scope('products-scope').collection('products');
            const deletedMutationResult = await collection.remove(id).catch((error) => {
                console.log(error);
                throw error; // "Document not found"
            });
            return true;
        },
        async updateProduct(_, args, contextValue) {
            const { id, product } = args; // args: { id: "1", product: { product object }} object destructuring
            const bucket = contextValue.couchbaseCluster.bucket('store-bucket');
            const collection = bucket.scope('products-scope').collection('products');
            const updatedMutationResult = await collection.replace(id, product).catch((error) => {
                console.log(error);
                throw error; // "Document not found"
            });
            return product;
        },
        async setQuantity(_, args, contextValue) {
            // args: id and quantity
            const { id, quantity } = args;
            const bucket = contextValue.couchbaseCluster.bucket('store-bucket');
            const collection = bucket.scope('products-scope').collection('products');
            const updatedMutationResult = await collection.mutateIn(id, [
                couchbase.MutateInSpec.replace("quantity", quantity)
            ]).catch((error) => {
                console.log(error);
                throw error; // "Document not found"
            });
            return true;
        }
    }
};
const server = new ApolloServer({
    typeDefs, // typeDefs -> Defining our GraphQL Types (Product, Query, Mutation)
    resolvers // resolers -> To create logic for certain GraphQL (Query, Mutation)
    // Query -> getPrpduct(id:String) -> inside of resolver we define the logic for grabbing the item from the database
});
// User inputs
const clusterConnStr = "couchbases://cb.ypfiv2dobvr-rxja.cloud.couchbase.com"; // Replace this with Connection String
const username = "gemacodes"; // Replace this with username from database access credentials
const password = "Gemacodes123!"; // Replace this with password from database access credentials
// // Get a reference to the cluster
// const cluster = await couchbase.connect(clusterConnStr, {
// 	username: username,
// 	password: password,
// 	// Use the pre-configured profile below to avoid latency issues with your connection.
// 	configProfile: "wanDevelopment",
// });
const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async ({ req, res }) => ({
        couchbaseCluster: await couchbase.connect(clusterConnStr, {
            username: username,
            password: password,
            // Use the pre-configured profile below to avoid latency issues with your connection.
            configProfile: "wanDevelopment",
        })
    })
    // inside of our API routes -> context.couchbaseCluster
});
console.log("Server running on " + url);
