import {openai, supabase} from './config.js';
import podcasts from './content.js'


/** Create embeddings representing the input text */
// Make it a Promise to get the entire object as one thing
// Also map each array element/string, with its respective embedding.
async function main(input) {
  const data = await Promise.all(
    input.map( async (textChunk) => {
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: textChunk,
        });
        return {
          content: textChunk,
          embedding: embeddingResponse.data[0].embedding
        }
    })    
  );
  
  // Insert all data at once with the content and embeddings into Supabase
  // on the 'documents' table that was created
  // If its an error, make the error a const from supabase directly and log it
  const { error } = await supabase.from('documents').insert(data);

  if (error) {
    console.error('Supabase insert failed:', error);
    return;
  }

  console.log('Embedding and storing complete!');
  
}

main(podcasts);



/* Alternative way of doing the same thing pretty much
async function main() {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: content,
  });

  const pairedEmbeddings = response.data.map((embeddingObject, index) => {
    return {
      content: content[index],
      embedding: embeddingObject.embedding,
    };
  });

  console.log(pairedEmbeddings);

  return pairedEmbeddings;
}

main();
*/