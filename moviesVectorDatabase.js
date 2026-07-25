/*
  Challenge: Text Splitters, Embeddings, and Vector Databases!
    1. Use LangChain to split the content in movies.txt into smaller chunks.
    2. Use OpenAI's Embedding model to create an embedding for each chunk.
    3. Insert all text chunks and their corresponding embedding
       into a Supabase database table.
 */

import { openai, supabase } from './config.js'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

import { promises as fs } from 'fs'


// Query about movie data
const query = "tell me good short movies to watch to laugh"
main(query)


async function main(input) {
    const embedding = await createEmbedding(input)
    const match = await findNearestMatch(embedding)
    await getChatCompletion(match, input)
}




async function createEmbedding(input) {
    const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input
    })
    return embeddingResponse.data[0].embedding
}

// Query Supabase and return a semantically matching text chunk
async function findNearestMatch(embedding){
    const {data} = await supabase.rpc('match_movies', {
        query_embedding: embedding,
        match_threshold: 0.50,
        match_count: 4
    })

    // Manage multiple returned matches
    const match = data.map(obj => obj.content).join('\n')
    console.log(match)
    return match
}


// Use OpenAI to make the response conversational
const chatMessages = [{
    role: 'system',
    content: `You are an enthusiastic movie expert who loves recommending movies to people. 
    You will be given two pieces of information - some context about movies and a question. 
    Your main job is to formulate a short answer to the question using the provided context. 
    If you are unsure and cannot find the answer in the context, say, "Sorry, I don't know the answer." 
    Please do not make up the answer.` 
}]

async function getChatCompletion(text, query) {
    chatMessages.push({
        role: 'user',
        content: `Context: ${text} Question: ${query}`
    })

    const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: chatMessages,
        // temperature: 0.5,
        // frequency_penalty: 0.5
    })
    console.log(response.choices[0].message.content)
}




// =========================================================================================
// ================================ BASIC DB CONFIG ========================================
// =========================================================================================


/* Split movies.txt into text chunks.
Return LangChain's "output" – the array of Document objects. */
async function splitDocument(document) {
    // const response = await fetch(document)
    // const text = await response.text()

    try {

        const text = await fs.readFile(document, 'utf-8')

        if (!text) {
            throw new Error('reading file e was not ok.');
        }

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 250,
            chunkOverlap: 35,
        })

        const output = await splitter.createDocuments([text])
        return output

    } catch (e) {
        console.error('There was an issue with splitting text')
        throw e
    }

}

/* Create an embedding from each text chunk.
Store all embeddings and corresponding text in Supabase. */
async function createAndStoreEmbeddings() {

    try {

        const chunkData = await splitDocument("movies.txt")

        const data = await Promise.all(
            chunkData.map(async (chunk) => {
                const embeddingResponse = await openai.embeddings.create({
                    model: "text-embedding-ada-002",
                    input: chunk.pageContent
                })
                return {
                    content: chunk.pageContent,
                    embedding: embeddingResponse.data[0].embedding
                }
            })
        )

        const { error } = await supabase.from('movies').insert(data)

        if (error) {
            console.error('supabase insert failed: ', error)
            return
        }
        console.log("EMBEDDING AND STORING SUCCESS!")

    } catch (e) {
        console.error('ERROR: ', e.message)
    }

}