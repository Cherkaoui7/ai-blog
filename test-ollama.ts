async function test() {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3.1:8b',
      prompt: 'Write a blog intro about discipline',
      stream: false,
    }),
  })

  const data = await res.json()

  console.log(data.response)
}

test()