import openai from './config.js';

const content = [
  "Beyond Mars: speculating life on distant planets.",
  "Jazz under stars: a night in New Orleans' music scene.",
  "Mysteries of the deep: exploring uncharted ocean caves.",
  "Rediscovering lost melodies: the rebirth of vinyl culture.",
  "Tales from the tech frontier: decoding AI ethics.",
]; 

/** Create embeddings representing the input text */
// Make it a Promise to get the entire object as one thing
// Also map each array element/string, with its respective embedding.
async function main(input) {
  await Promise.all(
    input.map( async(textChunk) => {
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: textChunk,
        });
        const data = { content: textChunk, embedding: embeddingResponse.data[0].embedding }
        console.log(data);  
    })    
  );
  console.log('Embedding complete!');
}
main(content);



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