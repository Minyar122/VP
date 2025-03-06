var userDescription = "banjour je swis un hom"

fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
        "Authorization": "Bearer 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",
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        "model": "google/gemini-2.0-flash-lite-001",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "please fix this french phrase, only return the fixed phrase, do not return anything else: " + userDescription
                    }
                ]
            }
        ]
    })
})
.then(response => response.json()) // Parse the response as JSON
.then(data => {
    console.log(data.choices[0].message.content); // Log the response data
})
.catch(error => {
    console.error('Error:', error); // Log any errors
});
